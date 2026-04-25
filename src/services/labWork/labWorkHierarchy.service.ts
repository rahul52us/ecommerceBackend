import LabWorkHierarchyRepository from "../../repository/labWork/labWorkHierarchy.repository";

export const createLabWorkHierarchyService = async (req: any, res: any) => {
  try {
    const data = {
      ...req.body,
      company: req.bodyData?.company || req.query?.company || req.body?.company,
      createdBy: req.bodyData?._id || req.body?.createdBy,
    };
    const result = await LabWorkHierarchyRepository.create(data);
    return res.status(201).json({ status: "success", data: result });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const bulkCreateLabWorkHierarchyService = async (req: any, res: any) => {
  try {
    const { items } = req.body;
    const company = req.bodyData?.company || req.query?.company || req.body?.company;
    const createdBy = req.bodyData?._id || req.body?.createdBy;


    const dataWithContext = items.map((item: any) => ({
      ...item,
      company,
      createdBy,
    }));

    const result = await LabWorkHierarchyRepository.bulkCreate(dataWithContext);
    return res.status(201).json({ status: "success", data: result });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const getAllLabWorkHierarchyService = async (req: any, res: any) => {
  try {

    const company = req.bodyData?.company || req.query?.company || req.body?.company;
    const { parent } = req.query;
    
    let result;
    if (parent !== undefined) {
      result = await LabWorkHierarchyRepository.getChildren(parent === "null" ? null : parent, company);
    } else {
      result = await LabWorkHierarchyRepository.getFullHierarchy(company);
    }
    
    return res.status(200).json({ status: "success", data: result });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const updateLabWorkHierarchyService = async (req: any, res: any) => {
  try {
    const result = await LabWorkHierarchyRepository.update(req.params.id, req.body);
    return res.status(200).json({ status: "success", data: result });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};

export const deleteLabWorkHierarchyService = async (req: any, res: any) => {
  try {
    const result = await LabWorkHierarchyRepository.delete(req.params.id);
    return res.status(200).json({ status: "success", data: result });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
