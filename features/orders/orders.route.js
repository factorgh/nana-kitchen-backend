import express from "express";
import { getAllCodes, shipmentWebhook } from "../ship/ship-api-handler.js";
import orders from "./orders.controller.js";

const router = express.Router();

router.get("/", orders.getAllOrders);
router.get("/config", orders.getConfig);
router.get("/trash", orders.getAllOrdersDeleted);

router.delete("/mass-delete", orders.massDelete);
router.post("/checkout/create-checkout-session", orders.createStripeCheckout);
router.post("/create-payment-intent", orders.createPaymentIntent);

router.post("/checkout/webhook", orders.stripeWebhookHandler);
router.put("/:orderId", orders.updateOrderStatus);
router.delete("/:orderId", orders.deleteOrder);

// shipmentRouter
router.post("/shipstation/webhook", shipmentWebhook);

// Shipment carriers serives
router.get("/shipstation/carriers", getAllCodes);

export default router;
