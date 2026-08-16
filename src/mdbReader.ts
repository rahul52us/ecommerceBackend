import fs from "fs";
import path from "path";
import MDBReader from "mdb-reader";
import ExcelJS from "exceljs";

async function exportAllTables() {
  try {
    const filePath = "f:\\downloads\\dentalcare.mdb";

    if (!fs.existsSync(filePath)) {
      throw new Error("MDB file not found");
    }

    // Read MDB
    const buffer = fs.readFileSync(path.resolve(filePath));
    const reader = new MDBReader(buffer);

    // Get table names
    const tableNames = reader.getTableNames();

    console.log(`Found ${tableNames.length} tables`);

    // Create exports folder
    const exportDir = path.join(process.cwd(), "exports");

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Process each table separately
    for (const tableName of tableNames) {
      try {
        const table = reader.getTable(tableName);
        const data = table.getData();

        console.log(`Processing ${tableName} (${data.length} rows)`);

        const outputPath = path.join(
          exportDir,
          `${tableName}.xlsx`
        );

        // Streaming workbook
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
          filename: outputPath,
        });

        const worksheet = workbook.addWorksheet(
          tableName.substring(0, 31)
        );

        if (data.length > 0) {
          // Get all columns
          const columns = [
            ...new Set(
              data.flatMap((row: any) => Object.keys(row))
            ),
          ];

          worksheet.columns = columns.map((column) => ({
            header: column,
            key: column,
            width: 25,
          }));

          // Add rows
          for (const row of data) {
            const safeRow: any = {};

            for (const column of columns) {
              let value = row[column];

              if (value === undefined || value === null) {
                value = "";
              } else if (Buffer.isBuffer(value)) {
                value = value.toString("base64");
              } else if (
                typeof value === "object" &&
                !(value instanceof Date)
              ) {
                value = JSON.stringify(value);
              }

              safeRow[column] = value;
            }

            worksheet.addRow(safeRow).commit();
          }
        }

        worksheet.commit();
        await workbook.commit();

        console.log(`✓ ${tableName}.xlsx created`);
      } catch (err) {
        console.error(`Error processing ${tableName}:`, err);
      }
    }

    console.log("\nAll tables exported successfully!");
    console.log(`Location: ${exportDir}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

exportAllTables();