import mongoose from "mongoose";
import RecallAppointmentSchema from "../../schemas/recall-appointment/recallAppointment.schema";

export const createRecallAppointment = async (data: any) => {
  try {
    const {
      doctor,
      patient,
      company,
      appointment,
      recallDate,
      reason,
      status,
      user, // createdBy
    } = data;

    if (!patient || !company || !reason || !user) {
      return {
        success: "error",
        message: "Missing required fields.",
        statusCode: 400,
      };
    }

    const record = new RecallAppointmentSchema({
      doctor: doctor || null,
      patient,
      company,
      appointment: appointment || null,
      recallDate: new Date(recallDate),
      reason,
      status,
      createdBy: user,
      createdAt: new Date(),
    });

    const saved = await record.save();

    return {
      success: "success",
      message: "Recall appointment created successfully.",
      data: saved,
      statusCode: 201,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   2️⃣ UPDATE RECALL APPOINTMENT
===================================================== */
export const updateRecallAppointment = async (data: any) => {
  try {
    const {
      recallId,
      doctor,
      appointment,
      recallDate,
      reason,
      status,
      user,
      patient,
    } = data;

    if (!recallId) {
      return {
        success: "error",
        message: "Recall ID is required.",
        statusCode: 400,
      };
    }

    const updatePayload: any = {
      updatedAt: new Date(),
      updatedBy: user,
    };

    if (doctor) updatePayload.doctor = doctor;
    if (patient) updatePayload.patient = patient;

    if (appointment) updatePayload.appointment = appointment;
    if (recallDate) updatePayload.recallDate = new Date(recallDate);
    if (reason !== undefined) updatePayload.reason = reason;
    if (status) updatePayload.status = status;

    const updated = await RecallAppointmentSchema.findByIdAndUpdate(
      recallId,
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return {
        success: "error",
        message: "Recall appointment not found.",
        statusCode: 404,
      };
    }

    return {
      success: "success",
      message: "Recall appointment updated successfully.",
      data: updated,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   3️⃣ UPDATE RECALL STATUS ONLY
===================================================== */
export const updateRecallStatus = async (data: any) => {
  try {
    const { recallId, status, scheduledAppointment, user } = data;

    if (!recallId || !status) {
      return {
        success: "error",
        message: "Recall ID and status are required.",
        statusCode: 400,
      };
    }

    const recall: any = await RecallAppointmentSchema.findById(recallId);

    if (!recall) {
      return {
        success: "error",
        message: "Recall appointment not found.",
        statusCode: 404,
      };
    }

    recall.status = status;
    recall.updatedAt = new Date();

    const saved = await recall.save();

    return {
      success: "success",
      message: "Recall status updated successfully.",
      data: saved,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   4️⃣ GET RECALL APPOINTMENTS (LIST + FILTERS)
===================================================== */
export const getRecallAppointments = async (query: any) => {
  try {
    const {
      patient,
      doctor,
      company,
      status,
      fromDate,
      toDate,
      limit = 20,
      skip = 0,
      search,
    } = query;

    const matchStage: any = {};

    // 🎯 Base filters
    if (company) matchStage.company = new mongoose.Types.ObjectId(company);
    if (patient) matchStage.patient = new mongoose.Types.ObjectId(patient);
    if (doctor) matchStage.doctor = new mongoose.Types.ObjectId(doctor);
    if (status) matchStage.status = status;

    if (fromDate || toDate) {
      matchStage.recallDate = {};
      if (fromDate) matchStage.recallDate.$gte = new Date(fromDate);
      if (toDate) matchStage.recallDate.$lte = new Date(toDate);
    }

    const pipeline: any[] = [
      { $match: matchStage },

      // 👤 Patient
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      // 👨‍⚕️ Doctor
      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },

      // 👤 Created By
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      // 📅 Appointment
      {
        $lookup: {
          from: "appointments",
          localField: "appointment",
          foreignField: "_id",
          as: "appointment",
        },
      },
      { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },
    ];

    // 🔍 SEARCH (Patient / Doctor)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "patient.name": { $regex: search, $options: "i" } },
            { "patient.code": { $regex: search, $options: "i" } },
            { "patient.mobileNumber": { $regex: search, $options: "i" } },
            { "doctor.name": { $regex: search, $options: "i" } },
            { "doctor.code": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 📊 Pagination + Projection
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
      {
        $project: {
          recallDate: 1,
          reason: 1,
          status: 1,
          createdAt: 1,

          "patient._id": 1,
          "patient.name": 1,
          "patient.code": 1,
          "patient.mobileNumber": 1,

          "doctor._id": 1,
          "doctor.name": 1,
          "doctor.code": 1,

          "createdBy._id": 1,
          "createdBy.name": 1,
          "createdBy.code": 1,

          appointment: 1,
        },
      }
    );

    const records = await RecallAppointmentSchema.aggregate(pipeline);

    return {
      success: "success",
      count: records.length,
      data: records,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   5️⃣ GET RECALL APPOINTMENT BY ID
===================================================== */
export const getRecallAppointmentById = async (data: any) => {
  try {
    const { recallId } = data;

    if (!recallId) {
      return {
        success: "error",
        message: "Recall ID is required.",
        statusCode: 400,
      };
    }

    const pipeline: any[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(recallId),
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
      { $unwind: "$patient" },

      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "appointments",
          localField: "appointment",
          foreignField: "_id",
          as: "appointment",
        },
      },
      { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },
    ];

    const result = await RecallAppointmentSchema.aggregate(pipeline);

    return {
      success: "success",
      data: result[0] || null,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   6️⃣ DELETE RECALL APPOINTMENT (HARD DELETE)
===================================================== */
export const deleteRecallAppointment = async (data: any) => {
  try {
    const { recallId } = data;

    if (!recallId) {
      return {
        success: "error",
        message: "Recall ID is required.",
        statusCode: 400,
      };
    }

    const deleted = await RecallAppointmentSchema.findByIdAndDelete(recallId);

    if (!deleted) {
      return {
        success: "error",
        message: "Recall appointment not found.",
        statusCode: 404,
      };
    }

    return {
      success: "success",
      message: "Recall appointment deleted successfully.",
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error.message,
      statusCode: 500,
    };
  }
};