import {
  createWorkDone,
  getWorkDone,
  deleteWorkDone,
  updateWorkDone,
  getPatientFinancialStats,
} from "../../repository/workDone/workDone";

export const getPatientFinancialStatsService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data }: any = await getPatientFinancialStats({
      ...req.query,
      doctorId: req.query.doctorId,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const createWorkDoneService = async (req: any, res: any) => {
  try {
    const { status, statusCode, data, message }: any = await createWorkDone({
      ...req.body,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const getWorkDoneService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data, totalItems }: any = await getWorkDone({
      ...req.query,
    });

    return res.status(statusCode).send({
      status: success,
      message,
      data: {
        data,
        totalItems,
      },
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const deleteWorkDoneService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message }: any = await deleteWorkDone({
      workDoneId: req.params.id,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};

export const updateWorkDoneService = async (req: any, res: any) => {
  try {
    const { status, statusCode, message, data }: any = await updateWorkDone({
      ...req.body,
      id: req.params.id,
      user: req.userId,
    });

    return res.status(statusCode).send({
      status,
      message,
      data,
    });
  } catch (err: any) {
    return res.status(500).send({
      status: "error",
      message: err?.message || "Internal Server Error",
    });
  }
};
