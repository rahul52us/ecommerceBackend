import fs from "fs";
import path from "path";
import MDBReader from "mdb-reader";

const run = async () => {
  const filePath = "D:\\download\\dentalcare.mdb";
  const buffer = fs.readFileSync(path.resolve(filePath));
  const reader = new MDBReader(buffer);

  const feeTable = reader.getTable("Wrk_fee");
  const fees = feeTable.getData();

  const matchingFees = fees.filter((row: any) => 
    row.pat_code === "27343502SUN" &&
    new Date(row.wrk_date).getFullYear() === 2006 &&
    new Date(row.wrk_date).getMonth() === 10 && // November is month 10 in JS Date
    row.fee_due === 100
  );

  console.log(`Found ${matchingFees.length} matching rows in MDB for SUNDER in Nov 2006:`);
  console.log(matchingFees);
};

run().catch(console.error);
