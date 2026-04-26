import labWorkRepository from "../../repository/labWork/labWork.repository";

class LabWorkService {
  private cleanData(data: any) {
    const cleaned = { ...data };
    const fieldsToClean = ["patient", "primaryDoctor", "lab"];
    fieldsToClean.forEach(field => {
      if (cleaned[field] === "" || cleaned[field] === undefined) {
        delete cleaned[field];
      }
    });
    return cleaned;
  }

  async createLabWork(data: any) {
    try {
      const cleanedData = this.cleanData(data);
      const result = await labWorkRepository.create(cleanedData);
      return { status: "success", data: result };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }


  async getAllLabWorks(query: any = {}, options: any = {}) {
    try {
      const result = await labWorkRepository.getAll(query, options);
      return { status: "success", data: result };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  async getLabWorkById(id: string) {
    try {
      const result = await labWorkRepository.getById(id);
      if (!result) {
        return { status: "error", message: "Lab work not found" };
      }
      return { status: "success", data: result };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  async updateLabWork(id: string, data: any) {
    try {
      const cleanedData = this.cleanData(data);
      const result = await labWorkRepository.update(id, cleanedData);
      return { status: "success", data: result };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }


  async deleteLabWork(id: string) {
    try {
      const result = await labWorkRepository.delete(id);
      if (!result) {
        return { status: "error", message: "Lab work not found" };
      }
      return { status: "success", message: "Lab work deleted successfully" };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }
}

export default new LabWorkService();
