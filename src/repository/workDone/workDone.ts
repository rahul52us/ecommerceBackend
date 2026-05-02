import mongoose from "mongoose";
import WorkDoneSchema from "../../schemas/workDone/workDone.schema";

export const createWorkDone = async (data: any) => {
  try {
    const {
      patient,
      doctor,
      treatment,
      company,
      complaintType,
      workDoneNote,
      amount,
      discount,
      treatmentCode,
      tooth,
      toothNotation,
      dentitionType,
      position,
      side,
      toothNote,
      recordType,
      examiningDoctor,
      receivedAmount,
      user,
    } = data;

    if (!patient || !doctor || !company) {
      return {
        success: "error",
        message: "Missing required fields (patient, doctor, company).",
        statusCode: 400,
      };
    }

    const record = new WorkDoneSchema({
      patient,
      doctor,
      treatment: treatment || null,
      company,
      complaintType: complaintType || "",
      workDoneNote: workDoneNote || "",
      amount: amount || 0,
      discount: discount || 0,
      receivedAmount: receivedAmount || 0,
      treatmentCode: treatmentCode || "",
      status: data.status || "COMPLETE",
      tooth: tooth || null,
      toothNotation: toothNotation || "fdi",
      dentitionType: dentitionType || "adult",
      position: position || "",
      side: side || "",
      toothNote: toothNote || "",
      recordType: recordType || "tooth",
      examiningDoctor: examiningDoctor || null,
      createdBy: user,
    });

    const saved = await record.save();

    return {
      success: "success",
      message: "Work done created successfully.",
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

export const getWorkDone = async (query: any) => {
  try {
    const { patientId, patient, company, doctor, treatmentId } = query;
    const limit = Number(query.limit) || 20;
    const skip = query.skip ? Number(query.skip) : (Number(query.page || 1) - 1) * limit;

    const pId = patientId || patient;

    const matchStage: any = {
      isActive: true,
    };

    if (company && mongoose.Types.ObjectId.isValid(company)) matchStage.company = new mongoose.Types.ObjectId(company);
    if (pId && mongoose.Types.ObjectId.isValid(pId)) matchStage.patient = new mongoose.Types.ObjectId(pId);
    if (doctor && mongoose.Types.ObjectId.isValid(doctor)) matchStage.doctor = new mongoose.Types.ObjectId(doctor);
    if (treatmentId && mongoose.Types.ObjectId.isValid(treatmentId)) matchStage.treatment = new mongoose.Types.ObjectId(treatmentId);

    const records = await WorkDoneSchema.find(matchStage)
      .populate("doctor", "_id name code")
      .populate("examiningDoctor", "_id name code")
      .populate("patient", "_id name code")
      .populate({
        path: "treatment",
        select: "_id treatmentPlan tooth estimateMin estimateMax receivedAmount discount doctor examiningDoctor complaintType",
        populate: {
          path: "doctor examiningDoctor",
          select: "_id name code"
        }
      })
      .populate("createdBy", "_id name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await WorkDoneSchema.countDocuments(matchStage);

    return {
      success: "success",
      totalItems: totalRecords,
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

export const updateWorkDone = async (data: any) => {
  try {
    const {
      id, status, workDoneNote, amount, discount, doctor, treatmentCode, complaintType,
      tooth, toothNotation, dentitionType, position, side, toothNote, recordType, examiningDoctor,
      receivedAmount,
      paymentAmount,
      user
    } = data;

    const updateQuery: any = {
      $set: {
        status,
        workDoneNote,
        amount,
        discount,
        doctor,
        treatmentCode,
        complaintType,
        tooth,
        toothNotation,
        dentitionType,
        position,
        side,
        toothNote,
        recordType,
        examiningDoctor,
        updatedBy: user,
      }
    };

    if (receivedAmount !== undefined) updateQuery.$set.receivedAmount = receivedAmount;

    if (paymentAmount) {
      updateQuery.$push = { paymentHistory: { amount: paymentAmount, date: new Date() } };
      updateQuery.$inc = { receivedAmount: paymentAmount };
    }

    const updated = await WorkDoneSchema.findByIdAndUpdate(id, updateQuery, { new: true });

    if (!updated) {
      return {
        success: "error",
        message: "Work done not found.",
        statusCode: 404,
      };
    }

    return {
      success: "success",
      message: "Work done updated successfully.",
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

export const deleteWorkDone = async (data: any) => {
  try {
    const { workDoneId, user } = data;

    if (!workDoneId) {
      return {
        success: "error",
        message: "Work Done ID is required.",
        statusCode: 400,
      };
    }

    const deleted = await WorkDoneSchema.findByIdAndUpdate(
      workDoneId,
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
        message: "Work done not found.",
        statusCode: 404,
      };
    }

    return {
      success: "success",
      message: "Work done deleted successfully.",
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
export const getPatientFinancialStats = async (query: any) => {
  try {
    const { patientId, company, doctorId } = query;
    if (!patientId || !company) {
      return { success: "error", message: "Patient and Company ID required", statusCode: 400 };
    }

    const matchStage: any = {
      patient: new mongoose.Types.ObjectId(patientId),
      company: new mongoose.Types.ObjectId(company),
      isActive: true,
    };

    if (doctorId && doctorId !== 'all') {
      matchStage.doctor = new mongoose.Types.ObjectId(doctorId);
    }

    const stats = await WorkDoneSchema.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "toothtreatments",
          localField: "treatment",
          foreignField: "_id",
          as: "treatmentDetails",
        },
      },
      { $unwind: { path: "$treatmentDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalBill: { $sum: { $subtract: ["$amount", { $ifNull: ["$discount", 0] }] } },
          totalReceived: { $sum: { $ifNull: ["$receivedAmount", 0] } },
        },
      },
    ]);

    const result = stats[0] || { totalBill: 0, totalReceived: 0 };
    return {
      success: "success",
      data: {
        totalBill: result.totalBill,
        patientPending: Math.max(0, result.totalBill - result.totalReceived),
      },
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};
