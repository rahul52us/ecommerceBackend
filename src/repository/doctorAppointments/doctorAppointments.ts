import mongoose from "mongoose";
import AppointmentSchema from "../../schemas/appointments/appointments.schema";


export const createAppointment = async (data: any) => {
  try {
    const {
      primaryDoctor,
      additionalDoctors,
      patient,
      appointmentDate,
      startTime,
      endTime,
      title,
      description,
      mode,
      meetingLink,
      location,
      status,
      followUp,
      doctorNote,
      chair,
      showCompleteData,
      shiftOrCancelledReason
    } = data;

    // ✅ Basic required field validation
    if (!primaryDoctor || !patient || !appointmentDate || !startTime) {
      return {
        success: 'error',
        message: "Missing required fields.",
        statusCode: 400
      };
    }

    // ✅ Follow-up logic
    let rootAppointment = null;
    if (followUp?.isFollowUp && followUp?.referenceAppointmentId) {
      const parentAppt = await AppointmentSchema.findById(followUp.referenceAppointmentId);
      if (!parentAppt) {
        return {
          success: 'error',
          message: "Reference appointment not found.",
          statusCode: 400
        };
      }

      // Set the root appointment reference
      rootAppointment = parentAppt.rootAppointment || parentAppt._id;
    }

    // ✅ Build appointment object
    const appointment = new AppointmentSchema({
      primaryDoctor,
      additionalDoctors,
      patient,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      title,
      description,
      mode,
      chair,
      showCompleteData,
      shiftOrCancelledReason,
      company: data.company,
      meetingLink: mode === "online" ? meetingLink : null,
      location: mode === "offline" ? location : null,
      status: status || "scheduled",
      followUpOf: followUp?.isFollowUp ? followUp.referenceAppointmentId : null,
      rootAppointment,
      created_At: new Date(),
      createdBy: data.user,
      notes: String(doctorNote || "").trim()
        ? [
          {
            author: data.user || null, // Optional: if user info available
            text: doctorNote,
            createdAt: new Date(),
          },
        ]
        : [],
    });

    const savedAppointment = await appointment.save();

    return {
      success: 'success',
      message: "Appointment created successfully.",
      data: savedAppointment,
      statusCode: 201
    };
  } catch (error: any) {
    return {
      success: 'error',
      message: "Server error. Could not create appointment.",
      error: error.message,
      statusCode: 500
    };
  }
};

export const updateAppointment = async (data: any) => {
  try {
    const {
      appointmentId, // 🔴 REQUIRED
      primaryDoctor,
      additionalDoctors,
      patient,
      appointmentDate,
      startTime,
      endTime,
      title,
      description,
      mode,
      meetingLink,
      location,
      status,
      followUp,
      doctorNote,
      chair,
      company,
      user,
      showCompleteData,
      shiftOrCancelledReason
    } = data;

    // ✅ Required validation (WITH missing fields)
    const requiredFields: any = {
      appointmentId,
      primaryDoctor,
      patient,
      appointmentDate,
      startTime
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => {
        if (value === undefined || value === null) return true;
        if (typeof value === "string" && value.trim() === "") return true;
        return false;
      })
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return {
        success: "error",
        message: JSON.stringify(missingFields),
        missingFields,
        statusCode: 400,
      };
    }

    // ✅ Build update payload
    const updatePayload: any = {
      primaryDoctor,
      additionalDoctors,
      patient,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      title,
      description,
      mode,
      chair,
      company,
      status: status || "scheduled",
      followUpOf: followUp?.isFollowUp
        ? followUp.referenceAppointmentId
        : null,
      meetingLink: mode === "online" ? meetingLink : null,
      location: mode === "offline" ? location : null,
      updatedAt: new Date(),
      updatedBy: user,
      showCompleteData,
      shiftOrCancelledReason
    };

    // ✅ Push note only if exists
    const updateQuery: any = { $set: updatePayload };

    if (String(doctorNote || "").trim()) {
      updateQuery.$push = {
        notes: {
          author: user || null,
          text: doctorNote,
          createdAt: new Date(),
        },
      };
    }

    // ✅ Update appointment
    const updatedAppointment = await AppointmentSchema.findByIdAndUpdate(
      appointmentId,
      { ...updateQuery, status: status === "shift" ? "scheduled" : status },
      { new: true }
    );

    if (!updatedAppointment) {
      return {
        success: "error",
        message: "Appointment not found.",
        statusCode: 404
      };
    }

    if (status !== "shift") {
      updatedAppointment.history.push({
        action: status,
        by: user || null,
        remarks: status === "cancelled" ? shiftOrCancelledReason || description || "" : description || "",
        timestamp: new Date(),
      });
    }

    await updatedAppointment.save()

    return {
      success: "success",
      message: "Appointment updated successfully.",
      data: updatedAppointment,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error. Could not update appointment.",
      error: error.message,
      statusCode: 500,
    };
  }
};


export const updateAppointmentStatus = async (data: any) => {
  try {
    const { appointmentId, status, remarks, user } = data;

    if (!appointmentId || !status) {
      return {
        success: "error",
        message: "Appointment ID and status are required.",
        statusCode: 400,
      };
    }

    // ✅ Find appointment
    const appointment = await AppointmentSchema.findById(appointmentId);
    if (!appointment) {
      return {
        success: "error",
        message: "Appointment not found.",
        statusCode: 404,
      };
    }

    if (!appointment.createdBy) {
      appointment.createdBy = data.user
    }

    appointment.status = status;
    appointment.updated_At = new Date();

    appointment.history.push({
      action: status,
      by: user || null,
      remarks: remarks || "",
      timestamp: new Date(),
    });

    if (remarks) {
      appointment.notes.push({
        author: user || null,
        text: remarks,
        createdAt: new Date(),
      });
    }

    const updatedAppointment = await appointment.save();

    return {
      success: "success",
      message: "Appointment status updated successfully.",
      data: updatedAppointment,
      statusCode: 200,
    };
  } catch (error: any) {
    console.log(error)
    return {
      success: "error",
      message: error.message,
      error: error.message,
      statusCode: 500,
    };
  }
};


export const getAppointments = async (query: any) => {
  try {
    const {
      doctorId,
      patientId,
      status,
      mode,
      date,
      company,
      limit = 20,
      page = 1,
      userId,
      userType,
      search,
    } = query;

    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.max(1, Math.min(100, Number(limit)));
    const skip = (safePage - 1) * safeLimit;

    const matchStage: any = {};

    if (company) matchStage.company = new mongoose.Types.ObjectId(company);
    if (doctorId) matchStage.primaryDoctor = new mongoose.Types.ObjectId(doctorId);
    if (patientId) matchStage.patient = new mongoose.Types.ObjectId(patientId);
    if (status) matchStage.status = status;
    if (mode) matchStage.mode = mode;

    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      matchStage.appointmentDate = { $gte: dayStart, $lte: dayEnd };
    }

    if (userType === "patient") {
      matchStage.patient = new mongoose.Types.ObjectId(userId);
    }


    const basePipeline: any = [
      { $match: matchStage },

      { $lookup: { from: "users", localField: "primaryDoctor", foreignField: "_id", as: "primaryDoctor" } },
      { $unwind: { path: "$primaryDoctor", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "users", localField: "additionalDoctors", foreignField: "_id", as: "additionalDoctors" } },

      { $lookup: { from: "users", localField: "patient", foreignField: "_id", as: "patient" } },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy" } },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "chairs", localField: "chair", foreignField: "_id", as: "chair" } },
      { $unwind: { path: "$chair", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "companies", localField: "company", foreignField: "_id", as: "company" } },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },

      ...(search
        ? [{
          $match: {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
              { "primaryDoctor.name": { $regex: search, $options: "i" } },
              { "primaryDoctor.mobileNumber": { $regex: search, $options: "i" } },
              { "patient.name": { $regex: search, $options: "i" } },
              { "patient.code": { $regex: search, $options: "i" } },
              { "patient.mobileNumber": { $regex: search, $options: "i" } },
            ],
          },
        }]
        : []),

      { $sort: { appointmentDate: -1, startTime: 1 } },
    ];

    const [appointments, totalResult] = await Promise.all([
      AppointmentSchema.aggregate([
        ...basePipeline,
        { $skip: skip },
        { $limit: safeLimit },
      ]),
      AppointmentSchema.aggregate([
        ...basePipeline,
        { $count: "count" },
      ]),
    ]);

    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / safeLimit);

    return {
      success: "success",
      message: "Appointments fetched successfully.",
      data: appointments,
      page: safePage,
      limit: safeLimit,
      totalPages,
      totalCount,
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("❌ getAppointments error:", error);
    return {
      success: "error",
      message: "Server error while fetching appointments.",
      error: error.message,
      statusCode: 500,
    };
  }
};






export const getAppointmentById = async (data: any) => {
  try {
    const pipeline: any[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(data?.appointmentId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "primaryDoctor",
          foreignField: "_id",
          as: "primaryDoctor",
        },
      },
      { $unwind: { path: "$primaryDoctor", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "additionalDoctors",
          foreignField: "_id",
          as: "additionalDoctors",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "chairs",
          localField: "chair",
          foreignField: "_id",
          as: "chair",
        },
      },
      { $unwind: { path: "$chair", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          mode: 1,
          status: 1,
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          meetingLink: 1,
          location: 1,
          created_At: 1,
          updated_At: 1,
          chair: 1,
          history: 1,
          notes: 1,
          showCompleteData: 1,
          shiftOrCancelledReason: 1,
          "primaryDoctor._id": 1,
          "primaryDoctor.name": 1,
          "primaryDoctor.code": 1,

          "createdBy._id": 1,
          "createdBy.name": 1,
          "createdBy.code": 1,

          "additionalDoctors._id": 1,
          "additionalDoctors.name": 1,

          "patient._id": 1,
          "patient.name": 1,
          "patient.code": 1,

          "company._id": 1,
        },
      },
    ];

    const appointments = await AppointmentSchema.aggregate(pipeline);

    return {
      success: "success",
      message: "Appointment fetched successfully.",
      data: appointments[0] || null, // ✅ SAME OUTPUT SHAPE
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("❌ getAppointmentById error:", error);
    return {
      success: "error",
      message: "Server error while fetching appointment.",
      error: error.message,
      statusCode: 500,
    };
  }
};


export const getAppointmentStatusCounts = async (query: any) => {
  try {
    const statuses = ["shift", "cancelled", "no-show"];

    const matchStage: any = {};

    if (query.patient && mongoose.Types.ObjectId.isValid(query.patient)) {
      matchStage.patient = new mongoose.Types.ObjectId(query.patient);
    }

    if (query.company && mongoose.Types.ObjectId.isValid(query.company)) {
      matchStage.company = new mongoose.Types.ObjectId(query.company);
    }

    const result = await AppointmentSchema.aggregate([
      {
        $match: matchStage
      },
      { $unwind: "$history" },
      {
        $match: {
          "history.action": { $in: statuses }
        }
      },
      {
        $group: {
          _id: "$history.action",
          count: { $sum: 1 }
        }
      }
    ]);

    const counts: any = {
      shift: 0,
      cancelled: 0,
      "no-show": 0
    };

    result.forEach((item) => {
      counts[item._id] = item.count;
    });

    return {
      status: "success",
      data: counts,
      message: 'Retrieved Patients Status Breakdown',
      statusCode: 200
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      statusCode: 500
    };
  }
};

export const getPatientHistory = async (query: any) => {
  try {
    const { patientId, company, page = 1, limit = 10 } = query;
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.max(1, Number(limit));
    const skip = (safePage - 1) * safeLimit;

    console.log("🔍 Fetching patient history for:", { patientId, company, page: safePage, limit: safeLimit });

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return {
        success: "error",
        message: "Valid Patient ID is required.",
        statusCode: 400,
      };
    }

    const matchStage: any = {
      patient: new mongoose.Types.ObjectId(patientId),
      status: { $in: ["shift", "cancelled"] },
    };

    if (company && mongoose.Types.ObjectId.isValid(company)) {
      matchStage.company = new mongoose.Types.ObjectId(company);
    }

    const basePipeline = [
      { $match: matchStage },
      { $lookup: { from: "users", localField: "primaryDoctor", foreignField: "_id", as: "primaryDoctor" } },
      { $unwind: { path: "$primaryDoctor", preserveNullAndEmptyArrays: true } },
    ];

    const [appointments, totalResult] = await Promise.all([
      AppointmentSchema.aggregate([
        ...basePipeline,
        { $sort: { appointmentDate: -1, startTime: -1 } },
        { $skip: skip },
        { $limit: safeLimit },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            status: 1,
            appointmentDate: 1,
            startTime: 1,
            endTime: 1,
            shiftOrCancelledReason: 1,
            "primaryDoctor.name": 1,
          },
        },
      ]),
      AppointmentSchema.aggregate([
        ...basePipeline,
        { $count: "count" },
      ]),
    ]);

    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / safeLimit);

    console.log(`✅ Found ${totalCount} history records, returning ${appointments.length} for page ${safePage}`);

    return {
      success: "success",
      message: "Patient history fetched successfully.",
      data: appointments,
      totalCount,
      totalPages,
      currentPage: safePage,
      statusCode: 200,
    };

    console.log(`✅ Found ${appointments.length} history records`);

    return {
      success: "success",
      message: "Patient history fetched successfully.",
      data: appointments,
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("❌ getPatientHistory error:", error);
    return {
      success: "error",
      message: "Server error while fetching patient history.",
      error: error.message,
      statusCode: 500,
    };
  }
};

export const getPatientAuditTrail = async (query: any) => {
  try {
    const { patientId, company, page = 1, limit = 10 } = query;
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.max(1, Number(limit));
    const skip = (safePage - 1) * safeLimit;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return {
        success: "error",
        message: "Valid Patient ID is required.",
        statusCode: 400,
      };
    }

    const matchStage: any = {
      patient: new mongoose.Types.ObjectId(patientId),
      "history.action": { $in: ["shift", "cancelled", "no-show"] }
    };

    if (company && mongoose.Types.ObjectId.isValid(company)) {
      matchStage.company = new mongoose.Types.ObjectId(company);
    }

    const basePipeline = [
      { $match: matchStage },
      { $lookup: { from: "users", localField: "primaryDoctor", foreignField: "_id", as: "primaryDoctor" } },
      { $unwind: { path: "$primaryDoctor", preserveNullAndEmptyArrays: true } },
      // Join users for history.by
      {
        $lookup: {
          from: "users",
          localField: "history.by",
          foreignField: "_id",
          as: "historyUsers"
        }
      },
      {
        $set: {
          history: {
            $map: {
              input: "$history",
              as: "h",
              in: {
                $mergeObjects: [
                  "$$h",
                  {
                    byName: {
                      $let: {
                        vars: {
                          user: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$historyUsers",
                                  as: "u",
                                  cond: { $eq: ["$$u._id", "$$h.by"] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: "$$user.name"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ];

    const [appointments, totalResult, incidentsResult] = await Promise.all([
      AppointmentSchema.aggregate([
        ...basePipeline,
        { $sort: { appointmentDate: -1, startTime: -1 } },
        { $skip: skip },
        { $limit: safeLimit },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            status: 1,
            appointmentDate: 1,
            startTime: 1,
            endTime: 1,
            shiftOrCancelledReason: 1,
            history: 1,
            notes: 1,
            "primaryDoctor.name": 1,
          },
        },
      ]),
      AppointmentSchema.aggregate([
        ...basePipeline,
        { $count: "count" },
      ]),
      // Calculate total incidents (count of matching history actions)
      AppointmentSchema.aggregate([
        { $match: { patient: new mongoose.Types.ObjectId(patientId) } },
        { $unwind: "$history" },
        { $match: { "history.action": { $in: ["shift", "cancelled", "no-show"] } } },
        { $count: "count" }
      ])
    ]);

    const totalCount = totalResult[0]?.count || 0;
    const totalIncidents = incidentsResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / safeLimit);

    return {
      success: "success",
      message: "Patient Audit Trail fetched successfully.",
      data: appointments,
      totalCount,
      totalIncidents,
      totalPages,
      currentPage: safePage,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error while fetching audit trail.",
      error: error.message,
      statusCode: 500,
    };
  }
};
