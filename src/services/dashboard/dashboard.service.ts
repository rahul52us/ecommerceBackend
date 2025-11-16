import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../../schemas/User/User";
import appointmentsSchema from "../../schemas/appointments/appointments.schema";
import LabItemModal from "../../schemas/labItems/labItems.schema";

export const getPatientDashboardCount = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.bodyData.company);
    const patientId = new mongoose.Types.ObjectId(req.userId); // Make sure auth middleware sets req.user

    if (!patientId) {
      return res.status(400).json({ success: false, message: "Invalid patient ID" });
    }

    // Count active appointments for this patient
    const appointmentsCount = await appointmentsSchema.countDocuments({
      patient: patientId,
      isActive: true,
      company:companyId
    });

    // Count lab items for this patient
    const orders = await LabItemModal.countDocuments({
      patientName: patientId,
      isActive: true,
      company:companyId
    });

    return res.status(200).json({
      success: true,
      data: {
        appointments: appointmentsCount,
        orders: orders,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};



export const getDashboardData = async (req: any, res: Response, next: any) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.bodyData.company);
    const userTypeCounts = await UserModel.aggregate([
      {
        $match: {
          company: companyId,
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