import { NextFunction, Response } from "express";
import {
  createLab,
  deleteLab,
  getLabs,
  updateLab,
} from "../../repository/lab/lab.repository";
import SendMail from "../../config/sendMail/sendMail";
import mongoose from "mongoose";
import LabItemModal from "../../schemas/labItems/labItems.schema";

export const createLabService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await createLab({
      ...req.body,
      createdBy: req.userId,
      company: req.body.company,
    });
    if (status === "success") {
      let items = req.body.items || [];

      // ✅ Filter only valid items
      let validItems = items.filter((it: any) => it.itemName && it.itemCode);

      if (validItems.length > 0) {
        let result = validItems.map((it: any) => ({
          ...it,
          lab: data?._id,
          createdBy: req.userId,
          createdAt: new Date(),
          company: req.body.company,
        }));

        await LabItemModal.insertMany(result);
      }

      return res.status(statusCode).send({
        message,
        data: req.body,
        status,
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

export const updateLabService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await updateLab({
      ...req.body,
      id: req.params.id,
    });
    if (status === "success") {
      return res.status(statusCode).send({
        message: message,
        data: req.body,
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

export const deleteLabService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await deleteLab({
      ...req.body,
      id: req.params.id,
    });
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

export const createLabItemservice = async (
  req: any,
  res: Response,
  next: any
) => {
  try {
    const lineItem = await new LabItemModal({
      ...req.body,
      createdBy: req.userId,
      company: req.body.company,
    });
    const savedLineItems = await lineItem.save();
    return res.status(200).send({
      status: "success",
      data: savedLineItems,
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteLabItem = async (req: any, res: Response, next: any) => {
  try {
    const lineItem = await LabItemModal.findByIdAndUpdate(
      req.params.id,
      {
        $set: { deletedAt: new Date() },
      },
      { new: true }
    );
    const savedLineItems = await lineItem.save();
    return res.status(200).send({
      status: "success",
      data: savedLineItems,
      message: "Lab Item is deleted Successful",
    });
  } catch (err: any) {
    next(err);
  }
};

export const getLabServices = async (req: any, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req?.query?.search || req?.query?.searchValue;
    const search = searchQuery ? (searchQuery as string).trim() : undefined;

    const { status, statusCode, data, totalPages, message } = await getLabs(
      search,
      page,
      limit,
      req.bodyData.company
    );

    return res.status(statusCode).send({
      message: message,
      status: status,
      data: { data, totalPages },
      totalPages,
    });
  } catch (err: any) {
    console.log(err);
    next(err);
  }
};

export const getLabItems = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const lab = req.query.lab ? new mongoose.Types.ObjectId(req.query.lab) : null

    const searchQuery = req?.query?.search || req?.query?.searchValue;
    const search = searchQuery ? (searchQuery as string).trim() : undefined;

    let match: any = {
      isActive: true,
      deletedAt: { $exists: false },
    };

    if(lab){
      match = {...match, lab : lab}
    }

    if(req.query.patientId){
      match = {...match, patientName : new mongoose.Types.ObjectId(req.query.patientId)}
    }

    if (search) {
      match.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline: any[] = [
      { $match: match },

      // Lookup for patientName
      {
        $lookup: {
          from: "users", // Mongo collection name of User model
          localField: "patientName",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          itemName: 1,
          itemCode: 1,
          quantity: 1,
          price: 1,
          total: 1,
          createdAt: 1,
          isActive: 1,
          "patientDetails._id": 1,
          "patientDetails.name": 1,
          "patientDetails.code": 1,
          "patientDetails.username": 1,
        },
      },
      { $sort: { createdAt: -1 } },

      // Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    // Execute aggregation
    const data = await LabItemModal.aggregate(pipeline);

    // Count total docs (without pagination)
    const totalDocs = await LabItemModal.countDocuments(match);
    const totalPages = Math.ceil(totalDocs / limit);

    return res.status(200).send({
      message: "Lab items fetched successfully",
      status: "success",
      data,
      totalDocs,
      totalPages,
      currentPage: page,
    });
  } catch (err: any) {
    console.error(err);
    next(err);
  }
};

export const getPatientLabItems = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const patientName = new mongoose.Types.ObjectId(req.query.id);

    const searchQuery = req?.query?.search || req?.query?.searchValue;
    const search = searchQuery ? (searchQuery as string).trim() : undefined;

    const match: any = {
      isActive: true,
      patientName: patientName,
      deletedAt: { $exists: false },
    };

    if (search) {
      match.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline: any[] = [
      { $match: match },

      // Lookup for patientName
      {
        $lookup: {
          from: "labs", // Mongo collection name of User model
          localField: "lab",
          foreignField: "_id",
          as: "labDetails",
        },
      },
      {
        $unwind: {
          path: "$labDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // Mongo collection name of User model
          localField: "patientName",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          itemName: 1,
          itemCode: 1,
          quantity: 1,
          price: 1,
          total: 1,
          createdAt: 1,
          isActive: 1,
          "patientDetails._id": 1,
          "patientDetails.name": 1,
          "patientDetails.code": 1,
          "patientDetails.username": 1,
          "labDetails._id": 1,
          "labDetails.name": 1,
          "labDetails.isActive": 1,
        },
      },
      { $sort: { createdAt: -1 } },

      // Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    // Execute aggregation
    const data = await LabItemModal.aggregate(pipeline);

    // Count total docs (without pagination)
    const totalDocs = await LabItemModal.countDocuments(match);
    const totalPages = Math.ceil(totalDocs / limit);

    return res.status(200).send({
      message: "Lab items fetched successfully",
      status: "success",
      data,
      totalDocs,
      totalPages,
      currentPage: page,
    });
  } catch (err: any) {
    console.error(err);
    next(err);
  }
};

export const updateLineItems = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const updateLineItems = await LabItemModal.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body } }
    );
    return res.status(200).send({
      message: "Line Items has been updated",
      status: "success",
      data: updateLineItems,
    });
  } catch (err: any) {
    next(err);
  }
};

export const sendResume = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attachmentBase64String } = req.body;

    const applicantName = `${req.body?.firstName || "Applicant"} ${
      req.body?.lastName || ""
    }`.trim();
    const emailSubject = `New Resume Submission from ${applicantName}`;

    await SendMail(
      process.env.WEBSITE_EMAIL!,
      emailSubject,
      "resume/send_resume.html",
      { ...req.body, reciever_mail: process.env.WEBSITE_EMAIL },
      attachmentBase64String
    );

    await SendMail(
      req.body?.email,
      "Application Received – Thank You!",
      "resume/confirmation.html",
      { ...req.body, reciever_mail: req.body?.email }
    );

    return res.status(200).send({
      message: "Resume has been Sent Successfully",
      status: "success",
      data: "Resume has been sent successfully",
    });
  } catch (err: any) {
    next(err);
  }
};
