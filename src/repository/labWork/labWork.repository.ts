import LabWork from "../../schemas/labWork/labWork.schema";

class LabWorkRepository {
  async create(data: any) {
    const labWork = new LabWork(data);
    return await labWork.save();
  }

  async getAll(query: any = {}, options: any = {}) {
    const { search, ...filters } = query;
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    let mongoQuery: any = { ...filters, isActive: true };

    // Use aggregation to support searching by populated fields
    const pipeline: any[] = [
      { $match: mongoQuery },
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "patientData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "primaryDoctor",
          foreignField: "_id",
          as: "doctorData",
        },
      },
      {
        $lookup: {
          from: "labs",
          localField: "lab",
          foreignField: "_id",
          as: "labData",
        },
      },
    ];

    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { labInstructions: searchRegex },
            { labNameManual: searchRegex },
            { patientNameManual: searchRegex },
            { doctorNameManual: searchRegex },
            { warrantyCardNumber: searchRegex },
            { "selectedWorks.customNotes": searchRegex },
            { "patientData.name": searchRegex },
            { "doctorData.name": searchRegex },
            { "labData.name": searchRegex },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await LabWork.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    pipeline.push({ $sort: sort });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const data = await LabWork.aggregate(pipeline);

    // Populate the results to match the expected format (for model instances)
    const populatedData = await LabWork.populate(data, [
      { path: "patient", select: "name code mobileNumber pic" },
      { path: "primaryDoctor", select: "name labDoctorName code pic" },
      { path: "lab", select: "name" },
    ]);

    return { data: populatedData, count: totalCount, page, limit };
  }

  async getById(id: string) {
    return await LabWork.findOne({ _id: id, isActive: true })
      .populate("patient", "name code mobileNumber pic")
      .populate("primaryDoctor", "name labDoctorName code pic")
      .populate("lab", "name");
  }

  async update(id: string, data: any) {
    return await LabWork.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: data },
      { new: true }
    );
  }

  async delete(id: string) {
    return await LabWork.findOneAndUpdate(
      { _id: id },
      { $set: { isActive: false } },
      { new: true }
    );
  }
}

export default new LabWorkRepository();
