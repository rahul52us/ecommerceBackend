import { createNotification } from "../../services/notification/notification.service";
import bookAppointment from "../../schemas/bookAppointment/bookAppointment";

export const createBookAppointment = async (data: any) => {
  try {
    const { name, phone } = data;

    if (!name || !phone) {
      return {
        status: "error",
        data: "Name, phone number",
        message: "Name, phone number",
        statusCode: 400,
      };
    }

    const contactDetails = new bookAppointment(data);
    const savedContactDetails = await contactDetails.save();

    createNotification({
      type: "appointments",
      message: `${name} (${phone}) has requested a booking appointment`,
    });

    return {
      status: "success",
      data: savedContactDetails,
      message: "",
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

export const getBookAppointent = async (
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

    const contacts = await bookAppointment
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalContacts = await bookAppointment.countDocuments(query);

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
