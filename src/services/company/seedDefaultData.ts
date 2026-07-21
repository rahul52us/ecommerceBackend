import mongoose from "mongoose";
import MasterData from "../../schemas/masterData/masterData.schema";
import Prescription from "../../schemas/prescription/prescription.schema";
import Procedure from "../../schemas/procedure/procedure.schema";
import LabWorkStatus from "../../schemas/labWork/labWorkStatus.schema";

export const seedDefaultCompanyData = async (newCompanyId: any, creatorUserId: any) => {
  try {
    const TEMPLATE_COMPANY_ID = "65f65a70fbe7ae65d05dac64";
    console.log(`[SeedData] Starting default data cloning for new company: ${newCompanyId}`);

    // Helper function to clone documents
    const cloneCollection = async (Model: any, collectionName: string) => {
      try {
        const templateRecords = await Model.find({ company: TEMPLATE_COMPANY_ID }).lean();
        
        if (templateRecords && templateRecords.length > 0) {
          const newRecords = templateRecords.map((record: any) => {
            const { _id, createdAt, updatedAt, __v, ...rest } = record;
            return {
              ...rest,
              company: newCompanyId,
              createdBy: creatorUserId,
            };
          });

          await Model.insertMany(newRecords);
          console.log(`[SeedData] Successfully cloned ${newRecords.length} records into ${collectionName}`);
        } else {
          console.log(`[SeedData] No template records found in ${collectionName}`);
        }
      } catch (err: any) {
        console.error(`[SeedData] Failed to clone ${collectionName}:`, err.message);
      }
    };

    // Execute cloning for all requested collections concurrently
    await Promise.all([
      cloneCollection(MasterData, "MasterData"),
      cloneCollection(Prescription, "Prescription"),
      cloneCollection(Procedure, "Procedure"),
      cloneCollection(LabWorkStatus, "LabWorkStatus"),
    ]);

    console.log(`[SeedData] Default data cloning completed for company: ${newCompanyId}`);
  } catch (err: any) {
    console.error(`[SeedData] Critical error during default data cloning:`, err);
  }
};
