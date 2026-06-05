import DoctorInventoryModel from "../../schemas/doctorInventory/doctorInventory.schema";

export const createDoctorInventory = async (data: any) => {
  try {
    const inventoryDetails = new DoctorInventoryModel({ ...data, createdAt: new Date() });
    const savedInventory = await inventoryDetails.save();

    return {
      status: "success",
      data: savedInventory,
      message: "Doctor Inventory Details have been saved successfully",
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500,
    };
  }
};

export const updateDoctorInventory = async (data: any) => {
  try {
    const inventoryDetails = await DoctorInventoryModel.findByIdAndUpdate(data?._id || data?.id, { $set: { ...data } }, { new: true });
    return {
      status: "success",
      data: inventoryDetails,
      message: "Doctor Inventory Details have been updated successfully",
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500,
    };
  }
};

export const deleteDoctorInventory = async (data: any) => {
  try {
    const inventoryDetails = await DoctorInventoryModel.findByIdAndUpdate(data?.id, { $set: { isActive: false, deletedAt: new Date() } }, { new: true });
    return {
      status: "success",
      data: inventoryDetails,
      message: "Doctor Inventory Details have been deleted successfully",
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500,
    };
  }
};

export const getDoctorInventories = async (
  search: string | undefined,
  page: number,
  limit: number,
  company: any,
  userId: any,
  userType: any
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { deletedAt: { $exists: false }, isActive: true, company: company };

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (userId && userType === "staff") {
      query.createdBy = userId;
    }

    const inventories = await DoctorInventoryModel.find(query)
      .populate("labDoctor", "labDoctorName email mobileNumber")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalInventories = await DoctorInventoryModel.countDocuments(query);

    return {
      status: "success",
      data: inventories,
      totalPages: Math.ceil(totalInventories / limit),
      message: "Doctor Inventories fetched successfully",
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500,
    };
  }
};
