import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import Procedure from "../../schemas/procedure/procedure.schema";

export const createProcedureService = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, subcategory, name, company } = req.body;
    const createdBy = req.userId;

    const newProcedure = new Procedure({
      category,
      subcategory,
      name,
      company: new mongoose.Types.ObjectId(company),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    const savedProcedure = await newProcedure.save();
    return res.status(200).send({
      status: "success",
      message: "Procedure created successfully",
      data: savedProcedure,
    });
  } catch (err: any) {
    next(err);
  }
};

export const getProceduresService = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.query.companyId;

    if (!companyId) {
      return res.status(400).send({
        status: "error",
        message: "companyId is required",
      });
    }

    const procedures = await Procedure.find({
      company: new mongoose.Types.ObjectId(companyId as string),
      isActive: true,
    }).sort({ category: 1, subcategory: 1, name: 1 });

    return res.status(200).send({
      status: "success",
      message: "Procedures fetched successfully",
      data: procedures,
    });
  } catch (err: any) {
    next(err);
  }
};

export const updateProcedureService = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProcedure = await Procedure.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedProcedure) {
      return res.status(404).send({
        status: "error",
        message: "Procedure not found",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Procedure updated successfully",
      data: updatedProcedure,
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteProcedureService = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deletedProcedure = await Procedure.findByIdAndUpdate(
      id,
      { $set: { isActive: false, deletedAt: new Date() } },
      { new: true }
    );

    if (!deletedProcedure) {
      return res.status(404).send({
        status: "error",
        message: "Procedure not found",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Procedure deleted successfully",
      data: deletedProcedure,
    });
  } catch (err: any) {
    next(err);
  }
};

export const bulkCreateProceduresService = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { procedures, company } = req.body;
    const createdBy = req.userId;

    if (!Array.isArray(procedures)) {
      return res.status(400).send({
        status: "error",
        message: "procedures must be an array",
      });
    }

    const procedureDocs = procedures.map((p: any) => ({
      ...p,
      company: new mongoose.Types.ObjectId(company),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    }));

    const savedProcedures = await Procedure.insertMany(procedureDocs);

    return res.status(200).send({
      status: "success",
      message: `${savedProcedures.length} procedures created successfully`,
      data: savedProcedures,
    });
  } catch (err: any) {
    next(err);
  }
};
