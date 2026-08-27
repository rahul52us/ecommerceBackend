import express from "express";
import { uploadFileDocumentService, uploadTutorialDocumentService } from "../services/file/file.service";

const fileRouting = express.Router();
fileRouting.post("/upload", uploadFileDocumentService);
fileRouting.post("/upload-tutorial", uploadTutorialDocumentService);

export default fileRouting;
