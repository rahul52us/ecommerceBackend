import DealerModal from "../../schemas/dealers/dealer.schema";

export const createDealer = async (data: any) => {
  try {
    const dealerDetails = new DealerModal({ ...data, createdAt: new Date() });
    const savedDealerDetails = await dealerDetails.save();

    return {
      status: "success",
      data: savedDealerDetails,
      message: "Dealer Details have been saved successfully",
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

export const updateDealer = async (data: any) => {
  try {
    const dealerDetails = await DealerModal.findByIdAndUpdate(data?.id, { $set: { ...data } });
    return {
      status: "success",
      data: dealerDetails,
      message: "Dealer Details have been updated successfully",
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

export const deleteDealer = async (data: any) => {
  try {
    const dealerDetails = await DealerModal.findByIdAndUpdate(data?.id, { $set: { isActive: false, deletedAt: new Date() } }, { new: true });
    return {
      status: "success",
      data: dealerDetails,
      message: "Dealer Details have been deleted successfully",
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

export const getDealers = async (
  search: string,
  page: number,
  limit: number,
  company: any,
  userId: any,
  userType: any
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { deletedAt: { $exists: false }, isActive: true, company: company };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } }
      ];
    }

    if (userId && userType === "staff") {
      query.createdBy = userId;
    }

    const contacts = await DealerModal.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalContacts = await DealerModal.countDocuments(query);

    return {
      status: "success",
      data: contacts,
      totalPages: Math.ceil(totalContacts / limit),
      message: "Dealers fetched successfully",
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
