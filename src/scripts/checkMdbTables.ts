import fs from 'fs';
import MDBReader from 'mdb-reader';

const buffer = fs.readFileSync('D:\\download\\dentalcare.mdb');
const reader = new MDBReader(buffer);

const tables = [
  'toothwrk', 'toothwrk1', 
  'wrk_comp', 'wrk_comp1', 'wrk_comp_Detail', 
  'act_tran', 'act_tran1', 
  'Wrk_fee'
];

for (const t of tables) {
  try {
    const table = reader.getTable(t);
    const rows = table.getData();
    console.log(`\n=== ${t} ===`);
    console.log('Count:', rows.length);
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
    }
  } catch (e) {
    console.log(`Error reading ${t}`);
  }
}
