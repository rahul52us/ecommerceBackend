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

    if (search) {
      mongoQuery.$or = [
        { labInstructions: { $regex: search, $options: "i" } },
        { labNameManual: { $regex: search, $options: "i" } },
        { warrantyCardNumber: { $regex: search, $options: "i" } },
        { "selectedWorks.customNotes": { $regex: search, $options: "i" } },
      ];
    }

    const data = await LabWork.find(mongoQuery)
      .populate("patient", "name code mobileNumber pic")
      .populate("primaryDoctor", "name code pic")
      .populate("lab", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const count = await LabWork.countDocuments(mongoQuery);

    return { data, count, page, limit };
  }

  async getById(id: string) {
    return await LabWork.findOne({ _id: id, isActive: true })
      .populate("patient", "name code mobileNumber pic")
      .populate("primaryDoctor", "name code pic")
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
