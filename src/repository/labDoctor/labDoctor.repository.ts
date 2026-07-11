import LabDoctorModel from "../../schemas/labDoctor/labDoctor.schema";

export const createLabDoctor = async (data: any) => {
  try {
    const labDoctorDetails = new LabDoctorModel({ ...data, createdAt: new Date() });
    const savedLabDoctorDetails = await labDoctorDetails.save();

    return {
      status: "success",
      data: savedLabDoctorDetails,
      message: "Lab Doctor Details have been saved successfully",
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

export const updateLabDoctor = async (data: any) => {
  try {
    const labDoctorDetails = await LabDoctorModel.findByIdAndUpdate(data?._id || data?.id, { $set: { ...data } }, { new: true });
    return {
      status: "success",
      data: labDoctorDetails,
      message: "Lab Doctor Details have been updated successfully",
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

export const deleteLabDoctor = async (data: any) => {
  try {
    const labDoctorDetails = await LabDoctorModel.findByIdAndUpdate(data?.id, { $set: { isActive: false, deletedAt: new Date() } }, { new: true });
    return {
      status: "success",
      data: labDoctorDetails,
      message: "Lab Doctor Details have been deleted successfully",
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

export const getLabDoctors = async (
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
        { labDoctorName: { $regex: search, $options: "i" } }
      ];
    }

    const labDoctors = await LabDoctorModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalLabDoctors = await LabDoctorModel.countDocuments(query);

    return {
      status: "success",
      data: labDoctors,
      totalPages: Math.ceil(totalLabDoctors / limit),
      message: "Lab Doctors fetched successfully",
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
