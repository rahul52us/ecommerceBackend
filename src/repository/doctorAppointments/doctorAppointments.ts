import mongoose from "mongoose";
import AppointmentSchema from "../../schemas/appointments/appointments.schema";


export const createAppointment = async ( data : any) => {
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
      chair
    } = data;

    // ✅ Basic required field validation
    if (!primaryDoctor || !patient || !appointmentDate || !startTime || !title) {
      return {
        success: 'error',
        message: "Missing required fields.",
        statusCode : 400
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
          statusCode : 400
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
      company:data.company,
      meetingLink: mode === "online" ? meetingLink : null,
      location: mode === "offline" ? location : null,
      status: status || "scheduled",
      followUpOf: followUp?.isFollowUp ? followUp.referenceAppointmentId : null,
      rootAppointment,
      created_At: new Date(),
      createdBy : data.user,
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
      statusCode : 201
    };
  } catch (error : any) {
    return {
      success: 'error',
      message: "Server error. Could not create appointment.",
      error: error.message,
      statusCode : 500
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
    } = data;

    // ✅ Required validation
    if (
      !appointmentId ||
      !primaryDoctor ||
      !patient ||
      !appointmentDate ||
      !startTime ||
      !title
    ) {
      return {
        success: "error",
        message: "Missing required fields.",
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
      updateQuery,
      { new: true }
    );

    if (!updatedAppointment) {
      return {
        success: "error",
        message: "Appointment not found.",
        statusCode: 404,
      };
    }

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

    if(!appointment.createdBy){
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
      skip = 0,
      userId,
      userType
    } = query;

    const matchStage: any = {};

    // 🏢 Company filter
    if (company) matchStage.company = new mongoose.Types.ObjectId(company);

    // 👨‍⚕️ Doctor filter
    if (doctorId) matchStage.primaryDoctor = new mongoose.Types.ObjectId(doctorId);

    // 🧍 Patient filter
    if (patientId) matchStage.patient = new mongoose.Types.ObjectId(patientId);

    // 📊 Status filter
    if (status) matchStage.status = status;

    // 💻 Mode filter
    if (mode) matchStage.mode = mode;

    // 📅 Date filter
    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      matchStage.appointmentDate = { $gte: dayStart, $lte: dayEnd };
    }

    if(userType === "patient"){
      matchStage.patient = new mongoose.Types.ObjectId(userId)
    }
    // 🧩 Aggregation pipeline
    const pipeline : any = [
      { $match: matchStage },
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
      {
  $lookup: {
    from: "chairs",
    localField: "chair",
    foreignField: "_id",
    as: "chair",
  },
},
{ $unwind: { path: "$chair", preserveNullAndEmptyArrays: true } },

      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      { $sort: { appointmentDate: -1, startTime: 1 } },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
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
          chair:1,
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
          history:1,
          notes : 1
        },
      },
    ];

    const appointments = await AppointmentSchema.aggregate(pipeline);

    return {
      success: "success",
      message: "Appointments fetched successfully.",
      count: appointments.length,
      data: appointments,
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


export const getAppointmentById = async (data : any) => {
  try {
    console.log(data)

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


export const getAppointmentStatusCounts = async (query : any) => {
  try {
    const statuses = ["shift", "cancelled", "no-show"];

    if(query.patient){
      query = {patient : new mongoose.Types.ObjectId(query.patient)}
    }

    const result = await AppointmentSchema.aggregate([
      {
        $match: {
          ...query,
          status: { $in: statuses }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const counts : any = {
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
      message : 'Retrieved Patients Status',
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
