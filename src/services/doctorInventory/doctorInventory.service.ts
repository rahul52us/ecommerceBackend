import { Response } from "express";
import {
  createDoctorInventory,
  deleteDoctorInventory,
  getDoctorInventories,
  updateDoctorInventory,
} from "../../repository/doctorInventory/doctorInventory.repository";

export const createDoctorInventoryService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await createDoctorInventory({
      ...req.body,
      createdBy: req.userId,
      company: req.body.company || req.bodyData?.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    next(err);
  }
};

export const updateDoctorInventoryService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await updateDoctorInventory({
      ...req.body,
      id: req.params.id,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteDoctorInventoryService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await deleteDoctorInventory({
      ...req.body,
      id: req.params.id,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    next(err);
  }
};

export const getDoctorInventoriesService = async (req: any, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchQuery = req?.query?.search || req?.query?.searchValue;
    const search = searchQuery ? (searchQuery as string).trim() : undefined;

    const { status, statusCode, data, totalPages, message } = await getDoctorInventories(
      search,
      page,
      limit,
      req.bodyData.company,
      req.userId,
      req.bodyData.userType
    );

    return res.status(statusCode).send({
      message,
      status,
      data: { data, totalPages },
      totalPages,
    });
  } catch (err: any) {
    next(err);
  }
};
