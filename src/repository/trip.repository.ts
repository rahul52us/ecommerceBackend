import { generateError } from "../config/Error/functions";
import { TripModel as Trip } from "../schemas/trip/trip.schema";
import { deleteFile, uploadFile } from "./uploadDoc.repository";

export const createTrip = async (data: any) => {
  try {
    const trip = new Trip(data);
    const savedTrip = await trip.save();

    if (data.thumbnail && data.thumbnail?.trim !== "") {
      let url = await uploadFile(data.thumbnail);
      data.thumbnail = {
        name: data.thumbnail.filename,
        url: url,
        type: data.thumbnail.type,
      };
      savedTrip.thumbnail = data.thumbnail;
      await savedTrip.save();
    }

    return {
      status: "success",
      data: savedTrip,
    };
  } catch (err: any) {
    throw new Error(err);
  }
};

export const updateTrip = async (data: any) => {
  try {
    const updatedData: any = await Trip.findByIdAndUpdate(data._id, data, {
      new: true,
    });

    if (!updatedData) {
      return {
        status: "error",
        data: "Trip does not exist",
      };
    }

    if (data.isFileDeleted === 1 && updatedData.thumbnail) {
      await deleteFile(updatedData.thumbnail.name);
      updatedData.thumbnail = null;
      await updatedData.save();
    }

    if (data.thumbnail?.filename && data.thumbnail?.buffer) {
      const { filename, type } = data.thumbnail;
      const url = await uploadFile(data.thumbnail);
      updatedData.thumbnail = {
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
  } catch (err) {
    throw new Error("Failed to update trip");
  }
};

export const getTrips = async (data: any) => {
  try {
    const trips = await Trip.find();
    return {
      data: trips,
      status: "success",
    };
  } catch (err: any) {
    throw new Error(err);
  }
};
