import { statusCode } from "../config/statusCode";
import { createCatchError, generateFileName } from "../config/constant";
import Company from "../schemas/Company";
import { deleteFile, uploadFile } from "./uploadDoc.repository";

export const updateCompany = async (data: any) => {
try {
    const { company, logo, coverImage, ...updateFields } = data;

    let shop = await Company.findById(company);
    if (!shop) {
    return {
        status: "error",
        statusCode: statusCode.info,
        message: "Shop does not exists",
        data: "Shop does not exists"
    };
    }

    // Prepare updates object
    const updates: any = { ...updateFields };

    // Handle Logo Deletion
    if (logo?.isFileDeleted && shop.logo?.name) {
    await deleteFile(shop.logo.name);
    updates.logo = { name: "", url: "", type: "" };
    }

    // Handle Logo Upload
    if (logo?.isAdd && logo.filename && logo.buffer) {
    logo.filename = generateFileName(logo.filename);
    const url = await uploadFile(logo);
    updates.logo = { name: logo.filename, url, type: logo.type };
    }

    if (coverImage?.isFileDeleted && shop.coverImage?.name) {
    await deleteFile(shop.coverImage.name);
    updates.coverImage = { name: "", url: "", type: "" };
    }

    if (coverImage?.isAdd && coverImage.filename && coverImage.buffer) {
    coverImage.filename = generateFileName(coverImage.filename);
    const url = await uploadFile(coverImage);
    updates.coverImage = {
        name: coverImage.filename,
        url,
        type: coverImage.type,
    };
    }

    shop = await Company.findByIdAndUpdate(company, updates, { new: true });

    return {
    statusCode: statusCode.success,
    status: "success",
    data: shop,
    message: "Shop details have been updated successfully",
    };
} catch (err) {
    return createCatchError(err);
}
};
