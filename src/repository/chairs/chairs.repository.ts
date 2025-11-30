import mongoose from "mongoose";
import Chair from "../../schemas/chairs/chairs.schema"; // <-- adjust path as needed

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

