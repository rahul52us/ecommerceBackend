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

export const updateChairsRepo = async (id: string, payload: any) => {
  try {
    const updatedChair = await Chair.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (!updatedChair) {
      throw generateError("Chair not found", 404);
    }

    return {
      status: "success",
      message: "Chair updated successfully",
      statusCode: 200,
      data: updatedChair,
    };
  } catch (err: any) {
    return {
      status: "error",
      statusCode: err.statusCode || 500,
      message: err.message,
    };
  }
};


export const getTodayChairSummary = async (query: any) => {
  try {
    const { company } = query;

    // 📅 Today 00:00 → 23:59:59
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const companyMatch = company
      ? { company: new mongoose.Types.ObjectId(company) }
      : {};

    const pipeline : any = [
      // 1️⃣ Fetch all chairs for company
      { $match: companyMatch },

      // 2️⃣ Lookup today's appointments for each chair
      {
        $lookup: {
          from: "appointments",
          let: { chairId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$chair", "$$chairId"] },
                appointmentDate: { $gte: todayStart, $lte: todayEnd },
              },
            },

            // === JOIN PRIMARY DOCTOR ===
            {
              $lookup: {
                from: "users",
                localField: "primaryDoctor",
                foreignField: "_id",
                as: "primaryDoctor",
              },
            },
            { $unwind: { path: "$primaryDoctor", preserveNullAndEmptyArrays: true } },

            // === JOIN ADDITIONAL DOCTORS ===
            {
              $lookup: {
                from: "users",
                localField: "additionalDoctors",
                foreignField: "_id",
                as: "additionalDoctors",
              },
            },

            // === JOIN PATIENT ===
            {
              $lookup: {
                from: "users",
                localField: "patient",
                foreignField: "_id",
                as: "patient",
              },
            },
            { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

            // Clean appointment fields
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                status: 1,
                mode: 1,
                appointmentDate: 1,
                startTime: 1,
                endTime: 1,
                meetingLink: 1,
                location: 1,

                primaryDoctor: {
                  _id: "$primaryDoctor._id",
                  name: "$primaryDoctor.name",
                  code: "$primaryDoctor.code",
                },

                additionalDoctors: {
                  _id: 1,
                  name: 1,
                  code: 1,
                },

                patient: {
                  _id: "$patient._id",
                  name: "$patient.name",
                  code: "$patient.code",
                },
              },
            },
          ],
          as: "appointments",
        },
      },

      // 3️⃣ EXTRACT UNIQUE DOCTORS (Primary + Additional)
      {
        $addFields: {
          doctors: {
            $setUnion: [
              {
                // All primary doctors
                $map: {
                  input: "$appointments",
                  in: "$$this.primaryDoctor",
                },
              },
              {
                // Flatten additional doctors arrays
                $reduce: {
                  input: "$appointments.additionalDoctors",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
        },
      },

      // 4️⃣ EXTRACT UNIQUE PATIENTS
      {
        $addFields: {
          patients: {
            $setUnion: [
              {
                $map: { input: "$appointments", in: "$$this.patient" },
              },
            ],
          },
        },
      },

      // 5️⃣ Add appointment count
      {
        $addFields: {
          count: { $size: "$appointments" },
        },
      },

      // 6️⃣ Final output
      {
        $project: {
          _id: 1,
          chairName: 1,
          chairNo: 1,
          chairColor: 1,
          count: 1,
          appointments: 1,
          doctors: 1,
          patients: 1,
        },
      },

      { $sort: { chairNo: 1 } },
    ];

    const data = await Chair.aggregate(pipeline);

    return {
      status: 'success',
      message: "Today's chair summary fetched",
      data,
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("getTodayChairSummary error:", error);
    return {
      status: 'error',
      message: "Failed to get summary",
      error: error.message,
      statusCode: 500,
    };
  }
};

