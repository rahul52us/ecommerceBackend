import ExcelJS from 'exceljs';

async function countDoctors() {
  const workbook = new ExcelJS.Workbook();
  console.log("Loading Excel file...");
  await workbook.xlsx.readFile('DentalCare_Patient_History.xlsx');
  
  const sheet = workbook.getWorksheet('Patient_History');
  if (!sheet) {
    console.log("Sheet not found");
    return;
  }

  let doctorColIndex = -1;
  sheet.getRow(1).eachCell((cell, colNumber) => {
    if (cell.value?.toString().trim() === 'Doctor') {
      doctorColIndex = colNumber;
    }
  });

  if (doctorColIndex === -1) {
    console.log("Doctor column not found");
    return;
  }

  let totalRows = 0;
  let populatedCount = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    totalRows++;
    const doctorVal = row.getCell(doctorColIndex).value;
    if (doctorVal && doctorVal.toString().trim() !== '') {
      populatedCount++;
    }
  });

  console.log(`Total rows in Excel: ${totalRows}`);
  console.log(`Rows with Doctor populated: ${populatedCount}`);
}

countDoctors().catch(console.error);
