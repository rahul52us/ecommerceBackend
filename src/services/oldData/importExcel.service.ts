import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import UserModel from '../../schemas/User/User';
import ProfileDetails from '../../schemas/User/ProfileDetails';
import { OldData } from '../../schemas/legacy/OldData';

const BATCH_SIZE = 500;

// Helper to generate a unique patient code
async function generateUniquePatientCode(): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let code = '';
  let isUnique = false;
  while (!isUnique) {
    code = 'pt-' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const existing = await UserModel.findOne({ code });
    if (!existing) isUnique = true;
  }
  return code;
}

// Parse gender string to number (1 = Male, 2 = Female, 3 = Other)
function parseGender(sex: string): number {
  const s = (sex || '').toLowerCase().trim();
  if (s === 'm' || s === 'male') return 1;
  if (s === 'f' || s === 'female') return 2;
  return 3;
}

export const importExcelService = async (req: any, res: any) => {
  try {
    const { file: base64File } = req.body;

    if (!base64File) {
      return res.status(400).json({ success: false, message: 'No Excel file provided. Send file as base64 string in body field "file"' });
    }

    const companyId = req.bodyData?.company;
    const createdBy = req.userId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company not found on authenticated user' });
    }

    // ── Decode Base64 to Buffer & Parse Excel ────────────────────────────────
    const uint8 = Uint8Array.from(Buffer.from(base64File, 'base64'));
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(uint8.buffer as any);

    const sheet = workbook.getWorksheet('Patient_History');
    if (!sheet) {
      return res.status(400).json({ success: false, message: "Sheet 'Patient_History' not found in uploaded Excel file" });
    }

    // Build header map from first row
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString() || '';
    });

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const obj: any = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headers[colNumber];
        if (key) obj[key] = cell.value ?? '';
      });
      rows.push(obj);
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty or has no data rows' });
    }

    // ── Group by Patient_Code to get unique patients ──────────────────────────
    const patientMap = new Map<string, any>(); // Patient_Code -> first row (patient info)
    for (const row of rows) {
      const code = (row.Patient_Code || '').toString().trim().toUpperCase();
      if (code && !patientMap.has(code)) {
        patientMap.set(code, row);
      }
    }

    console.log(`[Excel Import] Total rows: ${rows.length}, Unique patients: ${patientMap.size}`);

    // ── Fetch already existing patients (by their legacy code stored in User.code) ──
    const allLegacyCodes = Array.from(patientMap.keys());

    // We store legacy Patient_Code normalised to lowercase in User.code during import
    const existingUsers = await UserModel.find({
      code: { $in: allLegacyCodes.map(c => c.toLowerCase()) },
      company: companyId
    }).select('code _id').lean();

    const existingCodeToId = new Map<string, string>();
    existingUsers.forEach((u: any) => {
      existingCodeToId.set(u.code.toUpperCase(), u._id.toString());
    });

    // ── Create new Users + ProfileDetails for patients that don't exist ────────
    const newUserDocs: any[] = [];
    const newProfileDocs: any[] = [];
    const legacyCodeToMongoId = new Map<string, string>(); // Patient_Code -> User._id

    // Copy existing ones into the map first
    existingCodeToId.forEach((mongoId, legacyCode) => {
      legacyCodeToMongoId.set(legacyCode, mongoId);
    });

    for (const [legacyCode, row] of patientMap.entries()) {
      if (existingCodeToId.has(legacyCode)) continue; // Already exists, skip creation

      const userId = new mongoose.Types.ObjectId();
      const patientCode = legacyCode.toLowerCase(); // store as lowercase in code field

      const phone = (row.Phone || '').toString().trim();
      const name = (row.Patient_Name || '').toString().trim() || 'Unknown';
      const sex = (row.Sex || '').toString().trim();
      const email = (row.Email || '').toString().trim();
      const address = (row.Address || '').toString().trim();
      const group = (row.Group || '').toString().trim();
      const registeredOn = (row.Registered_On || '').toString().trim();
      const referredBy = (row.Referred_By || '').toString().trim();
      const age = (row.Age || '').toString().trim();

      newUserDocs.push({
        _id: userId,
        name,
        code: patientCode,
        mobileNumber: phone,
        company: companyId,
        userType: 'patient',
        password: 'Admin@123', // default password — should be hashed in prod ideally
        is_active: true,
        role: 'user',
        previousRecord: true,   // ← marks as legacy/old record
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      newProfileDocs.push({
        user: userId,
        previousRecord: true,   // ← marks as legacy/old record
        personalInfo: {
          name,
          type: 'patient',
          company: companyId,
          createdBy,
          mobileNumber: phone,
          gender: parseGender(sex),
          phones: [
            { number: phone, primary: true },
            { number: '', primary: false },
            { number: '', primary: false },
            { number: '', primary: false },
          ],
          emails: [
            { email: email, primary: true },
            { email: '', primary: false },
          ],
          addresses: {
            residential: address,
            office: '',
            other: '',
          },
          bio: '',
          references: [{ refrenceBy: null, refrenceNote: '' }],
          insurances: [],
          degreeInfo: [{ name: '', universary: '', year: '' }],
          vaccinations: [],
          // Legacy-specific fields from Excel
          legacyPatientCode: legacyCode,
          age,
          group,
          registeredOn,
          referredBy,
          medicalHistory: {
            allergies: { checked: false, text: '' },
            bloodPressure: { option: '', text: '' },
            heartDisease: { checked: false, text: '' },
            pacemaker: { checked: false, text: '' },
            pacemakerMeds: { aspirin: false, anticoagulants: false, bloodPressureMeds: false, nitroglycerin: false },
            diabetes: { checked: false, text: '', insulin: false },
            asthma: { option: '', text: '' },
            artificialJointOrValve: { option: '', text: '' },
            thyroid: { option: '', type: '', text: '' },
            kidneyDisease: { option: '', text: '' },
            tuberculosis: { option: '', text: '' },
            hepatitis: { option: '', text: '' },
            bloodTransfusion: { option: '', text: '' },
            cancer: { option: '', text: '' },
            neurologicCondition: { option: '', text: '' },
            epilepsy: { option: '', text: '' },
            aids: { option: '', text: '' },
            hiv: { option: '', text: '' },
            anaemia: { option: '', text: '' },
            otherMedicalIssue: { option: '', text: '' },
            smoking: { option: '', text: '' },
            chewingTobacco: { option: '', text: '' },
            alcohol: { option: '', text: '' },
            medications: { antibiotics: false, antidepressants: false, steroids: false, osteoporosisMeds: false, other1: '', other2: '' },
            women: { pregnant: false, dueDate: '', breastFeeding: false, pcodPcos: { option: '', text: '' }, hormones: false }
          },
        },
      });

      legacyCodeToMongoId.set(legacyCode, userId.toString());
    }

    // Batch insert new Users and ProfileDetails
    let insertedPatients = 0;
    for (let i = 0; i < newUserDocs.length; i += BATCH_SIZE) {
      const userBatch = newUserDocs.slice(i, i + BATCH_SIZE);
      const profileBatch = newProfileDocs.slice(i, i + BATCH_SIZE);

      const insertedUsers = await UserModel.insertMany(userBatch, { ordered: false }).catch(e => {
        console.warn('[Excel Import] User batch warning:', e.message);
        return userBatch; // still map their IDs
      });

      await ProfileDetails.insertMany(profileBatch, { ordered: false }).catch(e => {
        console.warn('[Excel Import] ProfileDetails batch warning:', e.message);
      });

      // Link profile_details back to user using bulkWrite (faster than individual updates)
      const savedProfiles = await ProfileDetails.find({
        user: { $in: profileBatch.map((p: any) => p.user) }
      }).select('_id user').lean();

      if (savedProfiles.length > 0) {
        const bulkOps = savedProfiles.map((p: any) => ({
          updateOne: {
            filter: { _id: p.user },
            update: { $set: { profile_details: p._id } }
          }
        }));
        await UserModel.bulkWrite(bulkOps);
      }

      insertedPatients += userBatch.length;
      console.log(`[Excel Import] Inserted ${Math.min(i + BATCH_SIZE, newUserDocs.length)} / ${newUserDocs.length} new patients`);
    }

    // ── Insert OldData rows ───────────────────────────────────────────────────
    let insertedOldData = 0;
    let skippedRows = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const oldDataDocs: any[] = [];

      for (const row of batch) {
        const legacyCode = (row.Patient_Code || '').toString().trim().toUpperCase();
        const mongoUserId = legacyCodeToMongoId.get(legacyCode);

        if (!mongoUserId) {
          skippedRows++;
          continue;
        }

        oldDataDocs.push({
          Patient_Code: row.Patient_Code || '',
          Patient_Name: row.Patient_Name || '',
          Sex: row.Sex || '',
          Age: row.Age || '',
          Phone: row.Phone || '',
          Email: row.Email || '',
          Address: row.Address || '',
          Group: row.Group || '',
          Registered_On: row.Registered_On || '',
          Referred_By: row.Referred_By || '',
          Work_Date: row.Work_Date || '',
          Doctor: row.Doctor || '',
          Treatment_Stage: row.Treatment_Stage || '',
          Teeth_Count: parseFloat(row.Teeth_Count) || 0,
          Treatments: row.Treatments || '',
          Prescriptions: row.Prescriptions || '',
          Fee_Due: parseFloat(row.Fee_Due) || 0,
          Fee_Discount: parseFloat(row.Fee_Discount) || 0,
          Amount_Paid: parseFloat(row.Amount_Paid) || 0,
          Payment_Modes: row.Payment_Modes || '',
          Work_ID: row.Work_ID || '',
          user: new mongoose.Types.ObjectId(mongoUserId),
          company: companyId,
          createdAt: new Date(),
        });
      }

      if (oldDataDocs.length > 0) {
        await OldData.insertMany(oldDataDocs, { ordered: false }).catch(e => {
          console.warn('[Excel Import] OldData batch warning:', e.message);
        });
        insertedOldData += oldDataDocs.length;
      }

      console.log(`[Excel Import] OldData processed ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Excel imported successfully',
      data: {
        totalRows: rows.length,
        uniquePatients: patientMap.size,
        newPatientsCreated: insertedPatients,
        existingPatientsLinked: patientMap.size - newUserDocs.length,
        oldDataRowsInserted: insertedOldData,
        skippedRows,
      },
    });

  } catch (error: any) {
    console.error('[Excel Import] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
