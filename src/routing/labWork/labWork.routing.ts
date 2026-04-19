import { Router } from "express";
import labWorkService from "../../services/labWork/labWork.service";
import authenticate from "../../modules/config/authenticate";

const LabWorkRouter = Router();

LabWorkRouter.post("/", authenticate, async (req: any, res) => {
  const result = await labWorkService.createLabWork({
    ...req.body,
    createdBy: req.userId,
    company: req.bodyData.company,
  });
  res.status(result.status === "success" ? 201 : 400).json(result);
});

LabWorkRouter.get("/", authenticate, async (req: any, res) => {
  const query = { company: req.bodyData.company };
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };

  // Add specific filters if needed
  if (req.query.patient) (query as any)["patient"] = req.query.patient;
  if (req.query.doctor) (query as any)["primaryDoctor"] = req.query.doctor;
  if (req.query.workType) (query as any)["workType"] = req.query.workType;
  if (req.query.status) (query as any)["status"] = req.query.status;

  const result = await labWorkService.getAllLabWorks(query, options);
  res.status(result.status === "success" ? 200 : 400).json(result);
});

LabWorkRouter.get("/:id", authenticate, async (req, res) => {
  const result = await labWorkService.getLabWorkById(req.params.id);
  res.status(result.status === "success" ? 200 : 400).json(result);
});

LabWorkRouter.patch("/:id", authenticate, async (req, res) => {
  const result = await labWorkService.updateLabWork(req.params.id, req.body);
  res.status(result.status === "success" ? 200 : 400).json(result);
});

LabWorkRouter.delete("/:id", authenticate, async (req, res) => {
  const result = await labWorkService.deleteLabWork(req.params.id);
  res.status(result.status === "success" ? 200 : 400).json(result);
});

export default LabWorkRouter;
