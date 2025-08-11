import { Response } from "express";
import { createBookingDetails, getBooking } from "../../repository/bookingDetails/bookingDetails.repository";
import mongoose from "mongoose";

export const createBookingDetailService = async (
  req: any,
  res: Response,
  next: any
) => {
  try {
    const { status, statusCode, data, message } = await createBookingDetails({...req.body});

    if (status === "success") {

      return res.status(statusCode).send({
        message: message,
        data: req.body,
        status: status,
      });
    } else {
      // If creation fails, return the error response
      return res.status(statusCode).send({
        data,
        message,
        status,
      });
    }
  } catch (err: any) {
    next(err);
  }
};


export const getBookingService = async (
  req: any,
  res: Response,
  next: any
) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req?.query?.search?.trim() || undefined;

    const { status, statusCode, data , totalPages, message } = await getBooking(search, page, limit, new mongoose.Types.ObjectId(req.body.company));

    return res.status(statusCode).send({
      message: message,
      status: status,
      data: {data, totalPages},
      totalPages
    });
  } catch (err: any) {
    next(err);
  }
};