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
      toothNotation,
      sittingNo,
    } = data;

    const finalRecordType = recordType || "tooth";
    const finalTooth = tooth || (finalRecordType === "note" ? "General" : null);
    const finalTreatmentPlan = treatmentPlan || (finalRecordType === "note" ? (notes || "Clinical Note") : "General Treatment");

    if (!patient || !doctor || !company || (finalRecordType === "tooth" && (!finalTooth || !finalTreatmentPlan))) {
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
      tooth: finalTooth,
      toothNotation: toothNotation || "fdi",
      treatmentPlan: finalTreatmentPlan,
      treatmentDate: treatmentDate ? new Date(treatmentDate) : null,
      status: status || "pending",
      recordType: finalRecordType,
      position: data.position || null,
      side: data.side || null,
      notes: notes || "",
      estimateMin: estimateMin || 0,
      estimateMax: estimateMax || 0,
      discount: discount || 0,
      totalMin: totalMin || 0,
      totalMax: totalMax || 0,
      toothNote: toothNote || "",
      complaintType: complaintType || "",
      sittingNo: sittingNo || null,
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
      treatmentPlan,
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
      sittingNo,
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

    if (treatmentPlan !== undefined)
      updatePayload.treatmentPlan = treatmentPlan;

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
    if (sittingNo !== undefined) updatePayload.sittingNo = sittingNo;
    if (data.position) updatePayload.position = data.position;
    if (data.side) updatePayload.side = data.side;

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
   4️⃣ ASSIGN SITTING NO TO TOOTH TREATMENT
===================================================== */
export const assignSittingNo = async (data: any) => {
  try {
    const { treatmentId, sittingNo, user } = data;

    if (!treatmentId || sittingNo === undefined) {
      return {
        success: "error",
        message: "Treatment ID and Sitting No are required.",
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

    treatment.sittingNo = Number(sittingNo);
    if (treatment.status && treatment.status !== treatment.status.toLowerCase()) {
      treatment.status = treatment.status.toLowerCase();
    }
    treatment.updatedAt = new Date();
    treatment.updatedBy = user;

    const saved = await treatment.save();

    return {
      success: "success",
      message: "Sitting number assigned successfully.",
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
   5️⃣ GET TOOTH TREATMENTS (LIST + FILTERS)
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
      sittingNo,
    } = query;

    const limit = Number(query.limit) || 20;
    const skip = query.skip ? Number(query.skip) : (Number(query.page || 1) - 1) * limit;

    const pId = patientId || patient;

    const matchStage: any = {
      isActive: true,
    };

    if (company && mongoose.Types.ObjectId.isValid(company)) matchStage.company = new mongoose.Types.ObjectId(company);
    if (pId && mongoose.Types.ObjectId.isValid(pId)) matchStage.patient = new mongoose.Types.ObjectId(pId);
    if (doctor && mongoose.Types.ObjectId.isValid(doctor)) matchStage.doctor = new mongoose.Types.ObjectId(doctor);
    if (status) matchStage.status = { $regex: new RegExp(`^${status}$`, 'i') };
    if (fdi) matchStage.tooth = fdi;
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) matchStage.appointment = new mongoose.Types.ObjectId(appointmentId);
    if (complaintType) matchStage.complaintType = { $regex: complaintType, $options: "i" };
    if (sittingNo && sittingNo !== 'undefined') {
      const sittings = String(sittingNo).split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
      if (sittings.length > 0) {
        matchStage.sittingNo = { $in: sittings };
        matchStage.status = { $in: [/^pending$/i, /^incomplete$/i] };
      }
    }

    if (query.toDate) {
      const startOfDay = new Date(query.toDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.treatmentDate = { $gte: startOfDay, $lte: endOfDay };
    }


    if (query.treatmentDate === "today") {

      // Logic moved to specialized getTodayToothTreatments function
    }

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
                { tooth: { $regex: query.search, $options: "i" } },
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

      {
        $lookup: {
          from: "workdones",
          localField: "_id",
          foreignField: "treatment",
          as: "workHistory"
        }
      },
      {
        $addFields: {
          receivedAmount: {
            $reduce: {
              input: "$workHistory",
              initialValue: 0,
              in: { $add: ["$$value", { $subtract: ["$$this.amount", "$$this.discount"] }] }
            }
          }
        }
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          tooth: 1,
          toothNotation: 1,
          dentitionType: 1,
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
          sittingNo: 1,
          receivedAmount: 1,
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
      totalItems: totalRecords,
      count: totalRecords, // backward compatibility
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

/* =====================================================
   7️⃣ GET TODAY'S TOOTH TREATMENTS (SESSION HISTORY)
===================================================== */
export const getTodayToothTreatments = async (query: any) => {
  try {
    const { patientId, company, date, complaintType, search, status } = query;

    if (!patientId || !company) {
      return {
        success: "error",
        message: "Patient ID and Company ID are required.",
        statusCode: 400,
      };
    }

    // Use selected date or default to today
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const matchStage = {
      isActive: true,
      patient: new mongoose.Types.ObjectId(patientId),
      company: new mongoose.Types.ObjectId(company),
      // We look for records that were either documented for this date OR created on this date
      $or: [
        { treatmentDate: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      ]
    };

    if (status && status !== 'all') {
      (matchStage as any).status = status.toLowerCase();
    }

    if (complaintType) (matchStage as any).complaintType = { $regex: complaintType, $options: "i" };
    if (search) {
      (matchStage as any).$and = [
        {
          $or: [
            { treatmentPlan: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } },
            { tooth: { $regex: search, $options: "i" } },
          ]
        }
      ];
    }

    console.log("FINAL matchStage (getTodayToothTreatments):", JSON.stringify(matchStage, null, 2));

    const records = await ToothTreatmentSchema.find(matchStage)
      .populate("doctor", "_id name code")
      .populate("patient", "_id name code")
      .populate("examiningDoctor", "_id name code")
      .populate("createdBy", "_id name code")
      .sort({ createdAt: -1 });

    return {
      success: "success",
      totalItems: records.length,
      data: records,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error while fetching today's treatments.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   8️⃣ GET TODAY'S TOOTH COUNT (SESSION)
===================================================== */
export const getTodayToothCount = async (query: any) => {
  try {
    const { patientId, company, date, complaintType, search, status } = query;

    if (!patientId || !company) {
      return {
        success: "error",
        message: "Patient ID and Company ID are required.",
        statusCode: 400,
      };
    }

    // Use selected date or default to today
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const matchStage = {
      isActive: true,
      patient: new mongoose.Types.ObjectId(patientId),
      company: new mongoose.Types.ObjectId(company),
      $or: [
        { treatmentDate: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      ]
    };

    if (status && status !== 'all') {
      (matchStage as any).status = status.toLowerCase();
    }

    if (complaintType) (matchStage as any).complaintType = { $regex: complaintType, $options: "i" };
    if (search) {
      (matchStage as any).$and = [
        {
          $or: [
            { treatmentPlan: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } },
            { tooth: { $regex: search, $options: "i" } },
          ]
        }
      ];
    }

    console.log("FINAL matchStage (getTodayToothCount):", JSON.stringify(matchStage, null, 2));

    const count = await ToothTreatmentSchema.countDocuments(matchStage);

    return {
      success: "success",
      totalItems: count,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error while fetching today's count.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   9️⃣ GET TREATMENT COUNT BY DATE (AGGREGATION)
===================================================== */
export const getTreatmentCountByDate = async (query: any) => {
  try {
    const { patientId, company } = query;

    if (!patientId || !company) {
      return {
        success: "error",
        message: "Patient ID and Company ID are required.",
        statusCode: 400,
      };
    }

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(company)) {
      return {
        success: "error",
        message: "Invalid Patient ID or Company ID format.",
        statusCode: 400,
      };
    }

    const matchStage = {
      isActive: true,
      patient: new mongoose.Types.ObjectId(patientId),
      company: new mongoose.Types.ObjectId(company),
    };


    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $ifNull: ["$treatmentDate", "$createdAt"] }
            }
          },
          count: { $sum: 1 },
          items: { $push: "$$ROOT" } // Optional: if we want to show previews later
        }
      },
      { $sort: { _id: -1 } as any },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }
      }
    ];

    const result = await ToothTreatmentSchema.aggregate(pipeline);

    return {
      success: "success",
      data: result,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error while aggregating treatment counts.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   10️⃣ GET TREATMENTS BY SITTING NO
===================================================== */
export const getTreatmentsBySitting = async (query: any) => {
  try {
    const { sittingNo, patientId, company } = query;

    if (!patientId || !company) {
      return {
        success: "error",
        message: "Patient ID and Company ID are required.",
        statusCode: 400,
      };
    }

    const matchStage: any = {
      isActive: true,
      patient: new mongoose.Types.ObjectId(patientId),
      company: new mongoose.Types.ObjectId(company),
    };

    if (sittingNo && sittingNo !== 'undefined') {
      const sittings = String(sittingNo).split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
      if (sittings.length > 0) {
        matchStage.sittingNo = { $in: sittings };
        matchStage.status = { $in: [/^pending$/i, /^incomplete$/i] };
      }
    }

    const records = await ToothTreatmentSchema.find(matchStage)
      .populate("doctor", "_id name code")
      .populate("patient", "_id name code")
      .populate("examiningDoctor", "_id name code")
      .populate("createdBy", "_id name code")
      .sort({ createdAt: -1 });

    return {
      success: "success",
      totalItems: records.length,
      data: records,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: "error",
      message: "Server error while fetching treatments by sitting.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/* =====================================================
   11️⃣ GET FILTERED TREATMENT TABLE PDF DATA
===================================================== */
export const getFilteredTreatmentTablePDFData = async (query: any) => {
  try {
    const { patientId, company } = query;
    const cId = new mongoose.Types.ObjectId(company);

    if (!cId) {
      return { success: "error", message: "Company ID required", statusCode: 400 };
    }

    // Reuse getToothTreatments to fetch the exact table data without limit
    const result = await getToothTreatments({
      ...query,
      limit: 10000,
      page: 1
    });

    if (result.success === "error") return result;

    const records = result.data || [];
    records.sort((a: any, b: any) => {
      const sA = a.sittingNo ? Number(a.sittingNo) : Infinity;
      const sB = b.sittingNo ? Number(b.sittingNo) : Infinity;
      if (sA !== sB) return sA - sB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    let patientObj = records.length > 0 ? records[0].patient : null;

    if (!patientObj && patientId) {
      const UserModel = mongoose.model("User");
      patientObj = await UserModel.findById(patientId).select("name mobileNumber code profile_details").populate({
        path: "profile_details",
        model: "ProfileDetails"
      });
    }

    const CompanyModel = mongoose.model("Company");
    const clinic = await CompanyModel.findById(cId);

    return {
      success: "success",
      data: {
        patient: patientObj,
        clinic,
        records
      },
      statusCode: 200
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};
