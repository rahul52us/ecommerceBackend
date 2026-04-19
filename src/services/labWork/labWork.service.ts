import labWorkRepository from "../../repository/labWork/labWork.repository";

class LabWorkService {
  async createLabWork(data: any) {
    try {
      const result = await labWorkRepository.create(data);
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
      const result = await labWorkRepository.update(id, data);
      if (!result) {
        return { status: "error", message: "Lab work not found or could not be updated" };
      }
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
