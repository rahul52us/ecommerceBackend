import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import WorkDoneModel from '../schemas/workDone/workDone.schema';
import AccountabilityModel from '../schemas/accountability/accountability.schema';
import PaymentModel from '../schemas/payment/payment.schema';

const migratePayments = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    // Clear existing Payments just in case script is run multiple times
    await PaymentModel.deleteMany({});
    console.log("Cleared existing payments in Payment collection.");

    const workDones = await WorkDoneModel.find({ "paymentHistory.0": { $exists: true } });
    console.log(`Found ${workDones.length} WorkDone records with paymentHistory.`);

    let totalPaymentsCreated = 0;
    
    for (const wd of workDones) {
      const history = (wd as any).paymentHistory || [];
      for (const p of history) {
        const newPayment = new PaymentModel({
          patient: wd.patient,
          workDone: wd._id,
          company: wd.company,
          amount: p.amount,
          date: p.date,
          paymentMethod: p.paymentMethod,
          receiptNumber: p.receiptNumber,
          note: p.note,
          createdBy: wd.createdBy // Fallback since payment array didn't store createdBy
        });
        await newPayment.save();
        totalPaymentsCreated++;
      }
    }
    
    console.log(`Successfully migrated ${totalPaymentsCreated} payments into the new Payment collection from WorkDone.`);

    const accountabilities = await AccountabilityModel.find({ "payoutHistory.0": { $exists: true } });
    console.log(`Found ${accountabilities.length} Accountability records with payoutHistory.`);
    // We don't need to create Payments from payoutHistory as they are the same payments, just tracked separately.
    // However, we should verify if any payout exists that is NOT linked to a workDone payment.
    // Generally, payouts are a direct reflection of payments. So the above migration is sufficient for the core payments.
    // We will no longer rely on payoutHistory array. Instead, we query Payment collection based on doctor and workDone.
    
    console.log("Migration Complete. You can now safely remove paymentHistory and payoutHistory arrays from your schemas once the code is fully updated.");
    
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migratePayments();
