import mongoose from "mongoose";
import { createChairsRepo, deleteChair, getChairsRepo, getTodayChairSummary, updateChairsRepo } from '../../repository/chairs/chairs.repository'
import { NextFunction, Response } from "express";


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


export const deleteChairService = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status, data, message } = await deleteChair(req.params.id);

    if (status === "success") {
      return res.status(200).json({
        message,
        statusCode: 200,
        data,
        success: true,
      });
    }

    next(data); // forward error to global error handler
  } catch (err) {
    next(err);
  }
};

export const updateChairService = async (req: any, res: any) => {
  try {
    const { status, message, data } = await updateChairsRepo(req.params.id, req.body);

    if (status === "success") {
      return res.status(200).json({
        status,
        message,
        data,
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const getChairSummaryService = async (req: any, res: any) => {
  try {
    const { data, status, message, statusCode } = await getTodayChairSummary({ date: req.body.date, company: req.body.company, status: req.body.status })
    return res.status(statusCode).send({
      status,
      data,
      message
    })
  }
  catch (err: any) {
    return res.status(500).send({
      status: 'error',
      data: err?.message,
      message: err?.message
    })
  }
}
