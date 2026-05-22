import fs from "fs";
import path from "path";
import MDBReader from "mdb-reader";
import ExcelJS from "exceljs";

export const exportPatientsToExcel = async () => {
    try {
        // MDB File Path
        const filePath = "D:\\download\\dentalcare.mdb";

        // Check file exists
        if (!fs.existsSync(filePath)) {
            throw new Error("MDB file not found");
        }

        // Read MDB File
        const buffer = fs.readFileSync(path.resolve(filePath));

        // Create Reader
        const reader = new MDBReader(buffer);

        // Get patient table
        const patientTable = reader.getTable("patient");

        // Read patient data
        const patientData = patientTable.getData();

        console.log("Total Patients:", patientData.length);

        if (!patientData.length) {
            throw new Error("No patient data found");
        }

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet("Patients");

        // Get dynamic columns
        const columns = Object.keys(patientData[0]);

        // Add Header
        worksheet.columns = columns.map((column) => ({
            header: column,
            key: column,
            width: 25,
        }));

        // Add Rows
        patientData.forEach((patient: any) => {
            worksheet.addRow(patient);
        });

        // Header Style
        worksheet.getRow(1).font = {
            bold: true,
        };

        // Save Excel File
        const outputPath = path.join(
            process.cwd(),
            "patients_export.xlsx"
        );

        await workbook.xlsx.writeFile(outputPath);

        console.log("\nExcel Exported Successfully");
        console.log("File:", outputPath);

        return outputPath;
    } catch (error) {
        console.error("Error Exporting Patients:", error);

        throw error;
    }
};

// Run Function
exportPatientsToExcel();