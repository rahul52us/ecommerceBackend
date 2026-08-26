import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { OldData } from './src/schemas/legacy/OldData';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const total = await OldData.countDocuments();
  const withDoctor = await OldData.countDocuments({ Doctor: { $nin: ['', null] } });
  
  console.log(`Total rows in OldData: ${total}`);
  console.log(`Rows with Doctor populated: ${withDoctor}`);

  if (total > 0 && withDoctor === 0) {
    console.log("None of the imported rows have Doctor information.");
  }

  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
