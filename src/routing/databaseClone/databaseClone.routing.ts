import { Router } from "express";
import authenticate from "../../modules/config/authenticate";
import mongoose from "mongoose";
import Company from "../../schemas/company/Company";
import SendMail from "../../config/sendMail/sendMail";

const databaseCloneRouter = Router();

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

    // 3. Prepare target DB details
    const cleanCompanyName = targetCompany.company_name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .substring(0, 30);
    const timestamp = Date.now();
    const targetDbName = `dental_company_${cleanCompanyName}_${timestamp}`;

    // Target email (default to Superadmin's username/email if not provided)
    const recipientEmail = email || req.bodyData.username;

    // Run cloning process asynchronously so API returns quickly
    // and sends an email when complete.
    setTimeout(async () => {
      try {
        console.log(`Starting clone of database for company: ${targetCompany.company_name} -> ${targetDbName}`);
        
        const sourceDb = (mongoose.connection as any).db;
        const targetDb = (mongoose.connection as any).client.db(targetDbName);
        const collections = await sourceDb.listCollections().toArray();
        const targetCompanyObjId = new mongoose.Types.ObjectId(companyId);

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
            // Check if collection has records referencing this company
            const hasCompanyDoc = await sourceCol.findOne({ company: { $exists: true } });
            if (hasCompanyDoc) {
              query = { company: targetCompanyObjId };
            } else {
              // Copy full collection if it's a configuration or shared collection (no company reference)
              // E.g. roles, permissions, settings, etc.
              query = {};
            }
          }

          const totalDocs = await sourceCol.countDocuments(query);
          if (totalDocs > 0) {
            const cursor = sourceCol.find(query);
            let batch: any[] = [];
            let clonedCount = 0;

            while (await cursor.hasNext()) {
              const doc = await cursor.next();
              batch.push(doc);

              if (batch.length >= 1000) {
                await targetDb.collection(colName).insertMany(batch);
                clonedCount += batch.length;
                batch = [];
              }
            }

            if (batch.length > 0) {
              await targetDb.collection(colName).insertMany(batch);
              clonedCount += batch.length;
            }

            console.log(`Cloned ${clonedCount} documents for collection: ${colName}`);
          }
        }

        console.log(`Clone complete: ${targetDbName}. Sending confirmation email to: ${recipientEmail}`);

        // Send confirmation email
        await SendMail(
          recipientEmail,
          "Database Clone Complete",
          "clone_complete_template.html",
          {
            name: req.bodyData.name || "Superadmin",
            targetCompanyName: targetCompany.company_name,
            targetDbName: targetDbName,
            timestamp: new Date().toLocaleString(),
          }
        );

      } catch (err: any) {
        console.error("Async cloning failed:", err);
      }
    }, 0);

    return res.status(202).json({
      status: "success",
      message: "Database cloning process started successfully. You will receive an email once it is complete.",
      targetDbName,
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
