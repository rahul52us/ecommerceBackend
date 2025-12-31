// utils/reports/downloadReport.ts (or wherever you have it)

import ExcelJS from "exceljs";
import UserModel from "../../schemas/User/User";

export async function downloadReport(data: any) {
  try {
    const { reportType, filters = {} } = data;

    const validTypes = ["patient", "doctor", "appointment", "recall", "staff"];
    if (!reportType || !validTypes.includes(reportType)) {
      return {
        status: "error",
        message: "Invalid report type",
        data: null,
        statusCode: 400,
      };
    }

    const workbook = new ExcelJS.Workbook();
    const sheetName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    const worksheet = workbook.addWorksheet(sheetName);

    let columns: any = [];
    let rows: any[] = [];

    // Build date filter
    const dateFilter: any = {};
    if (filters.fromDate) {
      dateFilter.$gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }

    // Base match stage
    let matchStage: any = {};

    switch (reportType) {
      case "patient":
        matchStage = { userType: "patient" };
        columns = [
          { header: "Code", key: "code", width: 15 },
          { header: "Name", key: "name", width: 25 },
          { header: "Title", key: "title", width: 10 },
          { header: "Mobile", key: "mobileNumber", width: 18 },
          { header: "Primary Email", key: "primaryEmail", width: 30 },
          { header: "Gender", key: "gender", width: 12 },
          { header: "DOB", key: "dob", width: 18 },
          { header: "Age", key: "age", width: 10 },
          { header: "Residential Address", key: "residentialAddress", width: 40 },
          { header: "Office Address", key: "officeAddress", width: 40 },
          { header: "Languages", key: "languages", width: 25 },
          { header: "Bio", key: "bio", width: 50 },
          { header: "Active", key: "is_active", width: 10 },
          { header: "Registered On", key: "registeredOn", width: 20 },
        ];
        break;

      case "doctor":
        matchStage = { userType: "doctor" };
        columns = [
          { header: "Code", key: "code", width: 15 },
          { header: "Title", key: "title", width: 10 },
          { header: "Name", key: "name", width: 25 },
          { header: "Mobile", key: "mobileNumber", width: 18 },
          { header: "Primary Email", key: "primaryEmail", width: 30 },
          { header: "Gender", key: "gender", width: 12 },
          { header: "DOB", key: "dob", width: 18 },
          { header: "Languages Spoken", key: "languages", width: 25 },
          { header: "Office Address", key: "officeAddress", width: 40 },
          { header: "Bio", key: "bio", width: 50 },
          { header: "Specialty", key: "designation", width: 35 },
          { header: "Active", key: "is_active", width: 10 },
          { header: "Registered On", key: "registeredOn", width: 20 },
        ];
        break;

      case "staff":
        matchStage = {
          userType: { $nin: ["patient", "doctor"] },
          role: { $in: ["admin", "user", "superadmin"] },
        };
        if (filters.role && filters.role !== "all") {
          matchStage.role = filters.role;
        }
        columns = [
          { header: "Code", key: "code", width: 15 },
          { header: "Name", key: "name", width: 25 },
          { header: "Mobile", key: "mobileNumber", width: 18 },
          { header: "Username", key: "username", width: 20 },
          { header: "Role", key: "role", width: 15 },
          { header: "Designation", key: "designation", width: 30 },
          { header: "Active", key: "is_active", width: 10 },
          { header: "Joined On", key: "joinedOn", width: 20 },
        ];
        break;

      default:
        return {
          status: "error",
          message: "Unsupported report type",
          data: null,
          statusCode: 400,
        };
    }

    // Apply date filter if exists
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    // Aggregation pipeline with $lookup
    const aggregationResult = await UserModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "profiledetails", // ← Collection name in MongoDB (lowercase + plural by default)
          localField: "profile_details",
          foreignField: "_id",
          as: "profile_details_data",
        },
      },
      { $unwind: { path: "$profile_details_data", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          code: 1,
          name: 1,
          mobileNumber: 1,
          username: 1,
          userType: 1,
          is_active: 1,
          createdAt: 1,
          role: 1,
          designation: 1,
          profile: "$profile_details_data.personalInfo", // Extract personalInfo
        },
      },
    ]);

    // Map to rows with profile data
    rows = aggregationResult.map((user: any) => {
      const profile = user.profile || {};

      // Calculate age
      let age = "-";
      if (profile.dob) {
        const birthDate = new Date(profile.dob);
        const today = new Date();
        age = String(today.getFullYear() - birthDate.getFullYear());
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age = String(parseInt(age) - 1);
        }
      }

      const baseRow = {
        code: user.code || "-",
        name: user.name || "-",
        mobileNumber: user.mobileNumber || "-",
        username: user.username || "-",
        title: profile.title || "-",
        primaryEmail: profile.emails?.find((e: any) => e.primary)?.email || "-",
        gender: profile.gender === 1 ? "Male" : profile.gender === 2 ? "Female" : "Other",
        dob: profile.dob ? new Date(profile.dob).toLocaleDateString() : "-",
        age,
        residentialAddress: profile.addresses?.residential || "-",
        officeAddress: profile.addresses?.office || "-",
        languages: profile.languages?.join(", ") || "-",
        bio: profile.bio || "-",
        medicalHistory: profile.medicalHistory || "-",
        designation: user.designation?.join(", ") || "-",
        role: user.role || "-",
        is_active: user.is_active ? "Yes" : "No",
        registeredOn: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
        joinedOn: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
      };

      // Return only relevant fields based on report type
      if (reportType === "patient") {
        return {
          code: baseRow.code,
          name: baseRow.name,
          title: baseRow.title,
          mobileNumber: baseRow.mobileNumber,
          primaryEmail: baseRow.primaryEmail,
          gender: baseRow.gender,
          dob: baseRow.dob,
          age: baseRow.age,
          residentialAddress: baseRow.residentialAddress,
          officeAddress: baseRow.officeAddress,
          languages: baseRow.languages,
          bio: baseRow.bio,
          medicalHistory: baseRow.medicalHistory,
          is_active: baseRow.is_active,
          registeredOn: baseRow.registeredOn,
        };
      }

      if (reportType === "doctor") {
        return {
          code: baseRow.code,
          title: baseRow.title,
          name: baseRow.name,
          mobileNumber: baseRow.mobileNumber,
          primaryEmail: baseRow.primaryEmail,
          gender: baseRow.gender,
          dob: baseRow.dob,
          languages: baseRow.languages,
          officeAddress: baseRow.officeAddress,
          bio: baseRow.bio,
          designation: baseRow.designation,
          is_active: baseRow.is_active,
          registeredOn: baseRow.registeredOn,
        };
      }

      if (reportType === "staff") {
        return {
          code: baseRow.code,
          name: baseRow.name,
          mobileNumber: baseRow.mobileNumber,
          username: baseRow.username,
          role: baseRow.role,
          designation: baseRow.designation,
          is_active: baseRow.is_active,
          joinedOn: baseRow.joinedOn,
        };
      }

      return baseRow;
    });

    // Apply to worksheet
    worksheet.columns = columns;
    worksheet.addRows(rows);

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E79" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Auto-fit
    worksheet.columns.forEach((col: any) => {
      col.width = (col.header?.length || 10) + 8;
    });

    const buffer : any = await workbook.xlsx.writeBuffer();
    const base64Excel = buffer.toString("base64");

    return {
      status: "success",
      message: "Report generated successfully",
      data: {
        fileName: `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`,
        fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileData: base64Excel,
      },
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return {
      status: "error",
      message: error.message || "Failed to generate report",
      data: null,
      statusCode: 500,
    };
  }
}