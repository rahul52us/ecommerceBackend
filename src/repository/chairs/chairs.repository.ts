import mongoose from "mongoose";
import Chair from "../../schemas/chairs/chairs.schema"; // <-- adjust path as needed
import { generateError } from "../../modules/config/function";

export const createChairsRepo = async (payload: any) => {
  try {
    const {
      chairName,
      chairColor,
      chairDetails,
      chairNo,
      user,
      company,
    } = payload;
    

    // Basic validation
    if (!chairName || !chairColor || !chairDetails || !chairNo) {
      return {
        status: "error",
        statusCode: 400,
        message: "All fields are required",
        data: null,
      };
    }

    // Create new chair
    const newChair = await Chair.create({
      chairName,
      chairColor,
      chairDetails,
      chairNo,
      createdBy: user,     // mapped from req.userId
      company,
    });

    return {
      status: "success",
      statusCode: 201,
      message: "Chair created successfully",
      data: newChair,
    };

  } catch (err: any) {
    return {
      status: "error",
      statusCode: 500,
      message: err?.message || "Something went wrong",
      data: null,
    };
  }
};


export const getChairsRepo = async (query: any) => {
  try {
    let {
      chairName,
      chairColor,
      chairNo,
      company,
      limit = 10,
      page = 1,
    } = query;

    limit = parseInt(limit);
    page = parseInt(page);

    const skip = (page - 1) * limit;

    const findQuery: any = {};

    if (company)
      findQuery.company = new mongoose.Types.ObjectId(company);

    if (chairName)
      findQuery.chairName = { $regex: chairName, $options: "i" };

    if (chairColor)
      findQuery.chairColor = chairColor;

    if (chairNo)
      findQuery.chairNo = parseInt(chairNo);

    // Fetch data
    const data = await Chair.find(findQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count for pagination
    const totalCount = await Chair.countDocuments(findQuery);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: "success",
      message: "Chairs fetched successfully",
      data,
      totalPages,
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


export const deleteChair = async (id: string) => {
  try {
    const chair = await Chair.findById(id);
    if (!chair) {
      throw generateError("Chair not found", 404);
    }

    await Chair.findByIdAndDelete(id);

    return {
      status: "success",
      message: "Chair deleted successfully",
      statusCode: 200,
      data: "Chair deleted Successfully",
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err,
      statusCode: err.statusCode || 500,
      message: err.message,
    };
  }
};
