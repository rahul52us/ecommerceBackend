import Prescription from "../../schemas/prescription/prescription.schema";

export const createPrescription = async (data: any) => {
  try {
    const newPrescription = new Prescription(data);
    return await newPrescription.save();
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const getPrescriptions = async (query: any) => {
  try {
    const { page = 1, limit = 10, search, companyId } = query;
    const filter: any = {};

    if (companyId) {
      filter.company = companyId;
    }

    if (search) {
      filter.$or = [
        { brandName: { $regex: search, $options: "i" } },
        { basicSalt: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Prescription.countDocuments(filter);
    const data = await Prescription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const updatePrescription = async (id: string, data: any) => {
  try {
    return await Prescription.findByIdAndUpdate(id, data, { new: true });
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const deletePrescription = async (id: string) => {
  try {
    return await Prescription.findByIdAndDelete(id);
  } catch (err: any) {
    throw new Error(err.message);
  }
};
