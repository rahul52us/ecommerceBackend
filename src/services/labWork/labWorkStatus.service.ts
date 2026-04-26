import { Request, Response, NextFunction } from "express";
import LabWorkStatus from "../../schemas/labWork/labWorkStatus.schema";
import mongoose from "mongoose";

export const createLabWorkStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status, type, company } = req.body;
    const newStatus = new LabWorkStatus({
      status,
      type,
      company: new mongoose.Types.ObjectId(company),
    });
    await newStatus.save();
    res.status(201).json({ status: "success", data: newStatus });
  } catch (err) {
    next(err);
  }
};

export const getLabWorkStatuses = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { company, type } = req.query;
    const query: any = { company: new mongoose.Types.ObjectId(company as string), isActive: true };
    if (type) query.type = type;

    const statuses = await LabWorkStatus.find(query).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: statuses });
  } catch (err) {
    next(err);
  }
};

export const updateLabWorkStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, type } = req.body;
    const updated = await LabWorkStatus.findByIdAndUpdate(
      id,
      { status, type },
      { new: true }
    );
    res.status(200).json({ status: "success", data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteLabWorkStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await LabWorkStatus.findByIdAndUpdate(id, { isActive: false });
    res.status(200).json({ status: "success", message: "Status deleted" });
  } catch (err) {
    next(err);
  }
};
