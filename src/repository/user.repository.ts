import { Types } from "mongoose";
import User from "../schemas/User";

export const getUserDetailsById = async (id: string) => {
  try {
    const userData = await User.findById(id).populate('company')
    return userData
      ? {
          statusCode: 200,
          status: "success",
          data: userData,
          message: "User details retrieved successfully",
        }
      : {
          statusCode: 300,
          status: "error",
          data: null,
          message: "User not found",
        };
  } catch (error: any) {
    return {
      statusCode: 500,
      status: "error",
      data: null,
      message: error.message,
    };
  }
};
