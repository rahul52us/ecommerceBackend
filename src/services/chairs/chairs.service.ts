import mongoose from "mongoose";
import {createChairsRepo, getChairsRepo} from '../../repository/chairs/chairs.repository'

export const createChairsService = async (req: any, res: any) => {
  try {
    const { status, statusCode, data, message }: any = await createChairsRepo({
      ...req.body,
      user: req.userId,
      company: req.body.company,
    });
    return res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};


export const getChairsService = async (req: any, res: any) => {
  try {
    const {
      success,
      statusCode,
      message,
      data,
      totalPages
    } = await getChairsRepo({
      ...req.query,
      company: req.query?.company || req.body?.company,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data: { data, totalPages },
    });

  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

