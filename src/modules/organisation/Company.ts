import { Response, NextFunction } from "express";
import User from "../../schemas/User/User";
import Company from "../../schemas/company/Company";
import ProfileDetails from "../../schemas/User/ProfileDetails";
import QualificationDetails from "../../schemas/User/Qualifications";
import { createValidation } from "./utils/validation";
import { generateError } from "../config/function";
import generateToken from "../config/generateToken";
import Token from "../../schemas/Token/Token";
import WorkExperience from "../../schemas/User/WorkExperience";
import BankDetails from "../../schemas/User/BankDetails";
import DocumentDetails from "../../schemas/User/Document";
import CompanyPolicy from "../../schemas/company/CompanyPolicy";
import FamilyDetails from "../../schemas/User/FamilyDetails";
import { deleteFile, uploadFile } from "../../repository/uploadDoc.repository";
import { statusCode } from "../../config/helper/statusCode";
import mongoose from "mongoose";
import companyDetails from "../../schemas/company/companyDetails";

const createCompany = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const result = createValidation.validate(req.body);
    if (result.error) {
      throw generateError(result.error.details, 422);
    }

    const token = await Token.findOne({ token: req.query.token });
    if (!token) {
      throw generateError("Invalid token or token has expired", 400);
    }

    const user = await User.findById(token.userId);
    if (!user || user?.role !== "superadmin") {
      throw generateError("Invalid token or token has expired", 400);
    }

    const existsComp = await Company.findOne({
      company_name: new RegExp(
        req.body.companyDetails?.company_name?.trim(),
        "i"
      ),
    });
    if (existsComp) {
      throw generateError(
        `${existsComp.company_name} company already exists`,
        400
      );
    }

    const existingCompanyCode = await Company.findOne({
      company_name: new RegExp(
        req.body.companyDetails?.companyCode?.trim(),
        "i"
      ),
    });
    if (existingCompanyCode) {
      throw generateError(
        `${existingCompanyCode?.companyCode} code is alredy existing with ${existingCompanyCode.company_name} company`,
        400
      );
    }


    const comp: any = new Company({
      company_name: req.body.companyDetails?.company_name?.trim(),
      companyType: "organisation",
      companyCode: req.body.companyDetails?.companyCode,
      is_active: true,
      activeUser: token.userId,
      createdBy: token.userId,
      ...req.body.companyDetails,
    });

    const createdComp: any = await comp.save();

    const compPolicy = new CompanyPolicy({
      company: createdComp._id,
      createdBy: user._id,
    });

    const createdCompPolicy: any = await compPolicy.save();

    createdComp.policy = createdCompPolicy._id;
    createdComp.companyOrg = createdComp._id;
    await createdComp.save();

    const profileDetail = new ProfileDetails({
      user: user._id,
    });
    const createdProfileDetails = await profileDetail.save();

    const BankDetail = new BankDetails({
      user: user._id,
    });
    const savedBank = await BankDetail.save();

    const WorkExperienceDetail = new WorkExperience({
      user: user._id,
    });

    const savedWorkExperience = await WorkExperienceDetail.save();

    const documentDetails = new DocumentDetails({
      user: user._id,
    });

    const savedDocument = await documentDetails.save();

    const familyDetails = new FamilyDetails({
      user: user._id,
    });

    const savedFamilyDetails = await familyDetails.save();



    const qualifications = new QualificationDetails({
      user: user._id,
    });

    const savedQualifications = await qualifications.save()

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          name: req.body.name,
          code: req.body.code,
          profile_details: createdProfileDetails._id,
          companyOrg: createdComp._id,
          password: req.body.password,
        },
      },
      { new: true }
    )
      .populate("profile_details")
      .populate("companyDetail");

    if (!updatedUser) {
      throw generateError("Something went wrong, contact administration", 400);
    }

    await token.deleteOne();

    if (req.body.companyDetails.logo && req.body.companyDetails.logo !== "") {
      try {
        let url = await uploadFile(req.body.companyDetails.logo);
        comp.logo = {
          name: req.body.companyDetails.logo.filename,
          url: url,
          type: req.body.companyDetails.logo.type,
        };
        await comp.save();
      }
      catch { }
    }

    const { password, ...rest } = updatedUser.toObject();
    return res.status(201).send({
      message: `${comp.company_name} company has been created successfully`,
      data: {
        ...rest,
        bankDetails: savedBank._id,
        documentDetails: savedDocument._id,
        workExperience: savedWorkExperience._id,
        companyPolicy: createdCompPolicy._id,
        familyDetails: savedFamilyDetails._id,
        qualifications: savedQualifications?._id,
        authorization_token: generateToken({ userId: updatedUser._id }),
      },
      statusCode: 201,
      success: true,
    });
  } catch (err: any) {
    next(err);
  }
};

const createOrganisationCompany = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const companyOrg = req.bodyData.companyOrg;
    let user: any = null;

    // Check the Company
    const checkExistsCompany = await Company.findOne({ company_name: { $regex: new RegExp(req.body.companyDetails?.company_name?.trim(), 'i') } })
    if (checkExistsCompany) {
      return res.status(statusCode.info).send({
        status: "error",
        data: `${checkExistsCompany.company_name} Company is already exists`,
        message: `${checkExistsCompany.company_name} Company is already exists`,
      });
    }

    const codeCompany = await Company.findOne({ companyCode: { $regex: new RegExp(req.body.companyDetails?.companyCode?.trim(), 'i') } });
    if (codeCompany) {
      return res.status(statusCode.info).send({
        status: "error",
        data: `${codeCompany.companyCode} Code is already exists with ${codeCompany.company_name}`,
        message: `${codeCompany.companyCode} Code is already exists with ${codeCompany.company_name}`,
      });
    }

    // Check the User
    user = await User.findOne({ username: { $regex: new RegExp(req.body.username?.trim(), 'i') } });
    if (user) {
      return res.status(statusCode.info).send({
        status: "error",
        data: `${user.username} user is already exists`,
        message: `${user.username} user is already exists`,
      });
    } else {
      const codeUser = await User.findOne({ code: req.body.code?.trim() });
      if (codeUser) {
        return res.status(statusCode.info).send({
          status: "error",
          data: `${codeUser.code} Code is already exists with ${user.username}`,
          message: `${codeUser.code} Code is already exists with ${user.username}`,
        });
      }
      else {
        const userData = new User({
          name: req.body.name,
          username: req.body.username,
          password: req.body.password,
          code: req.body.code,
          role: "admin",
        });
        user = await userData.save();
      }
    }

    // Create the Company
    const comp: any = new Company({
      company_name: req.body.companyDetails?.company_name?.trim(),
      companyType: "company",
      is_active: true,
      ...req.body.companyDetails,
      companyOrg: companyOrg,
      activeUser: user._id,
      createdBy: userId,
    });

    const createdComp: any = await comp.save();

    const compPolicy = new CompanyPolicy({
      company: createdComp._id,
      createdBy: userId,
    });

    const createdCompPolicy: any = await compPolicy.save();

    createdComp.policy = createdCompPolicy._id;
    await createdComp.save();

    if (req.body.companyDetails.logo && req.body.companyDetails.logo !== "") {
      try {
        let url = await uploadFile(req.body.companyDetails.logo);
        comp.logo = {
          name: req.body.companyDetails.logo.filename,
          url: url,
          type: req.body.companyDetails.logo.type,
        };
        await comp.save();
      } catch { }
    }

    const profileDetail = new ProfileDetails({
      user: user._id,
    });
    const createdProfileDetails = await profileDetail.save();

    const BankDetail = new BankDetails({
      user: user._id,
    });
    await BankDetail.save();

    const WorkExperienceDetail = new WorkExperience({
      user: user._id,
    });

    await WorkExperienceDetail.save();

    const documentDetails = new DocumentDetails({
      user: user._id,
    });

    await documentDetails.save();

    const familyDetails = new FamilyDetails({
      user: user._id,
    });

    await familyDetails.save();

    const qualifications = new QualificationDetails({
      user: user._id,
    });

    await qualifications.save()



    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          profile_details: createdProfileDetails._id,
          companyOrg: companyOrg,
          password: req.body.password,
        },
      },
      { new: true }
    )
      .populate("profile_details")
      .populate("companyDetail");

    res.status(statusCode.success).send({
      status: "success",
      data: `${createdComp.company_name} company has been created successfully`,
      message: `${createdComp.company_name} company has been created successfully`,
    });
  } catch (err: any) {
    return res.status(statusCode.serverError).send({
      status: "error",
      message: err?.message,
      data: err?.message,
    });
  }
};

const updateOrganisationCompany = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const comp = await Company.findOne({
      _id: _id,
      deletedAt: { $exists: false },
    });
    if (comp) {
      const updatedCompany: any = await Company.findByIdAndUpdate(
        _id,
        { $set: req.body.companyDetails },
        { new: true }
      );

      for (const file of req.body.companyDetails.deletedFiles) {
        await deleteFile(file);
      }

      if (req.body.companyDetails.logo && req.body.companyDetails.logo !== "" && req.body.companyDetails.isLogoEdit) {
        try {
          let url = await uploadFile(req.body.companyDetails.logo);
          updatedCompany.logo = {
            name: req.body.companyDetails.logo.filename,
            url: url,
            type: req.body.companyDetails.logo.type,
          };
          await updatedCompany.save();
        }
        catch { }
      }

      res.status(statusCode.success).send({
        message: "Company has been Successfully",
        data: updatedCompany,
        status: "success",
      });
    } else {
      res.status(statusCode.info).send({
        message: "Record does not exists",
        data: "Record does not exists",
        status: "error",
      });
    }
  } catch (err: any) {
    return res.status(statusCode.serverError).send({
      status: "error",
      message: err?.message,
      data: err?.message,
    });
  }
};

const filterCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await Company.findOne({
      company_name: req.query?.company?.trim(),
    });
    if (result) {
      throw generateError(`${req.query.company} company is not allowed`, 400);
    }
    res.status(200).send({
      message: `${req.query.company} company is allowed`,
      data: `${req.query.company} company is allowed`,
      statusCode: 200,
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

export {
  createCompany,
  filterCompany,
  createOrganisationCompany,
  updateOrganisationCompany,
};

// Get Company Subscription History
export const getCompanySubscription = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // this is the admin's user ID
    if (!id) {
      throw generateError("User ID is required", 400);
    }

    // Find the company by its ID
    const comp = await Company.findById(id).select('_id subscriptionStartDate subscriptionEndDate subscriptionHistory');
    if (!comp) {
      throw generateError("Company not found", 404);
    }

    res.status(200).send({
      message: "Company subscription fetched successfully",
      data: comp,
      statusCode: 200,
      success: true
    });
  } catch (err) {
    next(err);
  }
};

// Update Company Subscription
export const updateCompanySubscription = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { companyId, subscriptionStartDate, subscriptionEndDate, amount, description } = req.body;
    if (!companyId || !subscriptionStartDate || !subscriptionEndDate) {
      throw generateError("Company ID, Start Date, and End Date are required", 400);
    }

    const comp = await Company.findById(companyId);
    if (!comp) {
      throw generateError("Company not found", 404);
    }

    const updateQuery: any = {
      $set: {
        subscriptionStartDate: new Date(subscriptionStartDate),
        subscriptionEndDate: new Date(subscriptionEndDate),
      },
      $push: {
        subscriptionHistory: {
          startDate: new Date(subscriptionStartDate),
          endDate: new Date(subscriptionEndDate),
          amount: amount,
          description: description,
          updatedBy: req.userId || comp.createdBy,
          updatedAt: new Date(),
        }
      }
    };

    const updatedComp = await Company.findByIdAndUpdate(companyId, updateQuery, { new: true });

    return res.status(200).send({
      message: "Subscription updated successfully",
      status: "success",
      data: updatedComp,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};

// Update specific Company Subscription History record
export const updateCompanySubscriptionHistory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { companyId, historyId, amount, description } = req.body;
    if (!companyId || !historyId) {
      throw generateError("Company ID and History ID are required", 400);
    }

    const comp = await Company.findOneAndUpdate(
      { _id: companyId, "subscriptionHistory._id": historyId },
      {
        $set: {
          "subscriptionHistory.$.amount": amount,
          "subscriptionHistory.$.description": description,
        }
      },
      { new: true }
    );

    if (!comp) {
      throw generateError("Company or history record not found", 404);
    }

    return res.status(200).send({
      message: "Subscription history updated successfully",
      status: "success",
      data: comp,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};

// Update CompanyDetails

export const updatedCompanyDetails = async (req: any, res: Response, next: NextFunction) => {
  try {
    let dt = await companyDetails.findOneAndUpdate({ company: req.body.company }, { $set: { ...req.body } })
    res.status(200).send({
      message: `Details has been updated`,
      data: `Details has been updated`,
      statusCode: 200,
      success: true
    });
  }
  catch (err: any) {
    next(err)
  }
}

export const updateCompanyPreferences = async (req: any, res: Response, next: NextFunction) => {
  try {
    const updateData: any = {};
    if (req.body.operatingHours) updateData.operatingHours = req.body.operatingHours;
    if (req.body.sidebarColors) updateData.sidebarColors = req.body.sidebarColors;

    const dt = await Company.findOneAndUpdate(
      { _id: req.body.company },
      { $set: updateData },
      { new: true }
    );

    res.status(200).send({
      message: "Preferences updated",
      data: dt,
      statusCode: 200,
      success: true
    });
  }
  catch (err) {
    next(err);
  }
};



export const getCompanyDetails = async (req: any, res: Response, next: NextFunction) => {
  try {
    let dt = await companyDetails.findOne({ company: req.params.company })
    res.status(200).send({
      message: `Details has been updated`,
      data: dt,
      statusCode: 200,
      success: true
    });
  }
  catch (err: any) {
    next(err)
  }
}

export const updateCompanyLogo = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { companyId, logoUrl, logo } = req.body;
    if (!companyId) {
      throw generateError("Company ID is required", 400);
    }

    const comp = await Company.findById(companyId);
    if (!comp) {
      throw generateError("Company not found", 404);
    }

    let newLogo: any;

    if (logoUrl) {
      newLogo = {
        name: "company_logo",
        url: logoUrl,
        type: "image/png"
      };
    } else if (logo && logo.buffer && logo.filename) {
      let url = await uploadFile(logo);
      newLogo = {
        name: logo.filename,
        url: url,
        type: logo.type || "image/png",
      };
    }

    const updatedComp = await Company.findByIdAndUpdate(
      companyId,
      { $set: { logo: newLogo } },
      { new: true, runValidators: false }
    );

    res.status(200).send({
      message: "Company logo updated successfully",
      data: updatedComp,
      statusCode: 200,
      success: true
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompanyName = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { companyId, newCompanyName } = req.body;
    
    if (!companyId || !newCompanyName) {
      throw generateError("Company ID and new company name are required", 400);
    }
    
    const user = await User.findById(req.userId);
    if (!user || user.role !== "admin") {
      throw generateError("Only admins can update the company name", 403);
    }

    if (user.company?.toString() !== companyId) {
      throw generateError("You do not have permission to update this company's name", 403);
    }

    const trimmedName = newCompanyName.trim();
    const existsComp = await Company.findOne({
      company_name: new RegExp(`^${trimmedName}$`, "i"),
      _id: { $ne: companyId }
    });

    if (existsComp) {
      throw generateError(`${trimmedName} company already exists. Please choose a unique name.`, 400);
    }

    const updatedComp = await Company.findByIdAndUpdate(
      companyId,
      { $set: { company_name: trimmedName } },
      { new: true, runValidators: false }
    );

    res.status(200).send({
      message: "Company name updated successfully",
      data: updatedComp,
      statusCode: 200,
      success: true
    });

  } catch(err: any) {
    next(err);
  }
};
