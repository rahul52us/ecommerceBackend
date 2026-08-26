import fs from 'fs';
import MDBReader from 'mdb-reader';

const mdbPath = 'dentalcare.mdb';

if (!fs.existsSync(mdbPath)) {
  console.error(`ERROR: MDB file not found at ${mdbPath}`);
  process.exit(1);
}

const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

const tableNames = reader.getTableNames();
console.log(`Found ${tableNames.length} tables. Searching for "doctor"...`);

for (const tableName of tableNames) {
  try {
    const table = reader.getTable(tableName);
    const columns = table.getColumnNames();
    const hasDoctor = columns.some(col => col.toLowerCase().includes('doc') || col.toLowerCase().includes('dr') || col.toLowerCase().includes('doctor'));
    
    if (tableName.toLowerCase().includes('doc') || hasDoctor) {
      console.log(`\nTable: ${tableName}`);
      console.log(`Columns: ${columns.join(', ')}`);
      
      const data = table.getData();
      if (data.length > 0) {
        console.log(`Sample row 1:`, data[0]);
      }
    }
  } catch (e) {
    // skip
  }
}
