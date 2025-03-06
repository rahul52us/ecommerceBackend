import "./db/db";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import importRoutings from "./routes/index";
import http from "http";
import errorMiddleware from "./config/errorHandler";

const app = express();
dotenv.config();

//create the server
const server = http.createServer(app);

//registering body-parder middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/whatsapp-webhook", async (req, res) => {
    const { From, Body, NumMedia, MediaUrl0 } = req.body;
    const userPhone = From.replace("whatsapp:", ""); // Extract user's phone number

    if (NumMedia > 0) {
        // User sent a photo
        console.log(`Received image from ${userPhone}: ${MediaUrl0}`);
        res.send(`<Response><Message>✅ Image received! Now send product name & price.</Message></Response>`);
    } else {
        // User sent text (Product Name & Price)
        const [name, price] = Body.split(","); // Example: "Nike Shoes, 2000"
        console.log(`Received product from ${userPhone}: ${name} - ₹${price}`);
        res.send(`<Response><Message>✅ Product added to your account!</Message></Response>`);
    }
});


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
app.use(errorMiddleware);

server.listen(process.env.PORT, () => {
    console.log(`The server is running on port ${process.env.PORT}`);
});