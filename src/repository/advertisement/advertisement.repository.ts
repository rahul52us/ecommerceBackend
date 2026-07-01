import Advertisement from "../../schemas/advertisement/advertisement.schema";
import { uploadFile } from "../uploadDoc.repository";

export const createAdvertisement = async (data: any, userId: string, companyId: string) => {
  try {
    if (data.image && data.image.isAdd === 1) {
      const url = await uploadFile(data.image);
      data.image = {
        name: data.image.filename,
        url: url,
        type: data.image.type,
      };
    }

    const advertisement = new Advertisement({
      ...data,
      createdBy: userId,
      company: companyId,
    });
    const savedAdvertisement = await advertisement.save();

    return {
      status: "success",
      data: savedAdvertisement,
      message: "Advertisement has been saved successfully",
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

export const updateAdvertisement = async (id: string, data: any) => {
  try {
    if (data.image && data.image.isAdd === 1) {
      const url = await uploadFile(data.image);
      data.image = {
        name: data.image.filename,
        url: url,
        type: data.image.type,
      };
    }

    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    if (!updatedAdvertisement) {
      return {
        status: "error",
        message: "Advertisement not found",
        statusCode: 404,
      };
    }

    return {
      status: "success",
      data: updatedAdvertisement,
      message: "Advertisement has been updated successfully",
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

export const getAdvertisements = async (
  page: number,
  limit: number,
  companyId: string,
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { company: companyId };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const advertisements = await Advertisement.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Advertisement.countDocuments(query);

    return {
      status: "success",
      data: advertisements,
      totalPages: Math.ceil(total / limit),
      total,
      message: "Advertisements fetched successfully",
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

export const getActiveAdvertisements = async (companyId: string) => {
  try {
    const currentDate = new Date();
    const query: any = {
      company: companyId,
      status: true,
      validFrom: { $lte: currentDate },
      validTo: { $gte: currentDate }
    };

    const advertisements = await Advertisement.find(query).sort({ createdAt: -1 });

    return {
      status: "success",
      data: advertisements,
      message: "Active Advertisements fetched successfully",
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

export const deleteAdvertisement = async (id: string) => {
  try {
    const deletedAdvertisement = await Advertisement.findByIdAndDelete(id);
    if (!deletedAdvertisement) {
      return {
        status: "error",
        message: "Advertisement not found",
        statusCode: 404,
      };
    }
    return {
      status: "success",
      data: deletedAdvertisement,
      message: "Advertisement deleted successfully",
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
