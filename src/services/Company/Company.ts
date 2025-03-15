import { updateCompany } from "../../repository/company.repository";
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
    status
    });
} catch (err: any) {
    next(err);
}
};