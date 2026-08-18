// utils/reports/downloadReport.ts (or wherever you have it)

import ExcelJS from "exceljs";
import UserModel from "../../schemas/User/User";
import appointmentsSchema from "../../schemas/appointments/appointments.schema";
import recallAppointmentSchema from "../../schemas/recall-appointment/recallAppointment.schema";
import LabWork from "../../schemas/labWork/labWork.schema";
import LabWorkHierarchy from "../../schemas/labWork/labWorkHierarchy.schema";
import mongoose from "mongoose";

const formatToIndianDate = (dateString: any) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};


export async function downloadReport(data: any) {
  try {
    const { reportType, filters = {} } = data;

    const validTypes = ["patient", "doctor", "appointment", "recall", "staff", "labWork"];
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

    let columns: any[] = [];
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

    switch (reportType) {
      // =====================================
      // PATIENT REPORT
      // =====================================
      case "patient": {
        let matchStage: any = { userType: "patient" };
        if (data.company) matchStage.company = new mongoose.Types.ObjectId(data.company);

        if (Object.keys(dateFilter).length > 0) {
          matchStage.createdAt = dateFilter;
        }

        if (filters.category === "withAppointments") {
          const patientsWithAppts = await appointmentsSchema.distinct("patient", {});
          matchStage._id = { $in: patientsWithAppts };
        } else if (filters.category === "withRecalls") {
          const patientsWithRecalls = await recallAppointmentSchema.distinct("patient", {});
          matchStage._id = { $in: patientsWithRecalls };
        }

        columns = [
          { header: "Code", key: "code", width: 15 },
          { header: "Name", key: "name", width: 25 },
          { header: "Title", key: "title", width: 10 },
          { header: "Mobile", key: "mobileNumber", width: 18 },
          { header: "Email", key: "primaryEmail", width: 30 },
          { header: "Gender", key: "gender", width: 12 },
          { header: "DOB", key: "dob", width: 15 },
          { header: "Age", key: "age", width: 10 },
          { header: "Address", key: "residentialAddress", width: 40 },
          { header: "Languages", key: "languages", width: 25 },
          { header: "Active", key: "is_active", width: 10 },
          { header: "Registered On", key: "registeredOn", width: 20 },
        ];

        const aggregationResult = await UserModel.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: "profiledetails",
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
              is_active: 1,
              createdAt: 1,
              profile: "$profile_details_data.personalInfo",
            },
          },
        ]);

        rows = aggregationResult.map((user: any) => {
          const profile = user.profile || {};
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

          return {
            code: user.code || "-",
            name: user.name || "-",
            title: profile.title || "-",
            mobileNumber: user.mobileNumber || "-",
            primaryEmail: profile.emails?.find((e: any) => e.primary)?.email || "-",
            gender: profile.gender === 1 ? "Male" : profile.gender === 2 ? "Female" : "Other",
            dob: profile.dob ? new Date(profile.dob).toLocaleDateString() : "-",
            age,
            residentialAddress: profile.addresses?.residential || "-",
            languages: profile.languages?.join(", ") || "-",
            is_active: user.is_active ? "Yes" : "No",
            registeredOn: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
          };
        });
        break;
      }

      // =====================================
      // DOCTOR REPORT
      // =====================================
      case "doctor": {
        let matchStage: any = { userType: "doctor" };
        if (data.company) matchStage.company = new mongoose.Types.ObjectId(data.company);

        if (Object.keys(dateFilter).length > 0) {
          matchStage.createdAt = dateFilter;
        }

        // If filtering by patient (patients treated by this doctor)
        if (filters.patientId) {
          const patientObjectId = new mongoose.Types.ObjectId(filters.patientId);
          const primaryDocs = await appointmentsSchema.distinct("primaryDoctor", {
            patient: patientObjectId,
          });
          const additionalDocs = await appointmentsSchema.distinct("additionalDoctors", {
            patient: patientObjectId,
          });
          const allDocs = [...new Set([...primaryDocs, ...additionalDocs])];
          matchStage._id = { $in: allDocs };
        }

        columns = [
          { header: "Code", key: "code", width: 15 },
          { header: "Title", key: "title", width: 10 },
          { header: "Name", key: "name", width: 25 },
          { header: "Mobile", key: "mobileNumber", width: 18 },
          { header: "Email", key: "primaryEmail", width: 30 },
          { header: "Gender", key: "gender", width: 12 },
          { header: "DOB", key: "dob", width: 15 },
          { header: "Specialty", key: "designation", width: 35 },
          { header: "Languages", key: "languages", width: 25 },
          { header: "Office Address", key: "officeAddress", width: 40 },
          { header: "Active", key: "is_active", width: 10 },
          { header: "Registered On", key: "registeredOn", width: 20 },
        ];

        const aggregationResult = await UserModel.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: "profiledetails",
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
              is_active: 1,
              createdAt: 1,
              designation: 1,
              profile: "$profile_details_data.personalInfo",
            },
          },
        ]);

        rows = aggregationResult.map((user: any) => {
          const profile = user.profile || {};
          return {
            code: user.code || "-",
            title: profile.title || "-",
            name: user.name || "-",
            mobileNumber: user.mobileNumber || "-",
            primaryEmail: profile.emails?.find((e: any) => e.primary)?.email || "-",
            gender: profile.gender === 1 ? "Male" : profile.gender === 2 ? "Female" : "Other",
            dob: profile.dob ? new Date(profile.dob).toLocaleDateString() : "-",
            designation: user.designation?.join(", ") || "-",
            languages: profile.languages?.join(", ") || "-",
            officeAddress: profile.addresses?.office || "-",
            is_active: user.is_active ? "Yes" : "No",
            registeredOn: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
          };
        });
        break;
      }

      // =====================================
      // APPOINTMENT REPORT
      // =====================================
      case "appointment": {
  let matchStage: any = {};
  if (data.company) matchStage.company = new mongoose.Types.ObjectId(data.company);

  // Patient filter
  if (filters.patientId) {
    matchStage.patient = new mongoose.Types.ObjectId(filters.patientId);
  }

  // Doctor filter – matches if primaryDoctor OR in additionalDoctors
  if (filters.doctorId) {
    const doctorId = new mongoose.Types.ObjectId(filters.doctorId);
    matchStage.$or = [
      { primaryDoctor: doctorId },
      { additionalDoctors: doctorId }
    ];
  }

  // Status filter
  if (filters.status && filters.status !== "") {
    if (filters.status === "upcoming") {
      // Upcoming: appointmentDate >= today AND status is scheduled or arrived or in-progress
      matchStage.appointmentDate = { $gte: new Date() };
      matchStage.status = { $in: ["scheduled", "arrived", "in-progress"] };
    } else {
      // Direct match: completed, cancelled, no-show, shift, etc.
      matchStage.status = filters.status;
    }
  }

  // Date range filter on appointmentDate
  if (Object.keys(dateFilter).length > 0) {
    if (matchStage.appointmentDate && matchStage.appointmentDate.$gte) {
      const mergedDate = { ...dateFilter };
      if (dateFilter.$gte) {
        mergedDate.$gte = dateFilter.$gte > matchStage.appointmentDate.$gte ? dateFilter.$gte : matchStage.appointmentDate.$gte;
      } else {
        mergedDate.$gte = matchStage.appointmentDate.$gte;
      }
      matchStage.appointmentDate = mergedDate;
    } else {
      matchStage.appointmentDate = dateFilter;
    }
  }

  // Always filter active appointments
  matchStage.isActive = true;

  columns = [
    { header: "Appointment ID", key: "appointmentId", width: 20 },
    { header: "Date", key: "date", width: 18 },
    { header: "Start Time", key: "startTime", width: 15 },
    { header: "End Time", key: "endTime", width: 15 },
    { header: "Patient Name", key: "patientName", width: 25 },
    { header: "Patient Mobile", key: "patientMobile", width: 18 },
    { header: "Primary Doctor", key: "primaryDoctorName", width: 25 },
    { header: "Additional Doctors", key: "additionalDoctorsNames", width: 35 },
    { header: "Status", key: "status", width: 15 },
    { header: "Mode", key: "mode", width: 12 },
    { header: "Title", key: "title", width: 30 },
    { header: "Description", key: "description", width: 50 },
  ];

  const appointments = await appointmentsSchema.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "patient",
        foreignField: "_id",
        as: "patientData",
      },
    },
    { $unwind: { path: "$patientData", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "primaryDoctor",
        foreignField: "_id",
        as: "primaryDoctorData",
      },
    },
    { $unwind: { path: "$primaryDoctorData", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "additionalDoctors",
        foreignField: "_id",
        as: "additionalDoctorsData",
      },
    },
    // Sort by latest appointment first
    { $sort: { appointmentDate: -1, startTime: -1 } },
    {
      $project: {
        appointmentId: "$_id",
        appointmentDate: 1,
        startTime: 1,
        endTime: 1,
        patientName: "$patientData.name",
        patientMobile: "$patientData.mobileNumber",
        primaryDoctorName: "$primaryDoctorData.name",
        additionalDoctorsNames: {
          $map: {
            input: "$additionalDoctorsData",
            as: "doc",
            in: "$$doc.name"
          }
        },
        status: 1,
        mode: 1,
        title: 1,
        description: 1,
      },
    },
  ]);

  rows = appointments.map((appt: any) => ({
    appointmentId: appt.appointmentId?.toString() || "-",
    date: appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : "-",
    startTime: appt.startTime || "-",
    endTime: appt.endTime || "-",
    patientName: appt.patientName || "Unknown Patient",
    patientMobile: appt.patientMobile || "-",
    primaryDoctorName: appt.primaryDoctorName || "Unknown Doctor",
    additionalDoctorsNames: appt.additionalDoctorsNames?.length > 0
      ? appt.additionalDoctorsNames.join(", ")
      : "-",
    status: appt.status
      ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1).replace("-", " ")
      : "Unknown",
    mode: appt.mode ? appt.mode.charAt(0).toUpperCase() + appt.mode.slice(1) : "-",
    title: appt.title || "-",
    description: appt.description || "-",
  }));
  break;
}

      // =====================================
      // RECALL REPORT
      // =====================================
      case "recall": {
        let matchStage: any = {};
        if (data.company) matchStage.company = new mongoose.Types.ObjectId(data.company);

        if (filters.patientId) matchStage.patient = new mongoose.Types.ObjectId(filters.patientId);

        if (filters.status && filters.status !== "") {
          matchStage.status = filters.status;
        }

        if (Object.keys(dateFilter).length > 0) {
          matchStage.recallDate = dateFilter;
        }

        columns = [
          { header: "Recall ID", key: "recallId", width: 20 },
          { header: "Recall Date", key: "recallDate", width: 18 },
          { header: "Patient Name", key: "patientName", width: 25 },
          { header: "Patient Mobile", key: "patientMobile", width: 18 },
          { header: "Reason", key: "reason", width: 40 },
          { header: "Status", key: "status", width: 15 },
          { header: "Notes", key: "notes", width: 50 },
        ];

        const recalls = await recallAppointmentSchema.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: "users",
              localField: "patient",
              foreignField: "_id",
              as: "patientData",
            },
          },
          { $unwind: { path: "$patientData", preserveNullAndEmptyArrays: true } },
          { $sort: { recallDate: -1 } },
          {
            $project: {
              recallId: "$_id",
              recallDate: "$recallDate",
              patientName: "$patientData.name",
              patientMobile: "$patientData.mobileNumber",
              reason: 1,
              status: 1,
              notes: 1,
            },
          },
        ]);

        rows = recalls.map((recall: any) => ({
          recallId: recall.recallId.toString(),
          recallDate: recall.recallDate ? new Date(recall.recallDate).toLocaleDateString() : "-",
          patientName: recall.patientName || "-",
          patientMobile: recall.patientMobile || "-",
          reason: recall.reason || "-",
          status: recall.status ? recall.status.charAt(0).toUpperCase() + recall.status.slice(1) : "-",
          notes: recall.notes || "-",
        }));
        break;
      }

      // =====================================
      // STAFF REPORT (unchanged except role filter)
      // =====================================
      case "staff": {
        let matchStage: any = {
          userType: { $nin: ["patient", "doctor"] },
          role: { $in: ["admin", "user", "superadmin"] },
        };
        if (data.company) matchStage.company = new mongoose.Types.ObjectId(data.company);

        if (filters.role && filters.role !== "all") {
          if (filters.role === "admin" || filters.role === "user" || filters.role === "superadmin") {
            matchStage.role = filters.role;
          } else {
            matchStage.designation = { $regex: new RegExp(filters.role, "i") };
          }
        }

        if (Object.keys(dateFilter).length > 0) {
          matchStage.createdAt = dateFilter;
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

        const aggregationResult = await UserModel.aggregate([
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              code: 1,
              name: 1,
              mobileNumber: 1,
              username: 1,
              role: 1,
              designation: 1,
              is_active: 1,
              createdAt: 1,
            },
          },
        ]);

        rows = aggregationResult.map((user: any) => ({
          code: user.code || "-",
          name: user.name || "-",
          mobileNumber: user.mobileNumber || "-",
          username: user.username || "-",
          role: user.role || "-",
          designation: user.designation?.join(", ") || "-",
          is_active: user.is_active ? "Yes" : "No",
          joinedOn: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
        }));
        break;
      }

      // =====================================
      // LAB WORK REPORT
      // =====================================
      case "labWork": {
        let matchStage: any = { isActive: true };
        if (data.company) matchStage.company = new mongoose.Types.ObjectId(data.company);

        if (filters.workType && filters.workType !== "all" && filters.workType.length > 0) {
          if (Array.isArray(filters.workType)) {
            matchStage.workType = { $in: filters.workType };
          } else {
            matchStage.workType = filters.workType;
          }
        }

        if (filters.status && filters.status !== "all" && filters.status.length > 0) {
          if (Array.isArray(filters.status)) {
            matchStage.status = { $in: filters.status };
          } else {
            matchStage.status = filters.status;
          }
        }

        if (filters.patientId) {
          matchStage.patient = new mongoose.Types.ObjectId(filters.patientId);
        }

        if (filters.doctorId) {
          matchStage.primaryDoctor = new mongoose.Types.ObjectId(filters.doctorId);
        }

        // Handle specific date filters
        ["sendDate", "dueDate", "receivedDate"].forEach(field => {
          const from = filters[`${field}From`];
          const to = filters[`${field}To`];
          if (from || to) {
            const range: any = {};
            if (from) range.$gte = new Date(from);
            if (to) {
              const toDate = new Date(to);
              toDate.setHours(23, 59, 59, 999);
              range.$lte = toDate;
            }
            matchStage[field] = range;
          }
        });

        const dateTypes = Array.isArray(filters.dateType) ? filters.dateType : [filters.dateType || "sendDate"];
        if (Object.keys(dateFilter).length > 0) {
          if (dateTypes.length === 1) {
            if (!matchStage[dateTypes[0]]) matchStage[dateTypes[0]] = dateFilter;
          } else {
            const orConditions = dateTypes.map((dt: string) => ({ [dt]: dateFilter }));
            if (matchStage.$or) {
              matchStage.$and = matchStage.$and || [];
              matchStage.$and.push({ $or: orConditions });
            } else {
              matchStage.$or = orConditions;
            }
          }
        }

        const defaultLabWorkCols = [
          { header: "Patient", key: "patientName", width: 25 },
          { header: "Doctor", key: "doctorName", width: 25 },
          { header: "Work Type", key: "workType", width: 15 },
          { header: "Lab", key: "labName", width: 20 },
          { header: "Technician Name", key: "technicianName", width: 20 },
          { header: "Creation Date", key: "createdAt", width: 18 },
          { header: "Send Date", key: "sendDate", width: 15 },
          { header: "Due Date", key: "dueDate", width: 15 },
          { header: "Received Date", key: "receivedDate", width: 15 },
          { header: "Status", key: "status", width: 15 },
          { header: "Price", key: "price", width: 12 },
          { header: "Selected Works", key: "works", width: 50 },
          { header: "Teeth Number", key: "teethNumber", width: 15 },
          { header: "Shade", key: "shade", width: 15 },
          { header: "Unit", key: "unit", width: 15 },
          { header: "Warranty Card", key: "warrantyCardNumber", width: 20 },
        ];

        if (filters.selectedColumns && Array.isArray(filters.selectedColumns) && filters.selectedColumns.length > 0) {
          columns = [];
          filters.selectedColumns.forEach((colKey: string) => {
            const found = defaultLabWorkCols.find((c) => c.key === colKey);
            if (found) columns.push(found);
          });
        } else {
          columns = defaultLabWorkCols;
        }

        const labWorks = await LabWork.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: "users",
              localField: "patient",
              foreignField: "_id",
              as: "patientData",
            },
          },
          { $unwind: { path: "$patientData", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "primaryDoctor",
              foreignField: "_id",
              as: "doctorUserData",
            },
          },
          { $unwind: { path: "$doctorUserData", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "labdoctors",
              localField: "primaryDoctor",
              foreignField: "_id",
              as: "doctorLabData",
            },
          },
          { $unwind: { path: "$doctorLabData", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "labs",
              localField: "lab",
              foreignField: "_id",
              as: "labData",
            },
          },
          { $unwind: { path: "$labData", preserveNullAndEmptyArrays: true } },
          { $sort: { [dateTypes[0]]: -1 } },
          {
            $project: {
              patientName: { $ifNull: ["$patientData.name", "$patientNameManual"] },
              doctorName: {
                $ifNull: [
                  "$doctorUserData.name",
                  { $ifNull: ["$doctorLabData.labDoctorName", "$doctorNameManual"] }
                ]
              },
              workType: 1,
              labName: { $ifNull: ["$labData.name", "$labNameManual"] },
              technicianName: 1,
              createdAt: 1,
              sendDate: 1,
              dueDate: 1,
              receivedDate: 1,
              status: 1,
              price: 1,
              selectedWorks: 1,
              warrantyCardNumber: 1,
            },
          },
        ]);

        // Fetch all hierarchy names to resolve IDs in the report
        const hierarchyQuery: any = {};
        if (data.company) hierarchyQuery.company = new mongoose.Types.ObjectId(data.company);
        const hierarchies = await LabWorkHierarchy.find(hierarchyQuery);
        const hierarchyMap: any = {};
        hierarchies.forEach(h => {
          hierarchyMap[h._id.toString()] = h.name;
        });

        rows = labWorks.map((lw: any) => ({
          patientName: lw.patientName || "N/A",
          doctorName: lw.doctorName || "N/A",
          workType: lw.workType || "N/A",
          labName: lw.labName || "In-house",
          technicianName: lw.selectedWorks?.map((w: any) => w.technicianName || "").filter(Boolean).join(", ") || "-",
          createdAt: formatToIndianDate(lw.createdAt),
          sendDate: formatToIndianDate(lw.sendDate),
          dueDate: formatToIndianDate(lw.dueDate),
          receivedDate: formatToIndianDate(lw.receivedDate),
          status: lw.status ? lw.status.toUpperCase() : "N/A",
          price: lw.price || 0,
          works: lw.selectedWorks?.map((w: any, i: number) => {
            const prefix = lw.selectedWorks.length > 1 ? `${i + 1}. ` : "";
            const str = w.selections?.map((sel: string) => {
              if (sel && sel.startsWith("TXT:")) return sel.replace("TXT:", "");
              return hierarchyMap[sel] || sel;
            }).join(" > ");
            return `${prefix}${str}`;
          }).join("\n") || "-",
          teethNumber: lw.selectedWorks?.map((w: any, i: number) => {
            const prefix = lw.selectedWorks.length > 1 ? `${i + 1}. ` : "";
            const teeth = w.teethNumbers?.join(", ") || "-";
            return `${prefix}${teeth}`;
          }).join("\n") || "-",
          shade: lw.selectedWorks?.map((w: any, i: number) => {
            const prefix = lw.selectedWorks.length > 1 ? `${i + 1}. ` : "";
            const sys = w.shadeSystem;
            const val = w.shadeValue;
            let str = "-";
            if (sys && val) str = `${sys} - ${val}`;
            else if (val) str = val;
            return `${prefix}${str}`;
          }).join("\n") || "-",
          unit: lw.selectedWorks?.map((w: any, i: number) => {
            const prefix = lw.selectedWorks.length > 1 ? `${i + 1}. ` : "";
            const unitVal = w.unit || "-";
            return `${prefix}${unitVal}`;
          }).join("\n") || "-",
          warrantyCardNumber: lw.warrantyCardNumber || "-",
        }));
        break;
      }
    }

    if (data.isPreview) {
      return {
        status: "success",
        message: "Report preview generated successfully",
        data: {
          columns: columns.map(c => ({ header: c.header, key: c.key })),
          rows,
        },
        statusCode: 200,
      };
    }

    // Apply to worksheet
    worksheet.columns = columns;
    worksheet.addRows(rows);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E79" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
      });
    });

    // Auto-adjust column widths
    worksheet.columns.forEach((col: any) => {
      const maxLength = Math.max(
        col.header?.length || 0,
        ...rows.map((row: any) => {
           const str = (row[col.key] || "").toString();
           const lines = str.split("\n");
           return Math.max(...lines.map((l: string) => l.length));
        })
      );
      col.width = maxLength + 8;
      
      col.alignment = { wrapText: true, vertical: "middle" };
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