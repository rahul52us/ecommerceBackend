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
        data: "Shop does not exists",
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

// get all shops

export const getShops = async (body: any) => {
  try {
    const conditions: any = {};

    // Set default values for isActive and shopStatus if not provided
    if (!body.isActive) {
      body.isActive = true; // Default to true if isActive is not provided
    }
    if (!body.shopStatus) {
      body.shopStatus = "active"; // Default to 'active' if shopStatus is not provided
    }

    // Handle name filter
    if (body.name) {
      conditions.name = { $regex: body.name, $options: "i" };
    }

    // Handle categories filter
    if (body.categories) {
      const categories = body.categories
        .split(",")
        .map((cat: string) => cat.trim());
      conditions.categories = { $in: categories };
    }

    // Handle tags filter
    if (body.tags) {
      const tags = body.tags.split(",").map((tag: string) => tag.trim());
      conditions.tags = { $in: tags };
    }

    // Handle shopStatus filter (already set in default above)
    conditions.shopStatus = body.shopStatus;

    // Handle isActive filter (already set in default above)
    conditions.isActive = body.isActive;

    // Handle location filter
    if (body.location) {
      const [lat, lng] = body.location
        .split(",")
        .map((coord: string) => parseFloat(coord));
      conditions.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 2000, // You can adjust this distance as needed
        },
      };
    }

    const pipeline: any = [
      {
        $match: conditions, // Apply the conditions for filtering
      },
      {
        $project: {
          name: 1,
          description: 1,
          logo: 1,
          coverImage: 1,
          categories: 1,
          tags: 1,
          ratings: 1,
          location: 1,
          contactInfo: 1,
          operatingHours: 1,
          shopStatus: 1,
          isActive: 1,
          createdAt: 1,
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort by createdAt in descending order
        },
      },
      {
        $skip: parseInt(body.skip) || 0, // Pagination: Skip number of documents
      },
      {
        $limit: parseInt(body.limit) || 10, // Pagination: Limit number of documents
      },
    ];

    // Execute aggregation pipeline
    const shops = await Company.aggregate(pipeline);

    return {
      status: "success",
      statusCode: statusCode.success,
      message: "Retrieve Shops Details",
      data: shops,
    };
  } catch (error: any) {
    return {
      status: "error",
      statusCode: statusCode.serverError,
      message: error?.message,
      data: error?.message,
    };
  }
};

export const getShopByTitle = async (title: string) : Promise<any> => {
    try {

      const shop = await Company.findOne({
        name: { $regex: new RegExp(title, "i") },
        shopStatus : 'active'
      });

      if (!shop) {
        return {
          status: "error",
          statusCode: statusCode.info,
          message: "Shop not found",
          data: null,
        };
      }

      return {
        status: "success",
        statusCode: statusCode.success,
        message: "Shop retrieved successfully",
        data: shop,
      };
    } catch (error: any) {
      return {
        status: "error",
        statusCode: statusCode.serverError,
        message: error.message,
        data: null,
      };
    }
  };
