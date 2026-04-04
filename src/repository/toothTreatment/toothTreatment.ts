import mongoose from "mongoose";
import ToothTreatmentSchema from "../../schemas/toothTreatment/toothTreatment.schema";

/* =====================================================
   1️⃣ CREATE TOOTH TREATMENT
===================================================== */
export const createToothTreatment = async (data: any) => {
  try {
    const {
      patient,
      doctor,
      company,
      tooth,
      treatmentDate,
      status,
      notes,
      treatmentPlan,
      estimateMin,
      estimateMax,
      discount,
      totalMin,
      totalMax,
      toothNote,
      complaintType,
      recordType,
      user, // createdBy
      examiningDoctor,
    } = data;

    const finalRecordType = recordType || "tooth";
    const finalToothFdi = tooth?.fdi || (finalRecordType === "note" ? "General" : null);
    const finalTreatmentPlan = treatmentPlan || (finalRecordType === "note" ? (notes || "Clinical Note") : null);

    if (!patient || !doctor || !company || (finalRecordType === "tooth" && (!finalToothFdi || !finalTreatmentPlan))) {
      return {
        success: "error",
        message: "Missing required fields (patient, doctor, company, or tooth info/plan for tooth records).",
        statusCode: 400,
      };
    }

    const record = new ToothTreatmentSchema({
      patient,
      doctor,
      company,
      tooth: {
        fdi: finalToothFdi,
        universal: tooth?.universal || null,
        palmer: tooth?.palmer || null,
      },
      treatmentPlan: finalTreatmentPlan,
      treatmentDate: treatmentDate ? new Date(treatmentDate) : null,
      status: status || "pending",
      recordType: finalRecordType,
      notes: notes || "",
      estimateMin: estimateMin || 0,
      estimateMax: estimateMax || 0,
      discount: discount || 0,
      totalMin: totalMin || 0,
      totalMax: totalMax || 0,
      toothNote: toothNote || "",
      complaintType: complaintType || "",
      createdBy: user,
      examiningDoctor: examiningDoctor || null,
      createdAt: new Date(),
    });

    const saved = await record.save();

    return {
      success: "success",
      message: "Tooth treatment created successfully.",
      data: saved,
      statusCode: 201,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: error?.message,
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   2️⃣ UPDATE TOOTH TREATMENT
===================================================== */
export const updateToothTreatment = async (data: any) => {
  try {
    const {
      treatmentId,
      doctor,
      treatment,
      treatmentDate,
      status,
      notes,
      estimateMin,
      estimateMax,
      discount,
      totalMin,
      totalMax,
      toothNote,
      complaintType,
      user, // updatedBy
      examiningDoctor,
    } = data;

    if (!treatmentId) {
      return {
        success: "error",
        message: "Treatment ID is required.",
        statusCode: 400,
      };
    }

    const updatePayload: any = {
      updatedAt: new Date(),
      updatedBy: user,
    };

    if (treatment?.type)
      updatePayload["treatment.type"] = treatment.type;

    if (treatmentDate)
      updatePayload.treatmentDate = new Date(treatmentDate);
    if (doctor) updatePayload.doctor = doctor;

    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;
    if (estimateMin !== undefined) updatePayload.estimateMin = estimateMin;
    if (estimateMax !== undefined) updatePayload.estimateMax = estimateMax;
    if (discount !== undefined) updatePayload.discount = discount;
    if (totalMin !== undefined) updatePayload.totalMin = totalMin;
    if (totalMax !== undefined) updatePayload.totalMax = totalMax;
    if (toothNote !== undefined) updatePayload.toothNote = toothNote;
    if (complaintType !== undefined) updatePayload.complaintType = complaintType;
    if (examiningDoctor !== undefined) updatePayload.examiningDoctor = examiningDoctor;

    const updated = await ToothTreatmentSchema.findByIdAndUpdate(
      treatmentId,
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return {
        success: "error",
        message: "Tooth treatment not found.",
        statusCode: 404,
      };
    }

    return {
      success: "success",
      message: "Tooth treatment updated successfully.",
      data: updated,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error. Could not update tooth treatment.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   3️⃣ UPDATE TOOTH TREATMENT STATUS
===================================================== */
export const updateToothTreatmentStatus = async (data: any) => {
  try {
    const { treatmentId, status, remarks, user } = data;

    if (!treatmentId || !status) {
      return {
        success: "error",
        message: "Treatment ID and status are required.",
        statusCode: 400,
      };
    }

    const treatment: any = await ToothTreatmentSchema.findById(treatmentId);

    if (!treatment) {
      return {
        success: "error",
        message: "Tooth treatment not found.",
        statusCode: 404,
      };
    }

    treatment.status = status;
    treatment.updatedAt = new Date();
    treatment.updatedBy = user;

    if (remarks) {
      treatment.notes = `${treatment.notes || ""}\n${remarks}`;
    }

    const saved = await treatment.save();

    return {
      success: "success",
      message: "Tooth treatment status updated.",
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
   4️⃣ GET TOOTH TREATMENTS (LIST + FILTERS)
===================================================== */
export const getToothTreatments = async (query: any) => {
  try {
    const {
      patientId,
      patient,
      appointmentId,
      doctor,
      company,
      fdi,
      status,
      complaintType,
      limit = 20,
      skip = 0,
    } = query;

    const pId = patientId || patient;

    const matchStage: any = {
      isActive: true,
    };

    if (company && mongoose.Types.ObjectId.isValid(company)) matchStage.company = new mongoose.Types.ObjectId(company);
    if (pId && mongoose.Types.ObjectId.isValid(pId)) matchStage.patient = new mongoose.Types.ObjectId(pId);
    if (doctor && mongoose.Types.ObjectId.isValid(doctor)) matchStage.doctor = new mongoose.Types.ObjectId(doctor);
    if (status) matchStage.status = status;
    if (fdi) matchStage["tooth.fdi"] = fdi;
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) matchStage.appointment = new mongoose.Types.ObjectId(appointmentId);
    if (complaintType) matchStage.complaintType = { $regex: complaintType, $options: "i" };

    console.log("FINAL MATCH STAGE:", matchStage);

    const pipeline: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },

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
          localField: "examiningDoctor",
          foreignField: "_id",
          as: "examiningDoctor",
        },
      },
      { $unwind: { path: "$examiningDoctor", preserveNullAndEmptyArrays: true } },

      // Handle keyword search across multiple fields
      ...(query.search
        ? [
          {
            $match: {
              $or: [
                { "doctor.name": { $regex: query.search, $options: "i" } },
                { "patient.name": { $regex: query.search, $options: "i" } },
                { treatmentPlan: { $regex: query.search, $options: "i" } },
                { notes: { $regex: query.search, $options: "i" } },
              ],
            },
          },
        ]
        : []),

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },

      {
        $project: {
          tooth: 1,
          treatmentPlan: 1,
          treatmentDate: 1,
          status: 1,
          notes: 1,
          estimateMin: 1,
          estimateMax: 1,
          discount: 1,
          totalMin: 1,
          totalMax: 1,
          toothNote: 1,
          complaintType: 1,
          createdAt: 1,

          "patient._id": 1,
          "patient.name": 1,
          "patient.code": 1,

          "doctor._id": 1,
          "doctor.name": 1,
          "doctor.code": 1,

          "examiningDoctor._id": 1,
          "examiningDoctor.name": 1,
          "examiningDoctor.code": 1,

          "createdBy._id": 1,
          "createdBy.name": 1,
          "createdBy.code": 1,
        },
      },
    ];

    const records = await ToothTreatmentSchema.aggregate(pipeline);

    let totalRecords = 0;
    if (query.search) {
      // Robustly construct count pipeline by removing pagination and projection stages
      const countPipeline = pipeline.filter((stage: any) =>
        !stage.$skip && !stage.$limit && !stage.$sort && !stage.$project
      );
      countPipeline.push({ $count: "total" });
      const countRes = await ToothTreatmentSchema.aggregate(countPipeline);
      totalRecords = countRes[0]?.total || 0;
    } else {
      totalRecords = await ToothTreatmentSchema.countDocuments(matchStage);
    }

    return {
      success: "success",
      count: totalRecords,
      data: records,
      statusCode: 200,
    };
  } catch (error: any) {
    console.log(error)
    return {
      success: "error",
      message: "Server error while fetching tooth treatments.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   5️⃣ GET TOOTH TREATMENT BY ID
===================================================== */
export const getToothTreatmentById = async (data: any) => {
  try {
    const { treatmentId } = data;

    if (!treatmentId) {
      return {
        success: "error",
        message: "Treatment ID is required.",
        statusCode: 400,
      };
    }

    const pipeline: any[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(treatmentId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },

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
          localField: "examiningDoctor",
          foreignField: "_id",
          as: "examiningDoctor",
        },
      },
      { $unwind: { path: "$examiningDoctor", preserveNullAndEmptyArrays: true } },

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
        $project: {
          tooth: 1,
          treatment: 1,
          treatmentPlan: 1,
          treatmentDate: 1,
          status: 1,
          notes: 1,
          estimateMin: 1,
          estimateMax: 1,
          discount: 1,
          totalMin: 1,
          totalMax: 1,
          toothNote: 1,
          complaintType: 1,
          createdAt: 1,
          patient: 1,
          doctor: 1,
          examiningDoctor: 1,
          createdBy: 1,
        },
      },
    ];

    const result = await ToothTreatmentSchema.aggregate(pipeline);

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
   6️⃣ SOFT DELETE TOOTH TREATMENT
===================================================== */
export const deleteToothTreatment = async (data: any) => {
  try {
    const { treatmentId, user } = data;

    if (!treatmentId) {
      return {
        success: "error",
        message: "Treatment ID is required.",
        statusCode: 400,
      };
    }

    const deleted = await ToothTreatmentSchema.findByIdAndUpdate(
      treatmentId,
      {
        isActive: false,
        deletedAt: new Date(),
        updatedBy: user,
      },
      { new: true }
    );

    if (!deleted) {
      return {
        success: "error",
        message: "Tooth treatment not found.",
        statusCode: 404,
      };
    }

    return {
      success: "success",
      message: "Tooth treatment deleted successfully.",
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
