import ProfileDetails from "../../schemas/User/ProfileDetails";
import BankDetails from "../../schemas/User/BankDetails";
import bcrypt from "bcrypt";
import WorkExperience from "../../schemas/User/WorkExperience";
import { generateError } from "../../config/Error/functions";
import { deleteFile, uploadFile } from "../uploadDoc.repository";
import FamilyDetails from "../../schemas/User/FamilyDetails";
import Documents from "../../schemas/User/Document";
import { updateUserRoleService } from "../../services/auth/auth.service";
import mongoose from "mongoose";
import User from "../../schemas/User/User";
import {
  createCatchError,
  generateFileName,
  hashBcrypt,
} from "../../config/helper/function";
import { statusCode } from "../../config/helper/statusCode";
import Qualification from "../../schemas/User/Qualifications";
import { seedDefaultCompanyData } from "../../services/company/seedDefaultData";
import SalaryStructure from "../../schemas/salaryStructure/SalaryStructure.schema";
import companyDetails from "../../schemas/company/companyDetails";
import Company from "../../schemas/company/Company";

async function generateUniqueCode(prefix: string = ""): Promise<string> {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code: string;
  let exists = true;

  while (exists) {
    const randomPart = Array.from({ length: 5}, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");

    code = `${prefix}${randomPart}`;

    const user = await mongoose.models.User.findOne({
      code: { $regex: new RegExp(`^${code}$`, 'i') },
    });
    if (!user) {
      exists = false;
    }
  }
  return code!;
}

const createAdminUser = async (data: any) => {
  try {
    // -------------------------------
    // 1️⃣ Generate unique user code
    // -------------------------------
    let finalCode = data.code;
    if (!finalCode) {
      finalCode = await generateUniqueCode("ad-");
    } else {
      const userCode = await User.findOne({ code: finalCode });
      if (userCode) {
        throw generateError(
          `${userCode.username} already exists with ${finalCode}`,
          300
        );
      }
    }

    let savedCompany: any = null
    // -------------------------------
    // 2️⃣ Check Username and Phone Number Uniqueness
    // -------------------------------
    if (data.username) {
      const existUsername = await User.findOne({ username: { $regex: new RegExp(`^${data.username}$`, 'i') } });
      if (existUsername) {
        throw generateError("Username is already registered", 400);
      }
    }

    const phone = data.phoneNumber || data.mobileNumber;
    if (phone) {
      const existPhone = await User.findOne({ mobileNumber: phone });
      if (existPhone) {
        throw generateError("Phone number is already registered", 400);
      }
    }

    // -------------------------------
    // 3️⃣ COMPANY CHECK / CREATE
    // -------------------------------
    let companyId;

    // 💥 Company name is mandatory if user is admin/superAdmin
    if (!data.companyName) {
      throw generateError("Company name is required", 400);
    }

    // Check if company already exists
    let existingCompany = await Company.findOne({
      company_name: data.companyName.trim(),
    });

    if (existingCompany) {
      throw generateError(`Company Already Registered With this Name`, 400);
    } else {
      // Create new company
      const newCompany = new Company({
        company_name: data.companyName.trim(),
        companyCode: data.companyCode || `COMP-${Date.now()}`,
        companyType: data.companyType || "company",
        verified_email_allowed: false,
        createdBy: null,
        activeUser: null,
        is_active: true,
        addressInfo: data.addressInfo || [],
        subscriptionStartDate: data.subscriptionStartDate || undefined,
        subscriptionEndDate: data.subscriptionEndDate || undefined,
        subscriptionHistory: (data.subscriptionStartDate && data.subscriptionEndDate) ? [{
          startDate: new Date(data.subscriptionStartDate),
          endDate: new Date(data.subscriptionEndDate),
          amount: data.amount,
          description: data.description,
          updatedBy: data.createdBy || null,
          updatedAt: new Date(),
        }] : []
      });

      savedCompany = await newCompany.save();
      companyId = savedCompany._id;
    }

    // -------------------------------
    // 3️⃣ Create User
    // -------------------------------
    const { pic, ...rest } = data;
    const hashedPassword = await hashBcrypt(data.password || "Admin@123");

    const createdUser = new User({
      username: data.username,
      company: companyId, // <-- COMPANY LINKED HERE
      name: data.name,
      code: finalCode,
      mobileNumber: data.phoneNumber || data.mobileNumber,
      userType: data.userType,
      password: hashedPassword,
      bio: data.bio,
      is_active: true,
      title: data.title,
      role:data?.role || "admin",
      permissions: data.permissions || {},
      references: (data.references || []).map((ref: any) => ({
        ...ref,
        refrenceBy: ref.refrenceBy?._id || ref.refrenceBy?.value || ref.refrenceBy || undefined
      })),
    });

    const savedUser = await createdUser.save();
    if (!savedUser) throw generateError(`Cannot create the user`, 400);
    // -------------------------------
    // 4️⃣ Create Profile
    // -------------------------------
    const profile = new ProfileDetails({
      user: savedUser._id,
      personalInfo: { ...rest },
    });

    const savedProfile = await profile.save();
    savedUser.profile_details = savedProfile._id;
    await savedUser.save();

    // -------------------------------
    // 4.5️⃣ Seed Default Template Data
    // -------------------------------
    if (savedCompany && savedCompany._id) {
       await seedDefaultCompanyData(savedCompany._id, savedUser._id);
    }

    // -------------------------------
    // 5️⃣ Upload Picture (optional)
    // -------------------------------
    if (pic && pic.filename && pic?.buffer !== "" && Object.entries(pic || {}).length) {
      pic.filename = generateFileName(pic.filename);
      const url = await uploadFile(pic);

      savedUser.pic = {
        name: pic?.filename,
        url,
        type: pic?.type,
      };

      savedCompany.logo = {
        name: pic?.filename,
        url,
        type: pic?.type,
      };

      await savedCompany.save()

      await savedUser.save();
    }

    // -------------------------------
    // 6️⃣ Final Response
    // -------------------------------
    const userObj: any = savedUser.toObject();
    delete userObj.password;

    return {
      status: "success",
      data: {
        ...userObj,
        profile_details: savedProfile.toObject(),
      },
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err,
    };
  }
};


const createUser = async (data: any) => {
  try {
    let finalCode = data.code;
    if (!finalCode) {
      const typeStr = (data.type || data.userType || "").toLowerCase();
      let prefix = "";
      if (typeStr === 'patient') prefix = 'pt-';
      else if (typeStr === 'doctor') prefix = 'dt-';
      else if (typeStr === 'staff') prefix = 'st-';
      else if (typeStr === 'admin' || typeStr === 'superadmin') prefix = 'ad-';

      finalCode = await generateUniqueCode(prefix);
    } else {
      const userCode = await User.findOne({ code: finalCode });
      if (userCode) {
        throw generateError(
          `${userCode.username} already exists with ${finalCode}`,
          300
        );
      }
    }

    const isNewUserPatient = (data.type || data.userType || "").toLowerCase() === 'patient';

    if (data.username) {
      const existingUsernames = await User.find({ username: { $regex: new RegExp(`^${data.username}$`, 'i') } });
      if (existingUsernames.length > 0) {
        if (!isNewUserPatient) {
          throw generateError("Username is already registered", 400);
        }
        const hasNonPatient = existingUsernames.some(u => (u.userType || "").toLowerCase() !== 'patient');
        if (hasNonPatient) {
          throw generateError("Username is already registered by a staff or doctor", 400);
        }
      }
    }

    const phone = data.phoneNumber || data.mobileNumber;
    if (phone) {
      const existingPhones = await User.find({ mobileNumber: phone });
      if (existingPhones.length > 0) {
        if (!isNewUserPatient) {
          throw generateError("Phone number is already registered", 400);
        }
        const hasNonPatient = existingPhones.some(u => (u.userType || "").toLowerCase() !== 'patient');
        if (hasNonPatient) {
          throw generateError("Phone number is already registered by a staff or doctor", 400);
        }
      }
    }

    const { pic, ...rest } = data;

    const hashedPassword = await hashBcrypt("Admin@123");
    const createdUser = new User({
      username: data.username,
      company: data.company,
      name: data.name,
      code: finalCode,
      mobileNumber: data.mobileNumber,
      userType: data.type,
      password: hashedPassword,
      bio: data.bio,
      is_active: true,
      title: data.title,
      permissions: data.permissions || {},
      createdBy: data.createdBy,
      references: (data.references || []).map((ref: any) => ({
        ...ref,
        refrenceBy: ref.refrenceBy?._id || ref.refrenceBy?.value || ref.refrenceBy || undefined
      })),
    });

    const savedUser = await createdUser.save();
    if (!savedUser) {
      throw generateError(`Cannot create the user`, 400);
    }

    const profile = new ProfileDetails({
      user: savedUser._id,
      personalInfo: { ...rest },
    });

    const savedProfile = await profile.save();
    savedUser.profile_details = savedProfile._id;
    await savedUser.save();

    if (
      pic &&
      pic.filename &&
      pic?.buffer !== "" &&
      Object.entries(pic || {}).length
    ) {
      pic.filename = generateFileName(pic.filename);
      const url = await uploadFile(pic);
      savedUser.pic = {
        name: pic?.filename,
        url,
        type: pic?.type,
      };
      await savedUser.save();
    }

    // Remove password from the response
    const userObj: any = savedUser.toObject();
    delete userObj.password;

    return {
      status: "success",
      data: {
        ...userObj,
        profile_details: savedProfile.toObject(),
      },
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err,
    };
  }
};

const deleteUser = async (userId: any) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw generateError("User not found", 404);
    }

    if (user.profile_details) {
      await ProfileDetails.findByIdAndDelete(user.profile_details);
    }

    if (user.pic?.name) {
      await deleteFile(user.pic.name);
    }

    await User.findByIdAndDelete(userId);

    return {
      status: "success",
      message: "User deleted successfully",
      statusCode: 200,
      data: "USer deleted Successfully",
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err,
      statusCode: 500,
      message: err?.message,
    };
  }
};

export const getSalaryStructure = async (data: any) => {
  try {
    const salaryStructures = await SalaryStructure.aggregate([
      { $match: { user: data.user } },

      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: "$user",
          currentSalaryStructure: { $first: "$$ROOT" },
          historicalSalaryStructures: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          currentSalaryStructure: 1,
          historicalSalaryStructures: 1,
        },
      },
    ]);

    if (salaryStructures.length === 0) {
      return {
        status: "success",
        data: null,
        message: "no such salary details exists",
        statusCode: 200,
      };
    }

    return {
      status: "success",
      data: salaryStructures[0],
      message: "no such salary details exists",
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500,
    };
  }
};

export const updateSalaryStructure = async (data: any) => {
  try {
    const id = data.id;

    let updatedSalaryStructure;

    const existingSalaryStructure = await SalaryStructure.findOne({
      user: data.user,
      _id: id,
    });

    if (existingSalaryStructure) {
      updatedSalaryStructure = await SalaryStructure.findOneAndUpdate(
        { user: data.user, _id: id },
        { $set: { ...data, updatedAt: new Date() } },
        { new: true }
      );

      return {
        data: updatedSalaryStructure,
        message: "Salary Structure has been successfully updated",
        statusCode: 200,
        status: "success",
      };
    } else {
      updatedSalaryStructure = await SalaryStructure.create({
        user: data.user,
        ...data,
        createdAt: new Date(),
      });

      return {
        data: updatedSalaryStructure,
        message: "Salary Structure has been successfully created",
        statusCode: 201,
        status: "success",
      };
    }
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500,
    };
  }
};

const updatePersonalDetails = async (data: any) => {
  try {
    const { userId, name, username, mobileNumber, title, dob, gender, bio, addresses, languages } = data;

    if (!userId) {
      return { status: "error", data: "User ID is required" };
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return { status: "error", data: "User not found" };
    }
    const isEditingPatient = (currentUser.userType || "").toLowerCase() === 'patient';

    if (username) {
      const existingUsernames = await User.find({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        _id: { $ne: userId },
      });
      if (existingUsernames.length > 0) {
        if (!isEditingPatient) {
          return {
            status: "error",
            data: `${username} email is already registered`,
          };
        }
        const hasNonPatient = existingUsernames.some(u => (u.userType || "").toLowerCase() !== 'patient');
        if (hasNonPatient) {
          return {
            status: "error",
            data: `${username} email is already registered by a staff or doctor`,
          };
        }
      }
    }

    if (mobileNumber) {
      const existingPhones = await User.find({
        mobileNumber: mobileNumber,
        _id: { $ne: userId },
      });
      if (existingPhones.length > 0) {
        if (!isEditingPatient) {
          return {
            status: "error",
            data: `Mobile number ${mobileNumber} is already registered`,
          };
        }
        const hasNonPatient = existingPhones.some(u => (u.userType || "").toLowerCase() !== 'patient');
        if (hasNonPatient) {
          return {
            status: "error",
            data: `Mobile number ${mobileNumber} is already registered by a staff or doctor`,
          };
        }
      }
    }

    const updatedUser: any = await User.findByIdAndUpdate(userId, {
      $set: { 
        ...(name !== undefined && { name }), 
        ...(username !== undefined && { username }), 
        ...(mobileNumber !== undefined && { mobileNumber }), 
        ...(title !== undefined && { title }), 
        ...(bio !== undefined && { bio }), 
        updatedAt: new Date() 
      },
    }, { new: true });

    if (!updatedUser) {
      return {
        status: "error",
        data: "User does not exist",
      };
    }

    // Also update ProfileDetails if needed
    const profile = await ProfileDetails.findOne({ user: userId });
    if (profile) {
      const existingPersonalInfo: any = profile.personalInfo || {};
      
      profile.personalInfo = {
        ...existingPersonalInfo,
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(title !== undefined && { title }),
        ...(dob !== undefined && { dob }),
        ...(gender !== undefined && { gender }),
        ...(bio !== undefined && { bio }),
        ...(addresses !== undefined && { 
          addresses: { 
            ...(existingPersonalInfo.addresses || {}), 
            ...addresses 
          } 
        }),
        ...(languages !== undefined && { languages }),
      } as any;
      
      // Since personalInfo is a Mixed type, we need to mark it as modified
      profile.markModified("personalInfo");
      await profile.save();
    }

    return {
      status: "success",
      data: "Personal details updated successfully",
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message || err,
    };
  }
};

const updateUserProfileDetails = async (data: any) => {
  try {
    const { pic, _id, ...rest } = data;

    const currentUser = await User.findById(data.userId);
    if (!currentUser) {
      return { status: "error", data: "User not found" };
    }
    const isEditingPatient = (currentUser.userType || "").toLowerCase() === 'patient';

    if (data.username) {
      const existingUsernames = await User.find({
        username: { $regex: new RegExp(`^${data.username}$`, 'i') },
        _id: { $ne: data.userId },
      });
      if (existingUsernames.length > 0) {
        if (!isEditingPatient) {
          return {
            status: "error",
            data: `${data.username} username is already registered`,
          };
        }
        const hasNonPatient = existingUsernames.some(u => (u.userType || "").toLowerCase() !== 'patient');
        if (hasNonPatient) {
          return {
            status: "error",
            data: `${data.username} username is already registered by a staff or doctor`,
          };
        }
      }
    }

    const phone = data.phoneNumber || data.mobileNumber || data.mobileNo;
    if (phone) {
      const existingPhones = await User.find({
        mobileNumber: phone,
        _id: { $ne: data.userId },
      });
      if (existingPhones.length > 0) {
        if (!isEditingPatient) {
          return {
            status: "error",
            data: `Mobile number ${phone} is already registered`,
          };
        }
        const hasNonPatient = existingPhones.some(u => (u.userType || "").toLowerCase() !== 'patient');
        if (hasNonPatient) {
          return {
            status: "error",
            data: `Mobile number ${phone} is already registered by a staff or doctor`,
          };
        }
      }
    }

    const existCode = await User.exists({
      code: data.code,
      _id: { $ne: data.userId },
    });

    if (existCode) {
      return {
        status: "error",
        data: `${data.code} code is already registered`,
      };
    }

    if (rest.references) {
      rest.references = rest.references.map((ref: any) => ({
        ...ref,
        refrenceBy: ref.refrenceBy?._id || ref.refrenceBy?.value || ref.refrenceBy || undefined
      }));
    }

    const users: any = await User.findByIdAndUpdate(data.userId, {
      $set: { ...rest, updatedAt: new Date() },
    });

    delete rest.pic;
    delete rest?.profileDetails;
    const pUsers = await ProfileDetails.findOneAndUpdate(
      { user: data.userId },
      { $set: { personalInfo: { ...rest } } }
    );
    if (!pUsers && !users) {
      return {
        status: "error",
        data: "User does not exists",
      };
    }



    if (pic.isDeleted && users.pic?.url && users.pic?.name) {
      await deleteFile(users.pic.name);
      users.pic = {
        name: undefined,
        url: undefined,
        type: undefined,
      };
      await users.save();
    }

    if (pic?.filename && pic?.buffer && pic && pic?.isAdd) {
      pic.filename = generateFileName(pic.filename);
      const url = await uploadFile(pic);
      users.pic = {
        name: data.pic.filename,
        url,
        type: data.pic.type,
      };
      await users.save();
    } else if (pic && pic.url && !pic.buffer) {
      users.pic = {
        name: pic.name || "profile_pic",
        url: pic.url,
        type: pic.type || "image/png"
      };
      await users.save();
    }

    return {
      status: "success",
      data: "User has been updated successfully",
    };
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
};

const getUsers = async (data: {
  id: any;
  userType: string;
  role: string;
  page: number;
  limit: number;
  search?: string;
  company?: string[];
  isActive?: any;
}) => {
  try {

    // Validate and set default values for pagination parameters
    const page = Math.max(1, Number(data.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(data.limit) || 10));
    const skip = (page - 1) * limit;

    // Base match conditioon view ns
    let matchConditions: any = {
      is_active: data.isActive !== undefined ? (data.isActive === "all" ? { $in: [true, false] } : data.isActive) : true,
      deletedAt: { $exists: false },
      role: { $ne: "admin" },
    };

    if (data.userType === "superAdmin") {
      matchConditions = {
        ...matchConditions,
        userType: "admin",
        role: "admin"
      };
    } else {
      matchConditions = {
        ...matchConditions,
        userType: data.userType,
        role: { $ne: "admin" }
      };
    }


    // Company filter
    if (data.userType !== "superAdmin") {
      if (data.company?.length) {
        matchConditions.company = { $in: data.company };
      }
    }

    // Search filter
    if (data.search?.trim()) {
      const searchRegex = new RegExp(data.search.trim(), "i");
      matchConditions.$or = [
        { name: { $regex: searchRegex } },
        { mobileNumber: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
        { code: { $regex: searchRegex } },
      ];
    }

    // Aggregation pipeline
    const pipeline: any = [
      { $match: matchConditions },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "references.refrenceBy",
          foreignField: "_id",
          as: "referenceByDetails"
        }
      },
      {
        $addFields: {
          references: {
            $map: {
              input: "$references",
              as: "ref",
              in: {
                refrenceNote: "$$ref.refrenceNote",
                refrenceBy: {
                  $let: {
                    vars: {
                      detail: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$referenceByDetails",
                              as: "detail",
                              cond: { $eq: [{ $toString: "$$detail._id" }, { $toString: "$$ref.refrenceBy" }] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $cond: {
                        if: "$$detail",
                        then: {
                          _id: "$$detail._id",
                          name: "$$detail.name",
                          username: "$$detail.username",
                          code: "$$detail.code",
                          label: { $ifNull: ["$$detail.name", { $ifNull: ["$$detail.username", "Unknown"] }] },
                          value: "$$detail._id"
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["$$ref.refrenceBy", null] },
                            then: null,
                            else: { label: { $toString: "$$ref.refrenceBy" }, value: "$$ref.refrenceBy" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      // Keep old lookup for backward compatibility if needed, or remove if not
      {
        $lookup: {
          from: "users",
          let: { refId: "$refrenceBy" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$refId"] } } },
            { $project: { _id: 1, name: 1, username: 1, code: 1 } },
          ],
          as: "refrenceBy",
        },
      },
      { $unwind: { path: "$refrenceBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "profiledetails",
          localField: "profile_details",
          foreignField: "_id",
          as: "profileDetails",
        },
      },
      {
        $unwind: { path: "$profileDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          password: 0, // exclude sensitive field
        },
      }
    ];

    // Execute parallel queries
    const [usersResult, totalResult]: any = await Promise.all([
      User.aggregate([...pipeline]),
      User.aggregate([{ $match: matchConditions }, { $count: "count" }]),
    ]);

    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      status: "success",
      data: usersResult,
      totalPages,
      totalCount,
      page,
      limit,
    };
  } catch (err: any) {
    console.error("Error in getUsers:", err);
    return {
      status: "error",
      message: err.message,
      data: null,
    };
  }
};

const getCompanyDetailsByUserId = async (data: any) => {
  try {
    const result = await companyDetails.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(data.userId),
        },
      },
      {
        $unwind: "$details",
      },
      {
        $lookup: {
          from: "users",
          localField: "details.managers",
          foreignField: "_id",
          as: "details.managersDetails",
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "details.designation",
          foreignField: "_id",
          as: "details.designationDetails",
        },
      },
      {
        $lookup: {
          from: "departmentcategories",
          localField: "details.department",
          foreignField: "_id",
          as: "details.departmentDetails",
        },
      },
      {
        $project: {
          _id: 0,
          user: 1,
          company: 1,
          companyOrg: 1,
          "details.doj": 1,
          "details.confirmationDate": 1,
          "details.noticePeriod": 1,
          "details.eCode": 1,
          "details.eType": 1,
          "details.eCategory": 1,
          "details.description": 1,
          "details.createdAt": 1,
          // Only include specific fields from managersDetails
          "details.managersDetails": {
            name: 1,
            title: 1,
            role: 1,
            username: 1,
            code: 1,
          },
          "details.departmentDetails": 1,
          "details.designationDetails": 1,
        },
      },
    ]);

    return {
      status: "success",
      data: result,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      status: "error",
      data: error?.message,
      statusCode: 500,
    };
  }
};

const getUserByName = async (data: any) => {
  try {
    const st = await User.findOne({
      name: data.name?.split("-")?.join(" "),
    }).populate("profile_details");
    if (st) {
      return {
        status: "success",
        data: st,
      };
    } else {
      return {
        status: "error",
        data: "User does not exists",
      };
    }
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
};

export const linkMissingProfileDetails = async () => {
  try {

    console.log('called')
    const allProfiles = await ProfileDetails.find({});
    let linkedCount = 0;
    let alreadyLinkedCount = 0;
    let userNotFoundCount = 0;

    for (const profile of allProfiles) {

      if (!profile.user) {
        continue;
      }

      console.log(profile?.user)

      const user = await User.findById(profile.user);
      if (!user) {
        userNotFoundCount++;
        continue;
      }

      if (user.profile_details && user.profile_details.toString() === profile._id.toString()) {
        alreadyLinkedCount++;
        continue;
      }

      console.log(linkedCount)
      user.profile_details = profile._id as any;
      await user.save();
      linkedCount++;
    }

    return {
      status: "success",
      data: {
        profilesProcessed: allProfiles.length,
        alreadyLinked: alreadyLinkedCount,
        newlyLinked: linkedCount,
        userNotFound: userNotFoundCount
      },
      message: `Successfully linked ${linkedCount} profiles.`,
      statusCode: 200
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message,
      statusCode: 500
    };
  }
};

const getCountDesignationStatus = async (data: any) => {
  try {
    const designationCount = await User.aggregate([
      {
        $match: {
          company: data.company,
          companyOrg: data.companyOrg,
          deletedAt: { $exists: false },
        },
      },
      { $unwind: "$designation" },
      {
        $group: {
          _id: "$designation",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          designation: "$_id",
          count: 1,
        },
      },
    ]);

    return {
      status: "success",
      data: designationCount,
    };
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
};

const getTotalUsers = async (data: any) => {
  try {
    const result = await companyDetails.aggregate([
      {
        $match: {
          ...data,
          company: { $in: data.company },
          is_active: true,
          deletedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      status: "success",
      data: result.length > 0 ? result[0].count : 0,
      message: "Retrieved Users Counts Successfully",
      statusCode: statusCode.success,
    };
  } catch (err) {
    return createCatchError(err);
  }
};

// UPDATE BANK DETAILS OF THE User

const updateBankDetails = async (data: any) => {
  try {
    const { cancelledCheque, ...rest } = data;
    const updatedData: any = await BankDetails.findOneAndUpdate(
      { user: data.id },
      rest,
      {
        new: true,
      }
    );

    if (!updatedData) {
      return {
        status: "error",
        data: "bank Details does not exist",
      };
    }

    if (
      data?.cancelledCheque?.isDeleted === 1 &&
      updatedData.cancelledCheque?.name
    ) {
      await deleteFile(updatedData.cancelledCheque.name);
      updatedData.cancelledCheque = {
        name: undefined,
        url: undefined,
        type: undefined,
      };
      await updatedData.save();
    }

    if (
      data.cancelledCheque &&
      data.cancelledCheque?.isAdd === 1 &&
      data.cancelledCheque?.filename &&
      data.cancelledCheque?.buffer
    ) {
      const { filename, type } = data.cancelledCheque;
      const url = await uploadFile(data.cancelledCheque);
      updatedData.cancelledCheque = {
        name: filename,
        url,
        type,
      };
      await updatedData.save();
    }

    return {
      status: "success",
      data: updatedData,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

const updatePermissions = async (data: any) => {
  try {
    const updatedData: any = await User.findByIdAndUpdate(
      data.id,
      { permissions: data.permissions },
      {
        new: true,
      }
    );

    if (!updatedData) {
      return {
        status: "error",
        data: "User does not exist",
      };
    }

    return {
      status: "success",
      data: updatedData,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

const updateFamilyDetails = async (data: any) => {
  try {
    const updatedData: any = await FamilyDetails.findOneAndUpdate(
      { user: data.id },
      data,
      {
        new: true,
      }
    );

    if (!updatedData) {
      return {
        status: "error",
        data: "Family Details does not exist",
      };
    }

    return {
      status: "success",
      data: updatedData,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

const updateWorkExperienceDetails = async (data: any) => {
  try {
    let rest = data.experienceDetails;
    let workExperience: any = await WorkExperience.findOne({ user: data.id });
    if (workExperience) {
      for (var i = 0; i < rest.length; i++) {
        try {
          if (
            rest[i].certificate &&
            rest[i].certificate?.buffer &&
            rest[i].certificate.isAdd === 1
          ) {
            const { filename, type, isFileDeleted } = rest[i].certificate;
            const url = await uploadFile(rest[i].certificate);
            rest[i].certificate = {
              name: filename,
              url,
              type,
              isFileDeleted: isFileDeleted,
            };
          }

          if (
            rest[i].certificate.isFileDeleted === 1 &&
            workExperience.experienceDetails[i]?.certificate
          ) {
            await deleteFile(
              workExperience.experienceDetails[i].certificate?.name
            );
          }
        } catch (error) { }
      }
      const updatedData: any = await WorkExperience.findOneAndUpdate(
        { user: data.id },
        { experienceDetails: rest },
        {
          new: true,
        }
      );
      return {
        status: "success",
        data: updatedData,
      };
    } else {
      return {
        status: "error",
        data: "WorkExperience Details does not exists",
      };
    }
  } catch (err: any) {
    throw new Error(err);
  }
};

async function uploadDocument(originalDoc: any, data: any, fieldName: string) {
  try {
    if (
      data[fieldName] &&
      data[fieldName]?.isAdd === 1 &&
      data[fieldName]?.filename &&
      data[fieldName]?.buffer
    ) {
      const { filename, type } = data[fieldName];
      const url = await uploadFile(data[fieldName]);
      return { name: filename, url, type, validTill: "", effectiveFrom: "" };
    }
    if (
      data[fieldName] &&
      data[fieldName]?.isDeleted === 1 &&
      originalDoc[fieldName]
    ) {
      const deleted = await deleteFile(originalDoc[fieldName]?.name);
      return null;
    }
    return originalDoc[fieldName];
  } catch (error: any) {
    return null;
  }
}

async function updateDocumentDetails(data: any) {
  try {
    const docum = await Documents.findOne({ user: data.id });
    if (docum) {
      const { documents } = data;

      for (const file of data.deleteAttachments) {
        await deleteFile(file);
      }

      let attach_files: any = [];

      for (const file of documents) {
        try {
          if (file.file && file.isAdd) {
            let filename = `${data.id}_document_${file.file.filename}`;
            const documentInfo = await uploadFile({ ...file.file, filename });
            delete file.isAdd;
            attach_files.push({
              ...file,
              file: {
                url: documentInfo,
                name: filename,
                type: file.file.type,
              },
            });
          } else {
            if (file.file) {
              delete file.isAdd;
              attach_files.push({
                ...file,
              });
            } else {
              delete file.isAdd;
              attach_files.push({
                ...file,
                file: {
                  url: undefined,
                  name: undefined,
                  type: undefined,
                },
              });
            }
          }
        } catch (err: any) {
          console.error("Error uploading file:", err);
        }
      }

      docum.documents = attach_files;
      await docum.save();
      return {
        statusCode: statusCode.success,
        status: "success",
        data: docum,
      };
    } else {
      return {
        statusCode: statusCode.info,
        status: "error",
        data: "Documents do not exist",
      };
    }
  } catch (err) {
    return {
      statusCode: statusCode.serverError,
      status: "error",
      data: err,
    };
  }
}

async function updateQualificationDetails(data: any) {
  try {
    const docum = await Qualification.findOne({ user: data.id });
    if (docum) {
      const { qualifications } = data;

      for (const file of data.deleteAttachments) {
        await deleteFile(file);
      }

      let attach_files: any = [];

      for (const file of qualifications) {
        try {
          if (file.file && file.isAdd) {
            let filename = `${data.id}_qualification_${file.file.filename}`;
            const documentInfo = await uploadFile({ ...file.file, filename });
            delete file.isAdd;
            attach_files.push({
              ...file,
              file: {
                url: documentInfo,
                name: filename,
                type: file.file.type,
              },
            });
          } else {
            if (file.file) {
              delete file.isAdd;
              attach_files.push({
                ...file,
              });
            } else {
              delete file.isAdd;
              attach_files.push({
                ...file,
                file: {
                  url: undefined,
                  name: undefined,
                  type: undefined,
                },
              });
            }
          }
        } catch (err: any) {
          console.error("Error uploading file:", err);
        }
      }

      docum.qualifications = attach_files;
      await docum.save();
      return {
        statusCode: statusCode.success,
        status: "success",
        data: docum,
      };
    } else {
      return {
        statusCode: statusCode.info,
        status: "error",
        data: "Documents do not exist",
      };
    }
  } catch (err) {
    return {
      statusCode: statusCode.serverError,
      status: "error",
      data: err,
    };
  }
}

async function updateCompanyDetails(data: any) {
  try {
    const docum = await companyDetails.findOne({ user: data.id });
    if (docum) {
      docum.details.push(data.details);
      await docum.save();
      await updateUserRoleService(data.id, data.details.eType);
      return {
        status: "success",
        data: docum,
      };
    } else {
      return {
        status: "error",
        data: "Company Details do not exist",
      };
    }
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
}

export const getManagerUsers = async (data: any) => {
  try {
    let matchConditions: any = {
      is_active: true,
      deletedAt: { $exists: false },
      company: data.company,
    };

    const pipeline: any = [
      {
        $match: matchConditions,
      },
      {
        $addFields: {
          details: { $arrayElemAt: ["$details", -1] },
        },
      },
      {
        $match: {
          "details.managers": { $in: data.managers },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
      {
        $lookup: {
          from: "departments",
          localField: "details.designation",
          foreignField: "_id",
          as: "designation",
        },
      },
    ];

    if (data.search) {
      const searchRegex = new RegExp(data.search.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { "userData.username": { $regex: searchRegex } },
            { "userData.code": { $regex: searchRegex } },
          ],
        },
      });
    }

    const documentPipeline: any = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: (data.page - 1) * data.limit },
      { $limit: Number(data.limit) },
    ];

    const [resultData, countDocuments]: any = await Promise.all([
      companyDetails.aggregate(documentPipeline),
      companyDetails.aggregate([
        ...pipeline,
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalCounts = countDocuments.length > 0 ? countDocuments[0].count : 0;

    return {
      status: "success",
      data: resultData,
      totalPages: Math.ceil(totalCounts / data.limit),
    };
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
};

const getManagerUsersCounts = async (data: any) => {
  try {
    let matchConditions: any = {
      is_active: true,
      deletedAt: { $exists: false },
      company: { $in: data.company },
    };

    const pipeline: any = [
      {
        $match: matchConditions,
      },
      {
        $addFields: {
          details: { $arrayElemAt: ["$details", -1] },
        },
      },
      {
        $unwind: "$details.managers",
      },
      {
        $group: {
          _id: "$details.managers",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "managerDetails",
        },
      },
      {
        $unwind: "$managerDetails",
      },
      {
        $addFields: {
          title: {
            $concat: [
              "$managerDetails.name",
              " ",
              "(",
              "$managerDetails.code",
              ")",
            ],
          },
        },
      },
      {
        $project: {
          managerDetails: 0,
        },
      },
    ];

    const resultData = await companyDetails.aggregate(pipeline).exec();

    return {
      status: "success",
      data: resultData,
    };
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
};

export const getUserInfoWithManagers = async (data: any) => {
  try {
    const matchCriteria: any = {};

    if (data.username) {
      matchCriteria.username = { $regex: data.username, $options: "i" };
    }

    if (data.code) {
      matchCriteria.code = data.code;
    }

    const pipeline: any = [
      {
        $match: matchCriteria,
      },
      {
        $lookup: {
          from: "profiledetails",
          localField: "_id",
          foreignField: "user",
          as: "profileDetails",
        },
      },
      {
        $unwind: "$profileDetails",
      },
      {
        $lookup: {
          from: "companydetails",
          localField: "companyDetail",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $unwind: "$company",
      },
      {
        $addFields: {
          company_details: { $arrayElemAt: ["$company.details", -1] },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "company_details.designation",
          foreignField: "_id",
          as: "designation",
        },
      },
      {
        $lookup: {
          from: "departmentcategories",
          localField: "company_details.department",
          foreignField: "_id",
          as: "departmentCategory",
        },
      },
      {
        $project: {
          password: 0,
          company: 0,
        },
      },
    ];

    if (data.bloodGroup) {
      pipeline.splice(3, 0, {
        $match: { "profileDetails.bloodGroup": data.bloodGroup },
      });
    }

    if (data.designation) {
      pipeline.push({
        $match: {
          "company_details.designation": new mongoose.Types.ObjectId(
            data.designation
          ),
        },
      });
    }

    if (data.department) {
      pipeline.push({
        $match: {
          "company_details.department": new mongoose.Types.ObjectId(
            data.department
          ),
        },
      });
    }

    const datas = await User.aggregate(pipeline).exec();
    return {
      status: "success",
      data: datas,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message || "An error occurred",
    };
  }
};

export const getUserInfoWithManagersAction = async (data: any) => {
  try {
    const page = data.page;
    const limit = data.limit;
    const skip = (page - 1) * limit;

    const pipeline: any = [
      {
        $match: {
          _id: data.userId,
        },
      },
      {
        $lookup: {
          from: "profiledetails",
          localField: "_id",
          foreignField: "user",
          as: "profiledetails",
        },
      },
      {
        $lookup: {
          from: "companydetails",
          localField: "companyDetail",
          foreignField: "_id",
          as: "companydetail",
        },
      },
      {
        $unwind: "$companydetail",
      },
      {
        $addFields: {
          companydetail: { $arrayElemAt: ["$companydetail.details", -1] },
        },
      },
      {
        $unwind: "$companydetail.managers",
      },
      {
        $lookup: {
          from: "departments",
          localField: "companydetail.designation",
          foreignField: "_id",
          as: "designation",
        },
      },
      {
        $lookup: {
          from: "departmentcategories",
          localField: "companydetail.department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { managerId: "$companydetail.managers" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$managerId"],
                },
              },
            },
            {
              $project: {
                name: 1,
                username: 1,
                code: 1,
                title: 1,
                pic: 1,
              },
            },
          ],
          as: "managerDetails",
        },
      },
      {
        $project: {
          name: 1,
          username: 1,
          code: 1,
          title: 1,
          pic: 1,
          "designation.title": 1,
          "department.title": 1,
          profiledetails: 1,
          managerDetails: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const userPipeline: any = [
      {
        $lookup: {
          from: "companydetails",
          localField: "companyDetail",
          foreignField: "_id",
          as: "companydetail",
        },
      },
      {
        $unwind: "$companydetail",
      },
      {
        $addFields: {
          companydetail: { $arrayElemAt: ["$companydetail.details", -1] },
        },
      },
      {
        $match: {
          "companydetail.managers": { $elemMatch: { $eq: data.userId } },
        },
      },
      {
        $lookup: {
          from: "departmentcategories",
          localField: "companydetail.department",
          foreignField: "_id",
          as: "companydetail.department",
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "companydetail.designation",
          foreignField: "_id",
          as: "companydetail.designation",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          "userDetails.name": 1,
          "userDetails.pic": 1,
          "userDetails.username": 1,
          "userDetails.code": 1,
          "userDetails.title": 1,
          "companydetail.designation": 1,
          "companydetail.department": 1,
          "companydetail.doj": 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const [userDetails, users] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(userPipeline),
    ]);

    if (users.length && userDetails.length) {
      return {
        status: "success",
        data: { userDetails, users, page, limit },
      };
    } else {
      return {
        status: "error",
        data: "User does not exists",
      };
    }
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message || "An error occurred",
    };
  }
};

// get the managers of the particular users
const getManagersOfUser = async (data: any) => {
  try {
    const pipeline = [
      {
        $match: { _id: data.user },
      },
      {
        $lookup: {
          from: "companydetails",
          localField: "companyDetail",
          foreignField: "_id",
          as: "companydetail",
        },
      },
      {
        $unwind: "$companydetail",
      },
      {
        $project: {
          managers: {
            $arrayElemAt: ["$companydetail.details.managers", -1],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "managers",
          foreignField: "_id",
          as: "managerDetails",
        },
      },
      {
        $project: {
          managers: {
            $map: {
              input: "$managerDetails",
              as: "manager",
              in: {
                _id: "$$manager._id",
                username: "$$manager.username",
              },
            },
          },
        },
      },
    ];

    const managers = await User.aggregate(pipeline);
    return {
      status: "success",
      data: managers,
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err?.message || "An unknown error occurred",
    };
  }
};

export const getRoleCountOfCompany = async (data: any) => {
  try {
    const { company } = data;

    const pipeline: any = [];

    pipeline.push({
      $match: {
        deletedAt: { $exists: false },
      },
    });

    pipeline.push({
      $lookup: {
        from: "companydetails",
        localField: "companyDetail",
        foreignField: "_id",
        as: "companydetail",
      },
    });

    pipeline.push({
      $unwind: "$companydetail",
    });

    pipeline.push({
      $match: {
        "companydetail.company": company,
      },
    });

    pipeline.push({
      $project: {
        lastDetail: {
          $arrayElemAt: ["$companydetail.details", -1],
        },
      },
    });

    pipeline.push({
      $group: {
        _id: "$lastDetail.eType",
        count: { $sum: 1 },
      },
    });

    const result = await User.aggregate(pipeline);
    return {
      status: "success",
      data: result,
      message: "Retrieved Role Counts Successfully",
      statusCode: 200,
    };
  } catch (err: any) {
    return createCatchError(err);
  }
};

const getCompanyDetailsById = async (data: any) => {
  try {
    const pipeline: any = [
      {
        $match: {
          _id: data.id,
          deletedAt: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "companydetails",
          localField: "_id",
          foreignField: "user",
          as: "companydetails",
        },
      },
      {
        $unwind: {
          path: "$companydetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$companydetails.details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "companydetails.details.designation",
          foreignField: "_id",
          as: "designationDetails",
        },
      },
      {
        $lookup: {
          from: "departmentcategories",
          localField: "companydetails.details.department",
          foreignField: "_id",
          as: "departmentDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { managerIds: "$companydetails.details.managers" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$managerIds"] } } },
            { $project: { username: 1, code: 1, _id: 1 } },
          ],
          as: "managerDetails",
        },
      },
      {
        $lookup: {
          from: "companypolicies",
          localField: "companydetails.company",
          foreignField: "company",
          as: "companyPolicy",
        },
      },
      {
        $unwind: {
          path: "$companyPolicy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "companydetails.details.designationDetails": {
            $arrayElemAt: ["$designationDetails", 0],
          },
          "companydetails.details.departmentDetails": {
            $arrayElemAt: ["$departmentDetails", 0],
          },
          "companydetails.details.managerDetails": "$managerDetails",
          "companydetails.details.workLocationDetails": {
            $map: {
              input: "$companydetails.details.workingLocation",
              as: "locId",
              in: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$companyPolicy.workLocations",
                      as: "workLoc",
                      cond: { $eq: ["$$workLoc._id", "$$locId"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          "companydetails.details.workTimingDetails": {
            $map: {
              input: "$companydetails.details.workTiming",
              as: "timeId",
              in: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$companyPolicy.workTiming",
                      as: "workTime",
                      cond: { $eq: ["$$workTime._id", "$$timeId"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            userId: "$_id",
            detailId: "$companydetails.details._id",
          },
          profileDetails: { $first: "$profiledetails" },
          companydetails: { $first: "$companydetails" },
          bankDetails: { $first: "$bankDetails" },
          details: {
            $push: {
              _id: "$companydetails.details._id",
              doj: "$companydetails.details.doj",
              confirmationDate: "$companydetails.details.confirmationDate",
              managers: "$companydetails.details.managerDetails",
              department: "$companydetails.details.departmentDetails",
              designation: "$companydetails.details.designationDetails",
              workingLocation: "$companydetails.details.workLocationDetails",
              eType: "$companydetails.details.eType",
              description: "$companydetails.details.description",
              workTiming: "$companydetails.details.workTimingDetails",
              createdAt: "$companydetails.details.createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.userId",
          companydetails: { $first: "$companydetails" },
          details: { $first: "$details" },
        },
      },
      {
        $unwind: "$details",
      },
      {
        $replaceRoot: {
          newRoot: {
            _id: "$_id",
            profileDetails: "$profileDetails",
            companydetails: "$companydetails",
            bankDetails: "$bankDetails",
            details: "$details",
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          details: { $push: "$details" },
        },
      },
    ];

    const result = await User.aggregate(pipeline);
    if (result.length) {
      return {
        data: result[0],
        message: "Retrived User Details",
        statusCode: 200,
        status: "success",
      };
    } else {
      return {
        data: "User does not exists",
        message: "User does not exists",
        statusCode: 300,
        status: "error",
      };
    }
  } catch (err: any) {
    return createCatchError(err);
  }
};

const updateStaffPermissions = async (data: any) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      { $set: { permissions: data.permissions } },
      { new: true }
    );

    if (!updatedUser) {
      throw generateError("Staff member not found", 404);
    }

    return {
      status: "success",
      message: "Permissions updated successfully",
      data: updatedUser,
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message,
      data: err,
    };
  }
};

const updateAdminProfileDetails = async (data: any) => {
  try {
    const { pic, _id, ...rest } = data;

    const existCode = await User.exists({
      code: data.code,
      _id: { $ne: data.userId },
    });

    if (existCode) {
      return {
        status: "error",
        data: `${data.code} code is already registered`,
      };
    }

    if (data.username) {
      const existUsername = await User.findOne({
        username: { $regex: new RegExp(`^${data.username}$`, 'i') },
        _id: { $ne: data.userId },
      });
      if (existUsername) {
        return {
          status: "error",
          data: "Username is already registered",
        };
      }
    }

    const phone = data.phoneNumber || data.mobileNumber || rest.phoneNumber || rest.mobileNumber;
    if (phone) {
      const existPhone = await User.findOne({
        mobileNumber: phone,
        _id: { $ne: data.userId },
      });
      if (existPhone) {
        return {
          status: "error",
          data: "Phone number is already registered",
        };
      }
    }

    if (rest.phoneNumber && !rest.mobileNumber) {
      rest.mobileNumber = rest.phoneNumber;
    }

    if (rest.references) {
      rest.references = rest.references.map((ref: any) => ({
        ...ref,
        refrenceBy: ref.refrenceBy?._id || ref.refrenceBy?.value || ref.refrenceBy || undefined
      }));
    }

    delete rest.company

    const users: any = await User.findByIdAndUpdate(data.userId, {
      $set: { ...rest, updatedAt: new Date() },
    });

    if (!users) {
      return {
        status: "error",
        data: "User does not exists",
      };
    }

    // Update Company
    if (users.company) {
      const companyPayload: any = {};
      if (rest.companyName) companyPayload.company_name = rest.companyName;
      if (rest.companyCode) companyPayload.companyCode = rest.companyCode;
      if (rest.companyType) companyPayload.companyType = rest.companyType;
      if (rest.subscriptionStartDate !== undefined) companyPayload.subscriptionStartDate = rest.subscriptionStartDate;
      if (rest.subscriptionEndDate !== undefined) companyPayload.subscriptionEndDate = rest.subscriptionEndDate;

      if (Object.keys(companyPayload).length > 0) {
        if (rest.companyName) {
           const existCompany = await Company.findOne({
             company_name: rest.companyName.trim(),
             _id: { $ne: users.company },
           });
           if (existCompany) {
             return {
                status: "error",
                data: "Company Already Registered With this Name",
             };
           }
        }

        const comp = await Company.findById(users.company);
        if (comp) {
          if (rest.companyName) comp.company_name = rest.companyName;
          if (rest.companyCode) comp.companyCode = rest.companyCode;
          if (rest.companyType) comp.companyType = rest.companyType;
          if (rest.subscriptionStartDate !== undefined) comp.subscriptionStartDate = rest.subscriptionStartDate;
          if (rest.subscriptionEndDate !== undefined) comp.subscriptionEndDate = rest.subscriptionEndDate;
          await comp.save();
        }
      }
    }

    delete rest.pic;
    delete rest?.profileDetails;
    const pUsers = await ProfileDetails.findOneAndUpdate(
      { user: data.userId },
      { $set: { personalInfo: { ...rest } } }
    );
    if (!pUsers && !users) {
      return {
        status: "error",
        data: "User does not exists",
      };
    }

    if (pic?.isDeleted && users.pic?.url && users.pic?.name) {
      await deleteFile(users.pic.name);
      users.pic = {
        name: undefined,
        url: undefined,
        type: undefined,
      };
      await users.save();

      const comp = await Company.findById(users.company);
      if (comp) {
         comp.logo = {
           name: undefined,
           url: undefined,
           type: undefined,
         };
         await comp.save();
      }
    }

    if (pic?.filename && pic?.buffer && pic && pic?.isAdd) {
      pic.filename = generateFileName(pic.filename);
      const url = await uploadFile(pic);
      users.pic = {
        name: pic.filename,
        url,
        type: pic.type,
      };
      await users.save();

      const comp = await Company.findById(users.company);
      if (comp) {
         comp.logo = {
           name: pic.filename,
           url: url,
           type: pic.type,
         };
         await comp.save();
      }
    } else if (pic && pic.url && !pic.buffer) {
      users.pic = {
        name: pic.name || "profile_pic",
        url: pic.url,
        type: pic.type || "image/png"
      };
      await users.save();

      const comp = await Company.findById(users.company);
      if (comp) {
         comp.logo = {
           name: pic.name || "profile_pic",
           url: pic.url,
           type: pic.type || "image/png"
         };
         await comp.save();
      }
    }

    return {
      status: "success",
      data: "Admin Profile has been updated successfully",
    };
  } catch (err) {
    return {
      status: "error",
      data: err,
    };
  }
};

export const getReferredPatients = async (referredByUserId: string) => {
  try {
    const patients = await User.find({
      "references.refrenceBy": new mongoose.Types.ObjectId(referredByUserId)
    }).select("-password");

    return {
      status: "success",
      data: patients,
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message,
      data: err,
    };
  }
};

export const updateAdminStatus = async (userId: string, is_active: boolean) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { is_active: is_active, updatedAt: new Date() } },
      { new: true }
    );
    if (!updatedUser) {
      return { status: "error", message: "User not found", statusCode: 404 };
    }
    return {
      status: "success",
      message: "Admin status updated successfully",
      data: updatedUser,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      data: error,
      statusCode: 500,
    };
  }
};

export const updateAdminPassword = async (userId: string, newPassword: string) => {
  try {
    const hashedPassword = await hashBcrypt(newPassword);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword, updatedAt: new Date() } },
      { new: true }
    );
    if (!updatedUser) {
      return { status: "error", message: "User not found", statusCode: 404 };
    }
    return {
      status: "success",
      message: "Admin password updated successfully",
      data: updatedUser,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      data: error,
      statusCode: 500,
    };
  }
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
  try {
    const hashedPassword = await hashBcrypt(newPassword);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword, updatedAt: new Date() } },
      { new: true }
    );
    if (!updatedUser) {
      return { status: "error", message: "User not found", statusCode: 404 };
    }
    return {
      status: "success",
      message: "User password updated successfully",
      data: updatedUser,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      data: error,
      statusCode: 500,
    };
  }
};

export {
  createUser,
  updateUserProfileDetails,
  getCompanyDetailsById,
  getUsers,
  getUserByName,
  getCompanyDetailsByUserId,
  getCountDesignationStatus,
  getTotalUsers,
  updateBankDetails,
  updateFamilyDetails,
  updateQualificationDetails,
  updateWorkExperienceDetails,
  updateDocumentDetails,
  updateCompanyDetails,
  updatePermissions,
  updateStaffPermissions,
  getManagerUsersCounts,
  getManagersOfUser,
  deleteUser,
  createAdminUser,
  updateAdminProfileDetails,
  updatePersonalDetails
};
