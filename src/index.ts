import "./db/db";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import errorMiddleware from "./modules/config/errorHandler";
import importRoutings from "./routing/routingIndex";
import http from "http";
import * as path from "path";
import { setupSocket } from "./modules/chatSocket/chatSocket";
import { statusCode } from "./config/helper/statusCode";
import connectToDatabase from "./db/db";
// import "./mdbReader";
// import './scripts/freshMdbImport'
// // import deploy from "./config/common/reactAppDeployment";

dotenv.config();

const app = express();

// Create the server
const server = http.createServer(app);
setupSocket(server);

// //Use body-parser
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/notes', express.static(path.join(__dirname, 'src', '../public/notes')));

// Enable CORS for all routes and all origins
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  credentials: false, // Allow cookies to be sent
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

importRoutings(app);

app.use('/', (req: Request, res: Response) => {
  res.status(statusCode.info).send("Welcome to our app");
});

app.use(errorMiddleware);

const startServer = async () => {
  await connectToDatabase(); // ⬅️ WAIT FOR DB CONNECTION FIRST

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();




