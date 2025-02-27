import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { generateError } from "../../config/Error/functions";
import User from "../../schemas/User";
import OTP from "../../schemas/Verification";
import { generateOTP } from "../../config/helper/generateOTP";
import generateToken from "../../config/helper/generateToken";

const createUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { phone, password } = req.body;

        if (!phone || !/^\d{10}$/.test(phone)) {
            throw generateError("Please provide a valid 10-digit mobile number", 400);
        }

        if (!password) {
            throw generateError("Please provide a password", 400);
        }

        const existUser = await User.findOne({ phone: phone });

        if (existUser) {
            throw generateError("User with this mobile number already exists", 400);
        }

        //hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            ...req.body,
            password: hashedPassword
        });

        const savedUser = await user.save();

        if (!savedUser) {
            throw generateError("Failed to create user", 500);
        }

        //generate a 4 to 6 digit otp
        const otp: any = generateOTP();

        const otpDoc = new OTP({
            userId: savedUser._id,
            phone: phone,
            otp: otp
        });

        await otpDoc.save();

        //send otp via whatsapp
        // await sendOTP(phone, otp)

        return res.status(201).send({
            message: "Account created successfully. Please verify your account using the OTP sent to your mobile number.",
            data: {
                userId: savedUser._id,
                mobile_no: savedUser.phone
            },
            statusCode: 201,
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

const verifyUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        throw generateError("Please provide mobile number and OTP", 400);
    }

    //vefiy otp
    const isOTPValid = await OTP.findOneAndUpdate(
        { phone: phone, otp: otp },
        { used: true },
        { new: true }
    );

    if (!isOTPValid) {
        throw generateError("Invalid OTP", 400);
    }

    const updatedUser = await User.findOneAndUpdate(
        { phone },
        { is_verified: true },
        { new: true }
    );

    if (!updatedUser) {
        throw generateError("Failed to update user verification status", 500);
    }

    //generate jwt token
    const token = generateToken({ userId: updatedUser._id, phone: phone, role: updatedUser.type });

    // Return response
    return res.status(200).send({
        message: "Account verified successfully",
        data: {
            token,
            userId: updatedUser._id,
            mobile_no: updatedUser.phone
        },
        statusCode: 200,
        success: true,
    });
}

export {
    createUser,
    verifyUser
}