import express from "express"
import {buyShippingLabel, getShippingRates,  getEasyshipRates} from "./easy.controller.js"

const router = express.Router();

router.post("/get-shipping-rates", getShippingRates);
router.post("/buy-shipping-label", buyShippingLabel);
router.post("/get-rates",  getEasyshipRates);

export default router;
