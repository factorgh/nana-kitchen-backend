import axios from "axios";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import ordersModel from "../orders/orders.model.js";
import logger from "../../utils/logger.js";

dotenv.config();

const API_KEY = process.env.SHIP_STATION_API_KEY;
const API_SECRET = process.env.SHIP_STATION_SECRET_KEY;

const SHIPSTATION_API_URL = "https://ssapi.shipstation.com/orders/createorder";

const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

export const createShipOrder = async (order) => {
  logger.info("Order fired to ship station");
  console.log(
    "------------------------------------------------- ship station -------------------------",
    order
  );
  order.cartItems.forEach((item) => {
    console.log(`Length: ${item.length}, Height: ${item.height}`);
  });

  // Dimensions
  const totalQuantity = order.cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  let dimensions;

  if (totalQuantity === 1) {
    dimensions = { units: "inches", length: 8, width: 6, height: 4 };
  } else if (totalQuantity === 2) {
    dimensions = { units: "inches", length: 12, width: 9, height: 6 };
  } else if (totalQuantity === 3) {
    dimensions = { units: "inches", length: 12, width: 10, height: 8 };
  } else if (totalQuantity === 4) {
    dimensions = { units: "inches", length: 19, width: 14, height: 17 };
  } else if (totalQuantity === 5) {
    dimensions = { units: "inches", length: 10, width: 10, height: 10 };
  } else {
    dimensions = { units: "inches", length: 12, width: 12, height: 12 };
  }
  console.log("Dimensions", dimensions);
  // Dimensions

  const cartItemTotalPrice = order.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = order.totalAmount - cartItemTotalPrice;
  const shippingAmount = shipping.toFixed(2);

  console.log("-------------------------Shipping amount", shippingAmount);

  const cartItemTotalWeight = order.cartItems.reduce((sum, item) => {
    return sum + (item.weight || 0);
  }, 0);

  console.log(
    "-----------------------------------carItem",
    cartItemTotalWeight,
    cartItemTotalWeight.toString()
  );

  const updateWeight = cartItemTotalWeight.toString();

  const orderPayload = {
    orderNumber: order._id.toString(),
    orderDate: order.createdAt,
    orderStatus: "awaiting_shipment",
    customerEmail: order.userDetails.email,
    billTo: {
      name: `${order.userDetails.firstName} ${order.userDetails.lastName}`,
      street1: order.userDetails.address,
      city: order.userDetails.state,
      state: order.userDetails.state,
      postalCode: order.userDetails.zip,
      country: order.userDetails.country,
      phone: order.userDetails.phone,
    },
    shipTo: {
      name: `${order.userDetails.firstName} ${order.userDetails.lastName}`,
      street1: order.userDetails.address,
      city: order.userDetails.state,
      state: order.userDetails.state,
      postalCode: order.userDetails.zip,
      country: order.userDetails.country,
      phone: order.userDetails.phone,
    },
    items: order.cartItems.map((item) => ({
      name: item.title,
      quantity: item.quantity,
      unitPrice: item.price,
      sku: item.sku || "DEFAULT_SKU",
    })),
    dimensions,
    serviceCode: "usps_ground_advantage",
    carrierCode: "stamps_com",
    paymentMethod: "creditcard",
    packageCode: "package",
    shippingAmount,
    weight: {
      value: updateWeight,
      units: "ounces",
    },
    requestedShippingService: "priority_mail",
    shipDate: new Date().toISOString(),
  };

  try {
    const response = await axios.post(SHIPSTATION_API_URL, orderPayload, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
    logger.info("Order moved successfully shipped to ship station");
    console.log("Order created successfully:", response.data);
  } catch (error) {
    logger.error("Order failed  to be moved to ship station ");
    console.error(
      "Error creating order:",
      error.response ? error.response.data : error.message
    );
  }
};

// Webhook endpoint
export const shipmentWebhook = async (req, res) => {
  logger.info("Ship station fired event back to app");
  console.log(req.body);
  try {
    const event = req.body;
    console.log("Received ShipStation event:", event);

    // Process the event if it's a SHIP_NOTIFY event
    if (event.resource_type === "SHIP_NOTIFY") {
      console.log(`Fetching shipment details from: ${event.resource_url}`);

      // Logger monitor
      logger.info("Order shipped from ship station to client successfully");

      try {
        const response = await axios.get(event.resource_url, {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        });

        const shipments = response.data.shipments;

        if (!Array.isArray(shipments)) {
          console.error("Expected 'shipments' to be an array.");
          return res.status(400).send("Invalid shipment data.");
        }

        for (const shipment of shipments) {
          if (shipment.orderNumber) {
            console.log(
              `Updating order status for orderNumber: ${shipment.orderNumber}`
            );

            await ordersModel.findByIdAndUpdate(shipment.orderNumber, {
              status: "delivered",
            });
          } else {
            console.warn("Shipment missing orderNumber:", shipment);
          }
        }
      } catch (axiosError) {
        console.error("Error fetching shipment details:", axiosError.message);
        return res.status(500).send("Error fetching shipment details.");
      }
    }

    // Respond to ShipStation webhook promptly
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    res.status(500).send("Error processing webhook.");
  }
};

// Get all carrier codes
export const getAllCodes = async (req, res) => {
  const carrierCode = req.query.carrierCode;
  console.log(carrierCode);
  try {
    const response = await axios.get(
      `https://ssapi.shipstation.com/carriers/listservices?carrierCode=${carrierCode}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching services:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

async function fetchOrderDetails(resourceUrl) {
  try {
    const response = await axios.get(resourceUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`
        ).toString("base64")}`,
      },
    });

    console.log("Order details:", response.data);
    // Update your order model in the database here
  } catch (error) {
    console.error("Error fetching order details:", error);
  }
}
