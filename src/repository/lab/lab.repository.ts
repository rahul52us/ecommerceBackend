import LabModal from "../../schemas/labs/lab.schema";

export const createLab = async (data: any) => {
  try {

    const labDetails = new LabModal({...data, createdAt : new Date()});
    const savedLabDetails = await labDetails.save();

    return {
      status: "success",
      data: savedLabDetails,
      message: "Lab Details have been saved successfully",
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

export const updateLab = async (data: any) => {
  try {
    const labDetails = await LabModal.findByIdAndUpdate(data?.id, {$set : {...data}});
    return {
      status: "success",
      data: labDetails,
      message: "Lab Details have been updated successfully",
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

export const deleteLab = async (data: any) => {
  try {
    const labDetails = await LabModal.findByIdAndUpdate(data?.id, {$set : {isActive : false, deletedAt : new Date()}},{new : true});
    return {
      status: "success",
      data: labDetails,
      message: "Lab Details have been deleted successfully",
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
}

export const getLabs = async (
  search: string | undefined,
  page: number,
  limit: number,
  company: any
) => {
  try {

    const skip = (page - 1) * limit;

    const query: any = {deletedAt : {$exists : false}, isActive : true , company : company};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const contacts = await LabModal.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalContacts = await LabModal.countDocuments(query);

    return {
      status: "success",
      data: contacts,
      totalPages: Math.ceil(totalContacts / limit),
      message: "Contacts fetched successfully",
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

