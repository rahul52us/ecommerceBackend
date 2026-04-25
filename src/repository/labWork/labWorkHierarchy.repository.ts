import LabWorkHierarchy from "../../schemas/labWork/labWorkHierarchy.schema";

class LabWorkHierarchyRepository {
  async create(data: any) {
    const hierarchy = new LabWorkHierarchy(data);
    return await hierarchy.save();
  }

  async bulkCreate(data: any[]) {
    return await LabWorkHierarchy.insertMany(data);
  }


  async getAll(query: any = {}) {
    const mongoQuery: any = { ...query, isActive: true };
    return await LabWorkHierarchy.find(mongoQuery).sort({ name: 1 });
  }

  async getById(id: string) {
    return await LabWorkHierarchy.findOne({ _id: id, isActive: true });
  }

  async update(id: string, data: any) {
    return await LabWorkHierarchy.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: data },
      { new: true }
    );
  }

  async delete(id: string) {
    return await LabWorkHierarchy.findOneAndUpdate(
      { _id: id },
      { $set: { isActive: false, deletedAt: new Date() } },
      { new: true }
    );
  }

  async getChildren(parentId: string | null, company: string) {
    return await LabWorkHierarchy.find({ 
      parent: parentId, 
      company, 
      isActive: true 
    }).sort({ name: 1 });
  }

  async getFullHierarchy(company: string) {
    // This is a simple fetch, the frontend or service can build the tree
    return await LabWorkHierarchy.find({ 
      company, 
      isActive: true 
    }).sort({ name: 1 });
  }
}

export default new LabWorkHierarchyRepository();
