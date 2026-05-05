import Accountability from "../../schemas/accountability/accountability.schema";
import WorkDone from "../../schemas/workDone/workDone.schema";

export const createAccountability = async (data: any) => {
  try {
    const accountability = new Accountability(data);
    await accountability.save();
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
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const total = await Accountability.countDocuments(filter);
    const data = await Accountability.find(filter)
      .populate("doctor", "name")
      .populate("patient", "name")
      .populate("workDone")
      .sort({ createdAt: -1 })
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
    const updateData: any = {};
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
