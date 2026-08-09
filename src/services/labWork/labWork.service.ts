import labWorkRepository from "../../repository/labWork/labWork.repository";
import labWorkHierarchyRepository from "../../repository/labWork/labWorkHierarchy.repository";

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

  async generateTechnicianReport(query: any) {
    try {
      const { technicianName, download, category: filterCategory, ...dbQuery } = query;
      const hierarchies = await labWorkHierarchyRepository.getAll({ company: dbQuery.company });
      const hierarchyMap: Record<string, string> = {};
      hierarchies.forEach((h: any) => {
        hierarchyMap[h._id.toString()] = h.name;
      });

      let filterCategories: string[] = [];
      if (filterCategory && filterCategory !== "all" && filterCategory.length > 0) {
        filterCategories = Array.isArray(filterCategory) ? filterCategory : [filterCategory];
      }
      
      // If "all" is explicitly passed in the array, treat it as no category filter
      if (filterCategories.includes("all")) {
        filterCategories = [];
      }

      if (filterCategories.length > 0) {
        const matchingIds = hierarchies
          .filter((h: any) => filterCategories.some(fc => h.name.trim().toLowerCase() === fc.trim().toLowerCase()))
          .map((h: any) => h._id.toString());
        
        dbQuery["selectedWorks.selections.0"] = { 
          $in: [
            ...matchingIds, 
            ...filterCategories, 
            ...filterCategories.map(fc => `TXT:${fc}`)
          ] 
        };
      }

      const result = await labWorkRepository.getAll(dbQuery, { page: 1, limit: 10000 });
      const labWorks = result.data || [];

      const reportData: any[] = [];
      const searchStr = (query.technicianName || "").trim();
      let searchRegex: RegExp | null = null;
      if (searchStr) {
        try { searchRegex = new RegExp(searchStr, "i"); }
        catch (e) { searchRegex = new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"); }
      }

      labWorks.forEach((lw: any) => {
        lw.selectedWorks?.forEach((work: any) => {
          const techName = (work.technicianName || "").trim();
          
          if (!searchRegex || searchRegex.test(techName)) {
            let category = "Unknown";
            let categoryId: string | null = null;
            if (work.selections && work.selections.length > 0) {
              const firstSelection = work.selections[0];
              if (firstSelection.startsWith("TXT:")) {
                category = firstSelection.replace("TXT:", "");
              } else {
                 category = hierarchyMap[firstSelection] || firstSelection;
                 categoryId = firstSelection;
              }
            }
            
            if (filterCategories.length > 0) {
              if (!filterCategories.some(fc => category.trim().toLowerCase() === fc.trim().toLowerCase())) {
                return;
              }
            }

            const shade = work.shadeValue ? work.shadeValue : "-";
            reportData.push({
              sendDate: lw.sendDate || "-",
              receivedDate: lw.receivedDate || "-",
              technicianName: techName || "-",
              patientName: lw.patientNameManual || lw.patient?.name || "Unknown",
              category,
              teeth: (work.teethNumbers || []).join(", "),
              unit: work.unit || "-",
              shade,
              amount: work.amount || 0,
            });
          }
        });
      });

      if (!download || download === 'false') {
        return { status: "success", data: reportData };
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Technician Report');
      
      // Add columns
      worksheet.columns = [
        { header: 'Send Date', key: 'sendDate', width: 15 },
        { header: 'Received Date', key: 'receivedDate', width: 15 },
        { header: 'Technician Name', key: 'technicianName', width: 25 },
        { header: 'Patient Name', key: 'patientName', width: 25 },
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Teeth', key: 'teeth', width: 15 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Shade', key: 'shade', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 }
      ];

      // Add rows
      reportData.forEach((data) => {
        let sendDateStr = "-";
        if (data.sendDate && data.sendDate !== "-") {
          try { sendDateStr = new Date(data.sendDate).toLocaleDateString(); } catch (e) {}
        }
        let receivedDateStr = "-";
        if (data.receivedDate && data.receivedDate !== "-") {
          try { receivedDateStr = new Date(data.receivedDate).toLocaleDateString(); } catch (e) {}
        }
        worksheet.addRow({
          sendDate: sendDateStr,
          receivedDate: receivedDateStr,
          technicianName: data.technicianName,
          patientName: data.patientName,
          category: data.category,
          teeth: data.teeth,
          unit: data.unit,
          shade: data.shade,
          amount: data.amount
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = buffer.toString('base64');
      
      return { status: "success", data: base64 };

    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }
}

export default new LabWorkService();
