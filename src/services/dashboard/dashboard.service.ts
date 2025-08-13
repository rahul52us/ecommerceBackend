import { Response } from "express";
import mongoose from "mongoose";
import UserModel from "../../schemas/User/User";

export const getDashboardData = async (req: any, res: Response, next: any) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.body.company);
    const userTypeCounts = await UserModel.aggregate([
      {
        $match: {
          // company: companyId,
          userType: { $in: ["doctor", "staff", "patient"] },
        },
      },
      {
        $group: {
          _id: "$userType",
          count: { $sum: 1 },
        },
      },
    ]);

    const keyMap: Record<string, string> = {
      doctor: "doctors",
      staff: "staffs",
      patient: "patients",
    };

    const countsMap: any = {
      doctors: 0,
      staffs: 0,
      patients: 0,
    };

    userTypeCounts.forEach((item) => {
      const frontendKey = keyMap[item._id];
      if (frontendKey) {
        countsMap[frontendKey] = item.count;
      }
    });

    return res.status(200).send({
      message: "Dashboard data fetched successfully",
      status: true,
      data: countsMap,
    });
  } catch (err: any) {
    next(err);
  }
};