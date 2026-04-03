import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../../schemas/User/User";
import appointmentsSchema from "../../schemas/appointments/appointments.schema";
import LabItemModal from "../../schemas/labItems/labItems.schema";
import DealerModal from "../../schemas/dealers/dealer.schema";

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
      company: companyId
    });

    // Count lab items for this patient
    const orders = await LabItemModal.countDocuments({
      patientName: patientId,
      isActive: true,
      company: companyId
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
          userType: { $in: ["doctor", "staff", "patient", "dealer"] },
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
      dealer: "dealers",
    };

    const countsMap: any = {
      doctors: 0,
      staffs: 0,
      patients: 0,
      dealers: 0,
    };

    userTypeCounts.forEach((item) => {
      const frontendKey = keyMap[item._id];
      if (frontendKey) {
        countsMap[frontendKey] = item.count;
      }
    });

    const dealerCount = await DealerModal.countDocuments({
      company: companyId,
      isActive: true,
    });

    countsMap.dealers = dealerCount;

    // Get last 7 days registrations
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const aggregateGrowth = await UserModel.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Zero-fill missing days
    const registrationGrowth = last7Days.map(day => {
      const found = aggregateGrowth.find(a => a._id === day);
      return { _id: day, count: found ? found.count : 0 };
    });

    // Get recent users
    const recentUsers = await UserModel.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name userType createdAt pic');

    // Get monthly appointment trends (for Patient Retention chart)
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const aggregateTrends = await appointmentsSchema.aggregate([
      {
        $match: {
          company: companyId,
          appointmentDate: { $gte: sixMonthsAgo },
          isActive: true,
          status: { $in: ["completed", "scheduled", "in-progress", "arrived"] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$appointmentDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Zero-fill missing months
    const appointmentTrends = last6Months.map(month => {
      const found = aggregateTrends.find(a => a._id === month);
      return { _id: month, count: found ? found.count : 0 };
    });

    return res.status(200).send({
      message: "Dashboard data fetched successfully",
      status: true,
      data: {
        ...countsMap,
        growth: registrationGrowth,
        recentUsers: recentUsers,
        appointmentTrends: appointmentTrends,
      },
    });
  } catch (err: any) {
    next(err);
  }
};