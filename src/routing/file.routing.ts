import express from "express";
import { uploadFileDocumentService } from "../services/file/file.service";

const fileRouting = express.Router();
fileRouting.post("/upload", uploadFileDocumentService);

export default fileRouting;
