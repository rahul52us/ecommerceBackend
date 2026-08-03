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

      if (filterCategory && filterCategory !== "all") {
        const matchingIds = hierarchies
          .filter((h: any) => h.name.trim().toLowerCase() === filterCategory.trim().toLowerCase())
          .map((h: any) => h._id.toString());
        
        dbQuery["selectedWorks.selections.0"] = { 
          $in: [...matchingIds, filterCategory, `TXT:${filterCategory}`] 
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
            
            if (filterCategory && filterCategory !== "all") {
              if (category.trim().toLowerCase() !== filterCategory.trim().toLowerCase()) {
                return;
              }
            }

            const shade = work.shadeValue ? (work.shadeSystem ? `${work.shadeSystem} - ${work.shadeValue}` : work.shadeValue) : "-";
            reportData.push({
              date: lw.receivedDate || lw.createdAt,
              technicianName: techName || "-",
              patientName: lw.patientNameManual || lw.patient?.name || "Unknown",
              category,
              teeth: (work.teethNumbers || []).join(", "),
              unit: work.unit || "-",
              shade,
              status: lw.status || "-",
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
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Technician Name', key: 'technicianName', width: 25 },
        { header: 'Patient Name', key: 'patientName', width: 25 },
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Teeth', key: 'teeth', width: 15 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Shade', key: 'shade', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 }
      ];

      // Add rows
      reportData.forEach((data) => {
        let dateStr = "";
        if (data.date) {
          try { dateStr = new Date(data.date).toLocaleDateString(); } catch (e) {}
        }
        worksheet.addRow({
          date: dateStr,
          technicianName: data.technicianName,
          patientName: data.patientName,
          category: data.category,
          teeth: data.teeth,
          unit: data.unit,
          shade: data.shade,
          status: data.status,
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
