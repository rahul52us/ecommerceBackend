import { getShopByTitle, getShops, updateCompany } from "../../repository/company.repository";
import { NextFunction } from "express";

export const updateCompanyService = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const { statusCode, status, message, data } = await updateCompany(req.body);
    res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    next(err);
  }
};

export const getCompanyService = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const { statusCode, status, message, data } = await getShops(req.body);
    res.status(statusCode).send({
      message,
      data,
      status,
    });
  } catch (err: any) {
    next(err);
  }
};

export const getShopByTitleService = async (
    req: any,
    res: any,
    next: NextFunction
  ) => {
    try {
      const { statusCode, status, message, data } = await getShopByTitle(req.params.title);
      res.status(statusCode).send({
        message,
        data,
        status,
      });
    } catch (err: any) {
      next(err);
    }
  };

