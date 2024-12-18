import express from "express";
import {
  createWebhook,
  makePayment,
  verifyPayment,
} from "./paystack.controller.js";

const router = express.Router();

router.post("/verify", verifyPayment);
router.post("/pay", makePayment);
router.post("/webhook", createWebhook);

export default router;
