import { statusCode } from "../../config/helper/statusCode";
import { generateFileName } from "../../config/helper/function";
import { uploadFile } from "../uploadDoc.repository";

export const uploadFileDocument = async (data: any) => {
  try {
    if (data.file?.filename && data.file?.buffer && data.file) {
      data.file.filename = generateFileName(data.file.filename);
      const url = await uploadFile(data.file);
      return {
        status: "success",
        data: url,
        statusCode: statusCode.success,
        message: "Document has been uploaded",
      };
    }
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      statusCode: statusCode.serverError,
      message: err?.message,
    };
  }
};
