import { NextFunction, Response } from "express";
import {
  createDealer,
  deleteDealer,
  getDealers,
  updateDealer,
} from "../../repository/dealer/dealer.repository";
import mongoose from "mongoose";
import DealerItemModal from "../../schemas/dealerItems/dealerItems.schema";

export const createDealerService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await createDealer({
      ...req.body,
      createdBy: req.userId,
      company: req.body.company,
    });
    if (status === "success") {
      let items = req.body.items || [];
      let validItems = items.filter((it: any) => it.itemName && it.itemCode);

      if (validItems.length > 0) {
        let result = validItems.map((it: any) => ({
          ...it,
          dealer: data?._id,
          brandName: it.brandName,
          createdBy: req.userId,
          createdAt: new Date(),
          company: req.body.company,
        }));

        await DealerItemModal.insertMany(result);
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

export const updateDealerService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await updateDealer({
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

export const deleteDealerService = async (req: any, res: Response, next: any) => {
  try {
    const { status, statusCode, data, message } = await deleteDealer({
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

export const createDealerItemservice = async (
  req: any,
  res: Response,
  next: any
) => {
  try {
    const lineItem = await new DealerItemModal({
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

export const deleteDealerItem = async (req: any, res: Response, next: any) => {
  try {
    const lineItem = await DealerItemModal.findByIdAndUpdate(
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
      message: "Dealer Item is deleted Successful",
    });
  } catch (err: any) {
    next(err);
  }
};

export const getDealerServices = async (req: any, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req?.query?.search ? req?.query?.search?.trim() : undefined;

    const { status, statusCode, data, totalPages, message } = await getDealers(
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

export const getDealerItems = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const dealer = req.query.dealer ? new mongoose.Types.ObjectId(req.query.dealer) : null

    const search = req?.query?.search
      ? (req.query.search as string).trim()
      : undefined;

    let match: any = {
      isActive: true,
      deletedAt: { $exists: false },
    };

    if(dealer){
      match = {...match, dealer : dealer}
    }

    if (search) {
      match.$or = [
        { itemName: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $project: {
          itemName: 1,
          itemCode: 1,
          quantity: 1,
          price: 1,
          total: 1,
          createdAt: 1,
          isActive: 1,
          brandName: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const data = await DealerItemModal.aggregate(pipeline);
    const totalDocs = await DealerItemModal.countDocuments(match);
    const totalPages = Math.ceil(totalDocs / limit);

    return res.status(200).send({
      message: "Dealer items fetched successfully",
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

export const updateDealerLineItems = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const updatedLineItems = await DealerItemModal.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body } }
    );
    return res.status(200).send({
      message: "Line Items has been updated",
      status: "success",
      data: updatedLineItems,
    });
  } catch (err: any) {
    next(err);
  }
};
