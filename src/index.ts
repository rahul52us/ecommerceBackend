import "./db/db";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
// import errorMiddleware from "./modules/config/errorHandler";
import importRoutings from "./routes/index";
import http from "http";
import * as path from "path";

const app = express();
dotenv.config();

//create the server 
const server = http.createServer(app);

//registering body-parder middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

//Enable CORS for all routes and all origin 
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"]
}));

//import routing function 
importRoutings(app);

app.get('/',(req,res) => {
    res.status(200).send("Welcome to our app")
});

//registering custom middleware
// app.use(errorMiddleware);

server.listen(process.env.PORT, () => {
    console.log(`The server is running on port ${process.env.PORT}`);
});