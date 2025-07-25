import express from "express";
import { createTestShipment, getShippingRates, createTestAddress, generateLabelController } from "./shippo.js";

const router = express.Router();


router.post("/get-shipping-rates", getShippingRates);

router.post("/create-test-shipment", createTestShipment);
router.post("/create-test-address", createTestAddress);
router.post("/generate-label", generateLabelController);

export default router;
