import { Response } from "express";
import {
  createAdvertisement,
  updateAdvertisement,
  getAdvertisements,
  getActiveAdvertisements,
  deleteAdvertisement
} from "../../repository/advertisement/advertisement.repository";

export const createAdvertisementService = async (req: any, res: Response, next: any) => {
  try {
    const userId = req.userId;
    const companyId = req.bodyData?.company;

    const { status, statusCode, data, message } = await createAdvertisement(req.body, userId, companyId);
    return res.status(statusCode).send({ status, data, message });
  } catch (err: any) {
    next(err);
  }
};

export const updateAdvertisementService = async (req: any, res: Response, next: any) => {
  try {
    const id = req.params.id;
    const { status, statusCode, data, message } = await updateAdvertisement(id, req.body);
    return res.status(statusCode).send({ status, data, message });
  } catch (err: any) {
    next(err);
  }
};

export const getAdvertisementsService = async (req: any, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || undefined;
    const companyId = req.bodyData?.company;

    const { status, statusCode, data, totalPages, total, message } = await getAdvertisements(
      page,
      limit,
      companyId,
      search
    );

    return res.status(statusCode).send({
      status,
      message,
      data: { data, totalPages, total },
      totalPages,
    });
  } catch (err: any) {
    next(err);
  }
};

export const getActiveAdvertisementsService = async (req: any, res: Response, next: any) => {
  try {
    // If not authenticated, we might not have req.user, but dashboard needs it.
    // Assuming users are authenticated when viewing dashboard.
    const companyId = req.bodyData?.company;

    const { status, statusCode, data, message } = await getActiveAdvertisements(companyId);
    return res.status(statusCode).send({ status, data, message });
  } catch (err: any) {
    next(err);
  }
};

export const deleteAdvertisementService = async (req: any, res: Response, next: any) => {
  try {
    const id = req.params.id;
    const { status, statusCode, data, message } = await deleteAdvertisement(id);
    return res.status(statusCode).send({ status, data, message });
  } catch (err: any) {
    next(err);
  }
};
