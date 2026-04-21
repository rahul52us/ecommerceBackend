import express from "express";
import authenticate from "../../modules/config/authenticate";
import {
  createProcedureService,
  getProceduresService,
  updateProcedureService,
  deleteProcedureService,
  bulkCreateProceduresService
} from "../../services/procedure/procedure.service";

const procedureRouting = express.Router();

procedureRouting.post("/create", authenticate, createProcedureService);
procedureRouting.post("/bulk-create", authenticate, bulkCreateProceduresService);
procedureRouting.get("/get", authenticate, getProceduresService);
procedureRouting.put("/:id", authenticate, updateProcedureService);
procedureRouting.delete("/:id", authenticate, deleteProcedureService);

export default procedureRouting;
