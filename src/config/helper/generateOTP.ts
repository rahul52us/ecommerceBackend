import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const DEMO_MODE = process.env.demo_version === "true";
const API_KEY = process.env.OTP_API_KEY || "your-default-api-key";

export const generateOTP = (): string => (DEMO_MODE ? "123456" : Math.floor(100000 + Math.random() * 900000).toString());

// Send OTP
export const sendOtp = async (recipientNumber: string, otp: string) => {
    try {
        if (DEMO_MODE) {
            return { status: "success", data: true };
        }
        const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/${recipientNumber}/${otp}/OTP1`);
        return { status: "success", data: response.data };
    } catch (error) {
        return {
            status: "error",
            data: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};
