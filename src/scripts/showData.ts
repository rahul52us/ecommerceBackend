import fs from "fs";
import path from "path";
import MDBReader from "mdb-reader";

try {
  const filePath = "f:\\downloads\\dentalcare.mdb";
  const buffer = fs.readFileSync(path.resolve(filePath));
  const reader = new MDBReader(buffer);

  const tablesToCheck = [
    "wrk_comp_Detail", 
    "Wrk_Prescription",
    "recept"
  ];

  console.log("--- DATA IN F:\\downloads\\dentalcare.mdb ---");
  
  for (const tableName of tablesToCheck) {
    try {
      const table = reader.getTable(tableName);
      const data = table.getData();
      console.log(`\nTable: ${tableName} | Rows: ${data.length}`);
      
      if (data.length > 0 && data.length <= 5) {
        console.log("Data:", data);
      } else if (data.length > 5) {
        console.log(`(Showing first 2 rows out of ${data.length})`);
        console.log(data.slice(0, 2));
      }
    } catch (e: any) {
      console.log(`Table ${tableName} missing or error: ${e.message}`);
    }
  }
} catch (err) {
  console.error(err);
}
