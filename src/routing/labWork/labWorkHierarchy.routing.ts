import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createLabWorkHierarchyService,
  bulkCreateLabWorkHierarchyService,
  getAllLabWorkHierarchyService,
  updateLabWorkHierarchyService,
  deleteLabWorkHierarchyService,
} from "../../services/labWork/labWorkHierarchy.service";


const router = express.Router();

router.post("/create", authenticate, createLabWorkHierarchyService);
router.post("/bulk", authenticate, bulkCreateLabWorkHierarchyService);
router.get("/get", authenticate, getAllLabWorkHierarchyService);
router.put("/update/:id", authenticate, updateLabWorkHierarchyService);
router.delete("/delete/:id", authenticate, deleteLabWorkHierarchyService);

export default router;
