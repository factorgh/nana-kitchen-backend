import express from "express";
import { getAllCodes, shipmentWebhook } from "../ship/ship-api-handler.js";
import orders from "./orders.controller.js";

const router = express.Router();

router.get("/", orders.getAllOrders);
router.post("/checkout/create-checkout-session", orders.createStripeCheckout);
router.post("/checkout/webhook", orders.stripeWebhookHandler);

// shipmentRouter
router.post("/shipstation/webhook", shipmentWebhook);

// Shipment carriers serives
router.get("/shipstation/carriers", getAllCodes);

export default router;