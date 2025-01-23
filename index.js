import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import orderRoute from "./features/orders/orders.route.js";
import paystackRoute from "./features/paystack/paystack.route.js";
import productRoute from "./features/products/product.route.js";
import reviewRoute from "./features/Reviews/review.route.js";
import notiRouter from "./utils/notification.js";

// Env setup
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({
  path: "./.env",
});

//Connect to mongobd
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"));

const app = express();

app.use((req, res, next) => {
  console.log("----- Incoming Request -----");
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("----------------------------");

  next(); // Pass control to the next middleware/route
});

// Middleware to parse JSON request bodies
app.use(cors());
app.use(
  "/api/v1/orders/checkout/webhook",
  express.raw({ type: "application/json" })
);

app.use(helmet());
app.use(morgan("dev"));
// Middleware for Stripe webhook (raw body)
app.use(
  "/api/v1/orders/checkout/webhook",
  bodyParser.raw({ type: "application/json" })
);

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Other routes
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/noti", notiRouter);
app.use("/api/v1/reviews", reviewRoute);

// PAYSTACK
app.use("/api/v1/paystack", paystackRoute);

const port = 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
