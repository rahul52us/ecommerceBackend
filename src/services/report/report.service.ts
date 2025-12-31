import { downloadReport } from "../../repository/reports/reports.repository";

export const downloadReportService = async (req: any, res: any) => {
  try {
    const { status, message, data, statusCode }: any =
      await downloadReport({
        ...req.body,
        user: req.userId,
        company: req.body.company,
      });

    return res.status(statusCode).send({
      status: status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message,
    });
  }
};