import axios from "axios";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.SHIP_STATION_API_KEY;
const API_SECRET = process.env.SHIP_STATION_SECRET_KEY;

const SHIPSTATION_API_URL = "https://ssapi.shipstation.com/orders/createorder";

const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

export const createShipOrder = async (order) => {
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
    console.log("Order created successfully:", response.data);
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response ? error.response.data : error.message
    );
  }
};

// ---------------------------------Ship station webhook hamdler

// Webhook endpoint
export const shipmentWebhook = async (req, res) => {
  console.log(req.body);
  try {
    const event = req.body;
    console.log("Received ShipStation event:", event);

    // Process the event (e.g., update order status in your database)
    if (event.resource_type === "SHIP_NOTIFY") {
      console.log(`Order status updated: ${event.resource_url}`);
      axios
        .get(event.resource_url, {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        })
        .then(async function (response) {
          console.log("Order details:", response.data);

          await Order.findByIdAndUpdate(response.data.orderNumber, {
            status: "completed",
          });
        });
      // Fetch additional details if needed and update the database
    }

    // Respond to ShipStation
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Error processing webhook");
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
