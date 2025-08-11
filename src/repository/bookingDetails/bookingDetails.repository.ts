import bookingDetailsSchema from "../../schemas/bookingDetails/bookingDetails.schema";
import axios from "axios";
import dotenv from "dotenv";
import { createNotification } from "../../services/notification/notification.service";

export const createBookingDetails = async (data: any) => {
  try {
    const { name, phone, captchaToken, details } = data;

    if (!name || !phone || !captchaToken) {
      return {
        status: "error",
        data: "Name, phone number, and CAPTCHA token are required",
        message: "Name, phone number, and CAPTCHA token are required",
        statusCode: 400,
      };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

    const response = await axios.post(verificationUrl);


    if (response?.statusText !== "OK") {
      return {
        status: "error",
        data: "reCAPTCHA verification failed",
        message: "reCAPTCHA verification failed. Are you a bot?",
        statusCode: 400,
      };
    }

    const existingContact = await bookingDetailsSchema.findOne({ phone });

    createNotification({
      type : 'booking',
      message : ""
    })
    if (existingContact) {
      return {
        status: "error",
        data: "Phone already exists",
        message: "bookingDetails with this phone already exists",
        statusCode: 400,
      };
    }

    const contactDetails = new bookingDetailsSchema({ name, phone,details });
    const savedContactDetails = await contactDetails.save();

    createNotification({
      type: 'booking',
      message: `${name} (${phone}) has requested a booking`
    });

    return {
      status: "success",
      data: savedContactDetails,
      message: "bookingDetails have been saved successfully",
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: err?.message,
      message: err?.message || "Server error during booking creation",
      statusCode: 500,
    };
  }
};

export const getBooking = async (
  search: string,
  page: number,
  limit: number,
  company: any
) => {
  try {
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await bookingDetailsSchema.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalContacts = await bookingDetailsSchema.countDocuments(query);

    return {
      status: "success",
      data: contacts,
      totalPages: Math.ceil(totalContacts / limit),
      message: "Booking fetched successfully",
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