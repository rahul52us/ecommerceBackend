import { Response } from "express";
import {
  createLabDoctor,
  deleteLabDoctor,
  getLabDoctors,
  updateLabDoctor,
} from "../../repository/labDoctor/labDoctor.repository";

export const createLabDoctorService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await createLabDoctor({
      ...req.body,
      createdBy: req.userId,
      company: req.body.company,
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

export const updateLabDoctorService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await updateLabDoctor({
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

export const deleteLabDoctorService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await deleteLabDoctor({
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

export const getLabDoctorsService = async (req: any, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req?.query?.search ? (req.query.search as string).trim() : undefined;

    const { status, statusCode, data, totalPages, message } = await getLabDoctors(
      search,
      page,
      limit,
      req.bodyData.company
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
