import fs from 'fs';
import MDBReader from 'mdb-reader';

const buffer = fs.readFileSync('D:\\download\\dentalcare.mdb');
const reader = new MDBReader(buffer);

const allTables = reader.getTableNames();
const populatedTables: { name: string, count: number }[] = [];

for (const t of allTables) {
  try {
    const table = reader.getTable(t);
    const rows = table.getData();
    if (rows.length > 0) {
      populatedTables.push({ name: t, count: rows.length });
    }
  } catch (e) {
    // console.log(`Error reading ${t}`);
  }
}

populatedTables.sort((a, b) => b.count - a.count);

console.log("=== ALL POPULATED MDB TABLES ===");
for (const pt of populatedTables) {
  console.log(`${pt.name}: ${pt.count} records`);
}
