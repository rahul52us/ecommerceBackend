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

    let query: any = {}

    const userTypeCounts = await UserModel.aggregate([
      {
        $match: {
          company: companyId,
          userType: { $in: ["doctor", "staff", "patient", "dealer"] },
          ...query
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
      appointments: 0,
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
      ...query
    });

    const appointmentCount = await appointmentsSchema.countDocuments({
      company: companyId,
      isActive: true,
      ...query
    });

    countsMap.dealers = dealerCount;
    countsMap.appointments = appointmentCount;

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
          userType: { $in: ["doctor", "staff", "patient", "dealer"] },
          createdAt: { $gte: sevenDaysAgo },
          ...query
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

    console.log(companyId)
    // Get recent users
    const recentUsers = await UserModel.find({
      company: companyId,
      userType: { $in: ["doctor", "staff", "patient", "dealer"] },
      ...query
    })
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
          status: { $in: ["completed", "scheduled", "in-progress", "arrived"] },
          ...query
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

export const getTimeSlotAnalytics = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.bodyData.company);
    
    // Date filters: default to today if not provided
    let query: any = { company: companyId, isActive: true };
    
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    query.appointmentDate = {
      $gte: start,
      $lte: end
    };

    const appointments = await appointmentsSchema.find(query).select('startTime patient primaryDoctor additionalDoctors');

    const slots = [
      { id: "7-10", label: "7 AM - 10 AM", start: 7, end: 10, appointments: 0, patients: new Set(), doctors: new Set(), exactTimes: [] as string[] },
      { id: "10-13", label: "10 AM - 1 PM", start: 10, end: 13, appointments: 0, patients: new Set(), doctors: new Set(), exactTimes: [] as string[] },
      { id: "13-16", label: "1 PM - 4 PM", start: 13, end: 16, appointments: 0, patients: new Set(), doctors: new Set(), exactTimes: [] as string[] },
      { id: "16-19", label: "4 PM - 7 PM", start: 16, end: 19, appointments: 0, patients: new Set(), doctors: new Set(), exactTimes: [] as string[] },
      { id: "19-22", label: "7 PM - 10 PM", start: 19, end: 22, appointments: 0, patients: new Set(), doctors: new Set(), exactTimes: [] as string[] }
    ];

    appointments.forEach((app: any) => {
      if (!app.startTime) return;
      
      // Parse "10:00 AM" to hours (0-23)
      let hours = 0;
      try {
        const timeParts = app.startTime.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/i);
        if (timeParts) {
          let h = parseInt(timeParts[1]);
          const isPM = timeParts[3] && timeParts[3].toUpperCase() === 'PM';
          if (isPM && h !== 12) h += 12;
          if (!isPM && h === 12) h = 0;
          hours = h;
        }
      } catch (e) { return; }

      // Find the slot
      const slot = slots.find(s => hours >= s.start && hours < s.end);
      if (slot) {
        slot.appointments++;
        slot.exactTimes.push(app.startTime);
        if (app.patient) slot.patients.add(app.patient.toString());
        if (app.primaryDoctor) slot.doctors.add(app.primaryDoctor.toString());
        if (app.additionalDoctors) {
          app.additionalDoctors.forEach((d: any) => slot.doctors.add(d.toString()));
        }
      }
    });

    const result = slots.map(s => ({
      slot: s.label,
      appointmentsCount: s.appointments,
      patientsCount: s.patients.size,
      doctorsCount: s.doctors.size,
      exactTimes: s.exactTimes
    }));

    return res.status(200).json({
      success: true,
      message: "Time slot analytics fetched successfully",
      data: result
    });
  } catch (error: any) {
    next(error);
  }
};