import mongoose from "mongoose";
import PatientDocumentModel from "../../schemas/patientDocument/patientDocument.schema";
import { deleteFile } from "../uploadDoc.repository";

const toObjectId = (id: any) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id))
    return new mongoose.Types.ObjectId(String(id));
  return null;
};

export const createPatientDocument = async (data: any) => {
  try {
    const { patient, company, title, type, url, user } = data;

    if (!patient || !company || !url || !title) {
      return {
        success: "error",
        message: "patient, company, title and url are required",
        statusCode: 400,
      };
    }

    const doc = new PatientDocumentModel({
      patient: toObjectId(patient),
      company: toObjectId(company),
      title,
      type: type || "other",
      url,
      createdBy: toObjectId(user),
    });

    const saved = await doc.save();
    return {
      success: "success",
      message: "Document added successfully.",
      data: saved,
      statusCode: 201,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const getPatientDocuments = async (query: any) => {
  try {
    const { patientId, company } = query;

    const patId = toObjectId(patientId);
    const compId = toObjectId(company);

    if (!patId || !compId) {
      return {
        success: "error",
        message: "patientId and company are required",
        statusCode: 400,
      };
    }

    const docs = await PatientDocumentModel.find({
      patient: patId,
      company: compId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    return {
      success: "success",
      message: `Found ${docs.length} documents`,
      data: docs,
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};

export const deletePatientDocument = async (data: any) => {
  try {
    const { id } = data;

    if (!id) {
      return {
        success: "error",
        message: "Document id is required",
        statusCode: 400,
      };
    }

    const doc = await PatientDocumentModel.findById(id);
    if (doc && doc.url) {
      await deleteFile(doc.url);
    }
    await PatientDocumentModel.findByIdAndDelete(id);

    return {
      success: "success",
      message: "Document deleted successfully.",
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: "error", message: error.message, statusCode: 500 };
  }
};
