import {
  createPatientDocument,
  getPatientDocuments,
  deletePatientDocument,
} from "../../repository/patientDocument/patientDocument.repository";

export const createPatientDocumentService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data } = await createPatientDocument({
      ...req.body,
      user: req.user?._id,
    });
    return res.status(statusCode).send({ status: success, message, data });
  } catch (err: any) {
    return res.status(500).send({ status: "error", message: err.message });
  }
};

export const getPatientDocumentsService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message, data } = await getPatientDocuments(
      req.query
    );
    return res.status(statusCode).send({ status: success, message, data });
  } catch (err: any) {
    return res.status(500).send({ status: "error", message: err.message });
  }
};

export const deletePatientDocumentService = async (req: any, res: any) => {
  try {
    const { statusCode, success, message } = await deletePatientDocument({
      id: req.params.id,
    });
    return res.status(statusCode).send({ status: success, message });
  } catch (err: any) {
    return res.status(500).send({ status: "error", message: err.message });
  }
};
