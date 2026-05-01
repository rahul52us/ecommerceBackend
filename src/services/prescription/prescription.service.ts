import Prescription from "../../schemas/prescription/prescription.schema";

export const createPrescription = async (data: any) => {
  try {
    const newPrescription = new Prescription(data);
    return await newPrescription.save();
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const getPrescriptions = async (query: any) => {
  try {
    const { page = 1, limit = 10, search, companyId } = query;
    const filter: any = {};

    if (companyId) {
      filter.company = companyId;
    }

    if (search) {
      filter.$or = [
        { brandName: { $regex: search, $options: "i" } },
        { basicSalt: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Prescription.countDocuments(filter);
    const data = await Prescription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const updatePrescription = async (id: string, data: any) => {
  try {
    return await Prescription.findByIdAndUpdate(id, data, { new: true });
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const deletePrescription = async (id: string) => {
  try {
    return await Prescription.findByIdAndDelete(id);
  } catch (err: any) {
    throw new Error(err.message);
  }
};

import ExcelJS from "exceljs";

export const bulkImportPrescriptions = async (base64Data: string, companyId: string, userId: string) => {
  try {
    // Remove base64 prefix if exists
    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("Excel sheet not found");
    }

    const prescriptions: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const data = {
        type: row.getCell(2).text?.trim(),
        category: row.getCell(3).text?.trim(),
        form: row.getCell(4).text?.trim(),
        basicSalt: row.getCell(5).text?.trim(),
        brandName: row.getCell(6).text?.trim(),
        companyName: row.getCell(7).text?.trim(),
        dosage: row.getCell(8).text?.trim(),
        details: row.getCell(9).text?.trim(),
        doseNo: parseInt(row.getCell(10).text) || 0,
        description: row.getCell(11).text?.trim(),
        company: companyId,
        createdBy: userId
      };

      if (data.brandName && data.type) {
        prescriptions.push(data);
      }
    });

    if (prescriptions.length === 0) {
      throw new Error("No valid records found in Excel");
    }

    return await Prescription.insertMany(prescriptions);
  } catch (err: any) {
    throw new Error(err.message);
  }
};
