import { Request, Response, NextFunction } from "express";
import { generateError } from "../../config/Error/functions";
import User, { UserInterface } from "../../schemas/User";
import Token from "../../schemas/token";
import { generateOTP } from "../../config/helper/generateOTP";
import generateToken from "../../config/helper/generateToken";
import Company from "../../schemas/Company";

const createAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      throw generateError("Please provide a valid 10-digit mobile number", 400);
    }

    const existUser = await User.findOne({ phone: phone });

    if (existUser) {
      throw generateError("User with this mobile number already exists", 400);
    }

    const user = new User({
      ...req.body,
    });

    const savedUser = await user.save();

    if (!savedUser) {
      throw generateError("Failed to create user", 500);
    }

    // Will generate the otp here
    const otp: any = generateOTP();

    let generatedToken = generateToken({ userId: savedUser._id });
    const tokenDoc = new Token({
      userId: savedUser._id,
      token: generatedToken,
      otp: otp,
      isActive: true,
      type : 'sign_up'
    });

    await tokenDoc.save();

    //  will send the otp here

    return res.status(201).send({
      message:
        "Account created successfully. Please verify your account using the OTP sent to your mobile number.",
      data: {
        userId: savedUser._id,
        mobile_no: savedUser.phone,
        token: generatedToken
      },
      statusCode: 201,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

const verifySignUpUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const { token, otp } = req.body;

      if (!token || !otp) {
        throw generateError("Please provide mobile number and OTP", 400);
      }

      // Verify OTP
      const checkToken = await Token.findOne({ token, isActive: true });
      if (!checkToken || checkToken.otp !== otp) {
        throw generateError("Invalid OTP", 400);
      }

      const updatedUser: any = await User.findById(checkToken.userId);
      if (!updatedUser) {
        throw generateError("User not found", 404);
      }

      const savedCompany = await new Company({ type: "vendor" }).save();
      updatedUser.company = savedCompany._id;
      updatedUser.isActive = true;
      await updatedUser.save();

      const authToken = generateToken({userId : updatedUser._id.toString()});
      checkToken.isActive = false
      await checkToken.save()
      return res.status(200).json({
        message: "Account verified successfully",
        data: { token: authToken },
        statusCode: 200,
        success: true,
      });
    } catch (error) {
      next(error);
    }
};

const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      throw generateError("Please provide a valid 10-digit mobile number", 400);
    }

    const user: any = await User.findOne({ phone }).exec();

    if(!user) {
      throw generateError("This phone is not registered. Please sign up first.", 404);
    }

    // Will generate the otp here
    const otp: any = generateOTP();

    let generatedToken = generateToken({ userId: user._id });
    
    const tokenDoc = new Token({
      userId: user._id,
      token: generatedToken,
      otp: otp,
      isActive: true,
      type : 'login'
    });

    await tokenDoc.save();

    //  will send the otp here

    return res.status(201).send({
      message:
        "OTP sent to your registered mobile number",
      data: {
        userId: user._id,
        mobile_no: user.phone,
        token: generatedToken
      },
      statusCode: 201,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};


const verifyLoginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      throw generateError("Please provide mobile number and OTP", 400);
    }

    // Verify OTP
    const checkToken = await Token.findOne({ token, isActive: true });
    if (!checkToken || checkToken.otp !== otp) {
      throw generateError("Invalid OTP", 400);
    }

    const updatedUser: any = await User.findById(checkToken.userId);
    
    if (!updatedUser) {
      throw generateError("User not found", 404);
    }

    const authToken = generateToken({userId : updatedUser._id.toString()});
    
    checkToken.isActive = false;
    
    await checkToken.save();

    return res.status(200).json({
      message: "Account verified successfully",
      data: { token: authToken },
      statusCode: 200,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};


export { createAdminUser, verifySignUpUser, loginUser, verifyLoginUser };
