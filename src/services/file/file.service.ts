import { Response } from "express";
import { uploadFileDocument } from "../../repository/file/file.repository";

export const uploadFileDocumentService = async (
  req: any,
  res: Response,
  next: any
) => {
  try {
    const { status, statusCode, data, message } : any = await uploadFileDocument({...req.body});

    if (status === "success") {
      return res.status(statusCode).send({
        message: message,
        data: data,
        status: status,
      });
    } else {
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