import Accountability from "../../schemas/accountability/accountability.schema";
import WorkDone from "../../schemas/workDone/workDone.schema";

export const createAccountability = async (data: any) => {
  try {
    const accountability = new Accountability(data);
    await accountability.save();
    
    if (accountability.workDone) {
      await WorkDone.findByIdAndUpdate(accountability.workDone, {
        $set: { updateLastAccountbilityDate: new Date() }
      });
    }

    return { status: "success", data: accountability };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const updateAccountability = async (id: string, data: any) => {
  try {
    data.lastAccountabilityAmountUpdated = new Date();
    const accountability = await Accountability.findByIdAndUpdate(id, { $set: data }, { new: true });
    
    if (accountability && accountability.workDone) {
      await WorkDone.findByIdAndUpdate(accountability.workDone, {
        $set: { updateLastAccountbilityDate: new Date() }
      });
    }

    return { status: "success", data: accountability };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const getAccountabilityList = async (query: any) => {
  try {
    const { page = 1, limit = 10, companyId, doctorId, payoutStatus, startDate, endDate } = query;
    
    const filter: any = { company: companyId };
    if (doctorId) filter.doctor = doctorId;
    if (query.patient) filter.patient = query.patient;
    if (payoutStatus) filter.payoutStatus = payoutStatus;
    
    if (startDate && endDate) {
      filter.lastAccountabilityAmountUpdated = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const total = await Accountability.countDocuments(filter);
    const data = await Accountability.find(filter)
      .populate("doctor", "name")
      .populate("patient", "name")
      .populate("workDone")
      .sort({ lastAccountabilityAmountUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      status: "success",
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const updatePayoutStatus = async (id: string, status: string, note?: string, doctorShareAmount?: number, payoutAmount?: number, paymentMethod?: string) => {
  try {
    const updateData: any = { lastAccountabilityAmountUpdated: new Date() };
    if (status) updateData.payoutStatus = status;
    if (status === "PAID") {
      updateData.payoutDate = new Date();
    }
    if (note) updateData.note = note;
    
    if (doctorShareAmount !== undefined) {
      updateData.doctorShareAmount = doctorShareAmount;
    }

    const query: any = { $set: updateData };
    
    if (payoutAmount) {
      query.$push = { payoutHistory: { amount: payoutAmount, date: new Date(), paymentMethod } };
      query.$inc = { doctorShareAmount: payoutAmount };
    }

    const accountability = await Accountability.findByIdAndUpdate(id, query, { new: true });

    if (accountability && accountability.workDone) {
      await WorkDone.findByIdAndUpdate(accountability.workDone, {
        $set: { updateLastAccountbilityDate: new Date() }
      });
    }

    return { status: "success", data: accountability };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const deleteAccountability = async (id: string) => {
  try {
    await Accountability.findByIdAndDelete(id);
    return { status: "success", message: "Accountability record deleted" };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

/**
 * GENERATE PAYOUT REPORT SERVICE
 */
export const generateAccountabilityReportService = async (query: any) => {
  try {
    const { companyId, doctorId, payoutStatus, startDate, endDate } = query;
    const filter: any = { company: companyId };
    if (doctorId) filter.doctor = doctorId;
    if (payoutStatus) filter.payoutStatus = payoutStatus;
    
    if (startDate && endDate) {
      filter.lastAccountabilityAmountUpdated = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await Accountability.find(filter)
      .populate("doctor", "name")
      .populate("patient", "name")
      .sort({ lastAccountabilityAmountUpdated: -1 });

    const CompanyModel = require("../../schemas/company/Company.ts").default;
    const UserModel = require("../../schemas/User/User").default;
    const clinic = await CompanyModel.findById(companyId);
    const doctor = doctorId ? await UserModel.findById(doctorId).select("name") : null;

    const chunks: any[] = [];
    const stream = new (require("stream").PassThrough)();

    const resultPromise = new Promise((resolve, reject) => {
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer.toString("base64"));
      });
      stream.on("error", reject);
    });

    const { generateAccountabilityPDF } = require("../../modules/config/pdfGenerator");
    generateAccountabilityPDF({ records, clinic, doctor }, stream);

    const base64 = await resultPromise;
    return {
      status: "success",
      message: "Payout Report generated successfully",
      data: base64
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const getAccountabilityCountByDate = async (query: any) => {
  try {
    const { company, patientId } = query;
    if (!company || !patientId) {
      throw new Error("Company and Patient ID are required");
    }

    const accountabilityData = await Accountability.find({
      company,
      patient: patientId
    });

    const counts: { [date: string]: number } = {};
    accountabilityData.forEach((item: any) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    const result = Object.keys(counts).map(date => ({
      date,
      count: counts[date]
    }));

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { status: "success", data: result };
  } catch (err: any) {
    throw new Error(err.message);
  }
};
