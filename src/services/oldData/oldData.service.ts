import { Request, Response } from "express";
import LegacyWorkComp from "../../schemas/legacy/LegacyWorkComp";
import LegacyToothWork from "../../schemas/legacy/LegacyToothWork";
import LegacyTransaction from "../../schemas/legacy/LegacyTransaction";
import LegacyWorkFee from "../../schemas/legacy/LegacyWorkFee";
import LegacyWorkCompDetail from "../../schemas/legacy/LegacyWorkCompDetail";
import mongoose from "mongoose";

export const getOldWorkCompService = async (req: Request, res: Response) => {
  try {
    const { patientId, legacyPatCode, search, page = 1, limit = 50, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    if (startDate || endDate) {
      query.wrk_date = {};
      if (startDate) query.wrk_date.$gte = new Date(startDate as string);
      if (endDate) {
         const end = new Date(endDate as string);
         end.setHours(23, 59, 59, 999);
         query.wrk_date.$lte = end;
      }
    }
    if (patientId) query.patientId = new mongoose.Types.ObjectId(patientId as string);
    if (legacyPatCode) query.legacyPatCode = legacyPatCode;
    if (search) {
      const searchStr = search as string;
      if (/^\d{1,2}$/.test(searchStr.trim())) {
        query.legacyDocCode = searchStr.trim();
      } else {
        query.$or = [
          { legacyPatCode: { $regex: searchStr, $options: "i" } },
          { legacyDocCode: { $regex: searchStr, $options: "i" } }
        ];
      }
    }

    const totalCount = await LegacyWorkComp.countDocuments(query);
    const data = await LegacyWorkComp.find(query)
      .populate("patientId", "name code mobileNumber")
      .populate("doctorId", "name code")
      .sort({ wrk_date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      totalCount,
      page: Number(page),
      limit: Number(limit),
      data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLegacyRecordDetailsService = async (req: Request, res: Response) => {
  try {
    const { legacyWrkDoneId } = req.params;

    if (!legacyWrkDoneId) {
      return res.status(400).json({ success: false, message: "legacyWrkDoneId is required" });
    }

    const [workComp, details, transactions, workFees, toothWorks] = await Promise.all([
      LegacyWorkComp.findOne({ legacyWrkDoneId })
        .populate("patientId", "name code mobileNumber")
        .populate("doctorId", "name code")
        .lean(),
      LegacyWorkCompDetail.find({ legacyWrkDoneId }).lean(),
      LegacyTransaction.find({ legacyWrkDoneId }).lean(),
      LegacyWorkFee.find({ legacyWrkDoneId }).lean(),
      LegacyToothWork.find({ legacyWrkDoneId }).lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        workComp,
        details,
        transactions,
        workFees,
        toothWorks
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOldToothWorkService = async (req: Request, res: Response) => {
  try {
    const { patientId, legacyPatCode, search, page = 1, limit = 50, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) {
         const end = new Date(endDate as string);
         end.setHours(23, 59, 59, 999);
         query.date.$lte = end;
      }
    }
    if (patientId) query.patientId = new mongoose.Types.ObjectId(patientId as string);
    if (legacyPatCode) query.legacyPatCode = legacyPatCode;
    if (search) {
      const searchStr = search as string;
      if (/^\d{1,2}$/.test(searchStr.trim())) {
        query.legacyDocCode = searchStr.trim();
      } else {
        query.$or = [
          { legacyPatCode: { $regex: searchStr, $options: "i" } },
          { legacyDocCode: { $regex: searchStr, $options: "i" } }
        ];
      }
    }

    const totalCount = await LegacyToothWork.countDocuments(query);
    const data = await LegacyToothWork.find(query)
      .populate("patientId", "name code mobileNumber")
      .populate("doctorId", "name code")
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      totalCount,
      page: Number(page),
      limit: Number(limit),
      data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOldTransactionService = async (req: Request, res: Response) => {
  try {
    const { patientId, legacyPatCode, search, page = 1, limit = 50, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) {
         const end = new Date(endDate as string);
         end.setHours(23, 59, 59, 999);
         query.date.$lte = end;
      }
    }
    if (patientId) query.patientId = new mongoose.Types.ObjectId(patientId as string);
    if (legacyPatCode) query.legacyPatCode = legacyPatCode;
    if (search) {
      const searchStr = search as string;
      if (/^\d{1,2}$/.test(searchStr.trim())) {
        query.legacyDocCode = searchStr.trim();
      } else {
        query.$or = [
          { legacyPatCode: { $regex: searchStr, $options: "i" } },
          { legacyDocCode: { $regex: searchStr, $options: "i" } }
        ];
      }
    }

    const totalCount = await LegacyTransaction.countDocuments(query);
    const data = await LegacyTransaction.find(query)
      .populate("patientId", "name code mobileNumber")
      .populate("doctorId", "name code")
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      totalCount,
      page: Number(page),
      limit: Number(limit),
      data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOldWorkFeeService = async (req: Request, res: Response) => {
  try {
    const { patientId, legacyPatCode, search, page = 1, limit = 50, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    if (startDate || endDate) {
      query.wrk_date = {};
      if (startDate) query.wrk_date.$gte = new Date(startDate as string);
      if (endDate) {
         const end = new Date(endDate as string);
         end.setHours(23, 59, 59, 999);
         query.wrk_date.$lte = end;
      }
    }
    if (patientId) query.patientId = new mongoose.Types.ObjectId(patientId as string);
    if (legacyPatCode) query.legacyPatCode = legacyPatCode;
    if (search) {
      const searchStr = search as string;
      if (/^\d{1,2}$/.test(searchStr.trim())) {
        query.legacyDocCode = searchStr.trim();
      } else {
        query.$or = [
          { legacyPatCode: { $regex: searchStr, $options: "i" } },
          { legacyDocCode: { $regex: searchStr, $options: "i" } }
        ];
      }
    }

    const totalCount = await LegacyWorkFee.countDocuments(query);
    const data = await LegacyWorkFee.find(query)
      .populate("patientId", "name code mobileNumber")
      .populate("doctorId", "name code")
      .sort({ wrk_date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      totalCount,
      page: Number(page),
      limit: Number(limit),
      data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLegacyPatientHistoryService = async (req: Request, res: Response) => {
  try {
    const { legacyPatCode } = req.params;

    if (!legacyPatCode) {
      return res.status(400).json({ success: false, message: "legacyPatCode is required" });
    }

    const [workComp, details, transactions, workFees, toothWorks] = await Promise.all([
      LegacyWorkComp.find({ legacyPatCode })
        .populate("patientId", "name code mobileNumber")
        .populate("doctorId", "name code")
        .sort({ wrk_date: -1 })
        .lean(),
      LegacyWorkCompDetail.find({ legacyPatCode }).lean(),
      LegacyTransaction.find({ legacyPatCode })
        .sort({ date: -1 })
        .lean(),
      LegacyWorkFee.find({ legacyPatCode })
        .sort({ wrk_date: -1 })
        .lean(),
      LegacyToothWork.find({ legacyPatCode })
        .populate("patientId", "name code mobileNumber")
        .populate("doctorId", "name code")
        .sort({ date: -1 })
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        workComp,
        details,
        transactions,
        workFees,
        toothWorks
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
