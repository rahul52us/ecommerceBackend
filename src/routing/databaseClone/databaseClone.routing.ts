import { Router } from "express";
import authenticate from "../../modules/config/authenticate";
import mongoose from "mongoose";
import Company from "../../schemas/company/Company";
import SendMail from "../../config/sendMail/sendMail";
import * as fs from "fs";
import * as path from "path";
const archiver = require("archiver");

const databaseCloneRouter = Router();
const { EJSON } = mongoose.mongo.BSON;

// Route to download the generated zip file securely
databaseCloneRouter.get("/download-export/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../../../public/downloads", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("File not found or expired.");
  }
});

databaseCloneRouter.post("/clone-company", authenticate, async (req: any, res) => {
  try {
    // 1. Verify Superadmin role
    const userRole = req.bodyData?.role?.toLowerCase() || req.bodyData?.userType?.toLowerCase();
    if (userRole !== "superadmin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only Superadmins can clone databases.",
      });
    }

    const { companyId, email } = req.body;
    if (!companyId) {
      return res.status(400).json({
        status: "error",
        message: "companyId is required",
      });
    }

    // 2. Verify target company exists
    const targetCompany = await Company.findById(companyId);
    if (!targetCompany) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    // 3. Prepare target export details
    const cleanCompanyName = targetCompany.company_name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .substring(0, 30);
    const timestamp = Date.now();
    
    // Create temp directory for JSON files
    const exportId = `dental_export_${cleanCompanyName}_${timestamp}`;
    const tempDir = path.join(__dirname, "../../../public/downloads", exportId);
    const zipFilePath = path.join(__dirname, "../../../public/downloads", `${exportId}.zip`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Target email (default to Superadmin's username/email if not provided)
    const recipientEmail = email || req.bodyData.username;

    // Run exporting process asynchronously so API returns quickly
    // and sends an email when complete.
    setTimeout(async () => {
      try {
        console.log(`Starting JSON export for company: ${targetCompany.company_name} -> ${exportId}.zip`);
        
        const sourceDb = (mongoose.connection as any).db;
        const collections = await sourceDb.listCollections().toArray();
        const targetCompanyObjId = new mongoose.Types.ObjectId(companyId);

        // Pre-fetch all user IDs belonging to this target company to securely filter related collections
        const usersCollection = sourceDb.collection("users");
        const companyUsers = await usersCollection.find({ company: targetCompanyObjId }, { projection: { _id: 1 } }).toArray();
        const companyUserIds = companyUsers.map((u: any) => u._id);

        for (const col of collections) {
          if (col.type === "view") continue;
          const colName = col.name;

          // Don't copy system or transient collections
          if (colName.startsWith("system.")) continue;

          const sourceCol = sourceDb.collection(colName);
          let query = {};

          if (colName === "companies") {
            // For companies collection, only copy the targeted company
            query = { _id: targetCompanyObjId };
          } else {
            // 1. Check if collection has a direct company reference
            const hasCompanyDoc = await sourceCol.findOne({ company: { $exists: true } });
            
            if (hasCompanyDoc) {
              query = { company: targetCompanyObjId };
            } else {
              // 2. Check if collection is tied to users/patients/doctors (like profiledetails)
              const hasUserDoc = await sourceCol.findOne({ user: { $exists: true } });
              const hasPatientDoc = await sourceCol.findOne({ patient: { $exists: true } });
              const hasDoctorDoc = await sourceCol.findOne({ doctor: { $exists: true } });
              
              if (hasUserDoc) {
                query = { user: { $in: companyUserIds } };
              } else if (hasPatientDoc) {
                query = { patient: { $in: companyUserIds } };
              } else if (hasDoctorDoc) {
                query = { doctor: { $in: companyUserIds } };
              } else {
                // 3. Collection has no company or user refs. Explicit allowlist for global configs.
                const safeList = ["roles", "permissions"];
                if (safeList.includes(colName.toLowerCase())) {
                  query = {}; // Safe to export fully
                } else {
                  console.warn(`[SECURITY] Skipping collection '${colName}' - no company/user reference found.`);
                  continue; // SKIP EXPORTING TO PREVENT DATA LEAKS
                }
              }
            }
          }

          const totalDocs = await sourceCol.countDocuments(query);
          if (totalDocs > 0) {
            console.log(`Exporting ${totalDocs} documents from ${colName}...`);
            const cursor = sourceCol.find(query);
            
            // Create a file stream for this collection
            const filePath = path.join(tempDir, `${colName}.json`);
            const writeStream = fs.createWriteStream(filePath);
            
            // Start a JSON array
            writeStream.write('[\n');
            let isFirst = true;

            while (await cursor.hasNext()) {
              const doc = await cursor.next();
              
              if (!isFirst) {
                writeStream.write(',\n');
              }
              
              // Use EJSON to preserve ObjectIds and Dates for MongoDB Compass
              const jsonString = EJSON.stringify(doc);
              writeStream.write(jsonString);
              isFirst = false;
            }
            
            // Close JSON array
            writeStream.write('\n]');
            writeStream.end();
            
            // Wait for file to finish writing
            await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));
          }
        }

        console.log(`JSON export complete. Zipping to: ${zipFilePath}`);

        // Zip the directory
        await new Promise<void>((resolve, reject) => {
          const output = fs.createWriteStream(zipFilePath);
          const archive = archiver('zip', { zlib: { level: 9 } });

          output.on('close', () => resolve());
          archive.on('error', reject);

          archive.pipe(output);
          archive.directory(tempDir, false);
          archive.finalize();
        });

        // Delete the temporary JSON folder to save space
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        console.log(`Zipping complete. Sending email...`);

        // Send confirmation email with Download Link
        const backendBaseUrl = process.env.BACKEND_BASE_URL || `${req.protocol}://${req.get('host')}`;
        let downloadLink = `${backendBaseUrl}/api/database/download-export/${exportId}.zip`;
        let attachmentBase64String: string | undefined = undefined;

        // Check file size (in MB)
        const stats = fs.statSync(zipFilePath);
        const fileSizeMB = stats.size / (1024 * 1024);

        // NOTE: Email attachment limits are usually 25MB. However, Base64 encoding 
        // increases the file size by ~33%. So a 22MB file becomes ~29MB and gets bounced!
        // We set the strict zip limit to 18MB.
        if (fileSizeMB < 18) {
          console.log(`Zip is ${fileSizeMB.toFixed(2)}MB (<18MB limit). Attaching directly to email...`);
          const fileData = fs.readFileSync(zipFilePath);
          attachmentBase64String = `data:application/zip;base64,${fileData.toString('base64')}`;
          downloadLink = "Attached directly to this email (see attachments below).";
        } else {
          console.log(`Zip is ${fileSizeMB.toFixed(2)}MB (>25MB). Sending URL link instead...`);
        }

        // Fetch global config for logo
        const GlobalConfig = require("../../schemas/globalConfig/GlobalConfig").default;
        const globalConfig = await GlobalConfig.findOne();
        const logoUrl = globalConfig?.globalLogo || undefined;

        await SendMail(
          recipientEmail,
          "Database Export Complete",
          "clone_complete_template.html", // Reusing the same template
          {
            name: req.bodyData.name || "Superadmin",
            targetCompanyName: targetCompany.company_name,
            targetDbName: downloadLink, // Pass the link or the attachment message
            timestamp: new Date().toLocaleString(),
            logoUrl: logoUrl
          },
          attachmentBase64String
        );
        
        // If we attached the file directly to the email, we don't need to host it!
        // Delete the zip file from the server to instantly free up disk space.
        if (fileSizeMB < 18 && fs.existsSync(zipFilePath)) {
          fs.unlinkSync(zipFilePath);
          console.log(`Deleted ${zipFilePath} from server because it was attached to the email.`);
        }

        console.log(`Email sent successfully!`);

      } catch (err: any) {
        console.error("Async exporting failed:", err);
      }
    }, 0);

    return res.status(202).json({
      status: "success",
      message: "Database export process started successfully. You will receive an email with a download link once it is complete.",
    });

  } catch (error: any) {
    console.error("Clone API error:", error);
    return res.status(500).json({
      status: "error",
      message: error?.message || "Internal server error occurred.",
    });
  }
});

export default databaseCloneRouter;
