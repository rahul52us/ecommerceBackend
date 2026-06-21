import fs from "fs";
import path from "path";
import MDBReader from "mdb-reader";

async function readMDBDirectly() {
  try {
    const filePath = "D:\\download\\dentalcare.mdb";

    if (!fs.existsSync(filePath)) {
      console.error(`MDB file not found at ${filePath}`);
      process.exit(1);
    }

    const buffer = fs.readFileSync(path.resolve(filePath));
    const reader = new MDBReader(buffer);

    const tableNames = reader.getTableNames();
    console.log(`Found ${tableNames.length} tables in the MDB file.\n`);

    const tablesToCheck = ['wrk_comp', 'act_tran', 'Wrk_fee', 'toothwrk', 'wrk_comp_Detail'];

    for (const tableName of tablesToCheck) {
      if (tableNames.includes(tableName)) {
        const table = reader.getTable(tableName);
        const data = table.getData();
        console.log(`=== TABLE: ${tableName} (${data.length} rows) ===`);

        // Print columns
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`Columns: ${columns.join(', ')}`);

          // Print first 2 rows as sample
          console.log("Sample 1:", JSON.stringify(data[0]));
          if (data.length > 1) {
            console.log("Sample 2:", JSON.stringify(data[1]));
          }
        }
        console.log("\n");
      } else {
        console.log(`Table ${tableName} not found in MDB!\n`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error reading MDB:", error);
    process.exit(1);
  }
}

// readMDBDirectly();
