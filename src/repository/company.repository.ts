import { statusCode } from "../config/statusCode";
import { createCatchError, generateFileName } from "../config/constant";
import Company from "../schemas/Company";
import { deleteFile, uploadFile } from "./uploadDoc.repository";
import axios from "axios";

export const updateCompany = async (data: any) => {
  try {
    const { company, logo, coverImage, deletedFiles, ...updateFields } = data;

    let shop: any = await Company.findById(data._id);
    if (!shop) {
      return {
        status: "error",
        statusCode: statusCode.info,
        message: "Shop does not exist",
        data: "Shop does not exist",
      };
    }

    // Prepare updates object
    const updates: any = { ...updateFields };

    // Handle Logo Deletion
    if (logo?.isDeleted && shop.logo?.name) {
      await deleteFile(shop.logo.name);
      updates.logo = { name: undefined, url: undefined, type: undefined };
    }

    // Handle Logo Upload
    if (logo?.isAdd && logo.filename && logo.buffer) {
      logo.filename = generateFileName(logo.filename);
      const url = await uploadFile(logo);
      updates.logo = { name: logo.filename, url, type: logo.type };
    }

    // Handle Cover Image Deletion
    if (coverImage?.isDeleted && shop.coverImage?.name) {
      await deleteFile(shop.coverImage.name);
      updates.coverImage = { name: undefined, url: undefined, type: undefined };
    }

    // Handle Cover Image Upload
    if (coverImage?.isAdd && coverImage.filename && coverImage.buffer) {
      coverImage.filename = generateFileName(coverImage.filename);
      const url = await uploadFile(coverImage);
      updates.coverImage = {
        name: coverImage.filename,
        url,
        type: coverImage.type,
      };
    }

    // Handle Gallery Deletion (from deletedFiles)
    if (deletedFiles) {
      for (const filename of deletedFiles) {
        const galleryIndex = shop.gallery?.findIndex((item : any) => item.file.name === filename);

        // If the gallery image exists, delete it and remove from the gallery
        if (galleryIndex !== -1) {
          const item = shop.gallery[galleryIndex];
          await deleteFile(item.file.name); // Delete the file from storage

          // Remove the gallery image from the updates
          updates.gallery = updates.gallery || [];
          updates.gallery.splice(galleryIndex, 1); // Remove the item from the gallery array
        }
      }
    }


    // Handle Gallery Deletion and Upload (from the gallery array)
    if (updates.gallery) {
      for (let i = 0; i < updates.gallery.length; i++) {
        const item = updates.gallery[i];
        // Handle gallery item upload (if isAdd flag is set)
        if (item?.file?.isAdd && item?.file?.filename && item?.file?.buffer) {
          item.file.filename = generateFileName(item?.file?.filename);
          const url = await uploadFile(item.file);

          // Ensure gallery is initialized in updates if not already
          updates.gallery = updates.gallery || [];
          // Add the new gallery image to the updates object
          updates.gallery.push({ file: { name: item?.file?.filename, url, type : item?.file?.type }, title: item.title || "" });
        }
      }
    }

    // Update the company (shop) details in the database
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

    // let LOCATIONIQ_API_KEY = "pk.a3a7065c1f20ee235141b9c0b812eca7"
    //   // Static coordinates (Indore, MP)
    //   const latitude = 26.185691401326544;
    //   const longitude = 78.1343454815237;
    //   const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json`;

    //   const response = await axios.get(url);
    //   console.log(response.data)

    //   const token = "a6152aecd95ca2"; // Your IPInfo token
    //   const responses = await fetch(`https://ipinfo.io/json?token=${token}`);
    //   const datas = await responses.json();

    //   console.log(datas)

    const conditions: any = {};

    // Set default values for isActive and shopStatus if not provided
    if (!body.isActive) {
      body.isActive = true; // Default to true if isActive is not provided
    }
    // if (!body.shopStatus) {
    //   body.shopStatus = "active"; // Default to 'active' if shopStatus is not provided
    // }

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
    // conditions.shopStatus = body.shopStatus;

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
        name: { $regex: new RegExp(title, "i") }
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
