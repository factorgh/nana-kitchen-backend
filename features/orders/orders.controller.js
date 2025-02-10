import dotenv from "dotenv";
import mongoose from "mongoose";
import Stripe from "stripe";
import { sendEmail } from "../../utils/email.js";
import { stripeAdmin } from "../../utils/emailData/completed-status-to-stripe-admin.js";
import { processingCustomerStripe } from "../../utils/emailData/processing-status-to-customer-stripe.js";
import { notifyAdmins } from "../../utils/notfi-orders.js";
import { createShipOrder } from "../ship/ship-api-handler.js";
import ordersModel from "./orders.model.js";

dotenv.config({
  path: "./.env",
});

const STRIPE = new Stripe(process.env.STRIPE_SECRET_KEY);

const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const URL = process.env.FRONTEND_URL || "http://localhost:5173";
// https://nanas-kitchen.vercel.app/

const calculateTotalAmount = (cartItems) => {
  return cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
};

const stripeWebhookHandler = async (req, res) => {
  console.log("stripeWebhookHandler body", req.body);
  console.log("stripeWebhookHandler headers", req.headers);
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = STRIPE.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_ENDPOINT_SECRET
    );
  } catch (error) {
    console.log(error);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const order = await ordersModel.findById(
      event.data.object.metadata?.orderId
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Send Email
    order.status = "processing";

    // Send order to ship stattion
    await createShipOrder(order);

    const shippingDetails =
      order.totalAmount - calculateTotalAmount(order.cartItems);

    const totalItemsCost = order.totalAmount;
    // Create checkout session
    const emailData = processingCustomerStripe(
      order,
      shippingDetails,
      totalItemsCost
    );
    await sendEmail(emailData);

    const admins =
      "lisawokor79@yahoo.comeric.elewokor@gmail.com,ernestaryee11@gmail.com";
    const main = "eric.elewokor@gmail.com";

    await sendEmail(
      stripeAdmin(main, admins, order, totalItemsCost, shippingDetails)
    );

    await order.save();
  }

  res.status(200).send();
};

const createStripeCheckout = async (req, res) => {
  console.log(req.body); // Debug incoming request
  try {
    const { cartItems, userDetails, totalPrice } = req.body;

    if (!cartItems || !userDetails) {
      return res.status(400).json({
        error: "Invalid request body. Missing cartItems or userDetails.",
      });
    }

    // Create Order
    const newOrder = new ordersModel({
      cartItems,
      totalAmount: totalPrice,
      userDetails,
    });

    // Notifiy admins
    await notifyAdmins(newOrder);
    // Calculate shipping cost
    const shipmentCost =
      newOrder.totalAmount - calculateTotalAmount(newOrder.cartItems);

    // Create line items
    const lineItems = createLineItems(cartItems, shipmentCost);

    // Create checkout session
    const sessionData = await createCheckoutSession(
      lineItems,
      newOrder._id.toString()
    );

    // Respond with session URL
    if (!sessionData) {
      return res
        .status(500)
        .json({ error: "Failed to create a checkout session." });
    }
    await newOrder.save();
    res.status(200).json({ url: sessionData.url });
  } catch (error) {
    console.error("Error in createStripeCheckout:", error);
    res.status(500).json({
      error: "Internal server error while creating checkout session.",
    });
  }
};

// Create line items
const createLineItems = (cartItems, shipmentCost) => {
  try {
    const lineItems = cartItems.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.title,
        },
        unit_amount: Math.round(product.price * 100), // Convert to cents
      },
      quantity: product.quantity,
    }));

    // Add shipment cost as a separate line item
    if (shipmentCost) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping Cost",
          },
          unit_amount: Math.round(shipmentCost * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    return lineItems;
  } catch (error) {
    console.error("Error in createLineItems:", error);
    throw new Error("Failed to create line items.");
  }
};

// Create checkout session
const createCheckoutSession = async (lineItems, orderId) => {
  console.log("Creating checkout session for order:", orderId);
  try {
    const session = await STRIPE.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      metadata: {
        orderId,
      },
      success_url: `${URL}/success`,
      cancel_url: `${URL}/checkout`,
    });
    return session;
  } catch (error) {
    console.error("Error in createCheckoutSession:", error);
    throw new Error("Failed to create Stripe checkout session.");
  }
};

// Get all orders
// Ensure correct import

export const getAllOrders = async (req, res) => {
  try {
    // Retrieve all non-deleted orders, sorted by createdAt in descending order
    const orders = await ordersModel
      .find({
        $or: [{ deletedMode: false }, { deletedMode: { $exists: false } }],
      })
      .sort({ createdAt: -1 });

    // Send the retrieved orders (even if empty)
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to retrieve orders." });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // Extract only status

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: "Invalid order Id" });
  }

  ordersModel
    .findByIdAndUpdate(orderId, { status }, { new: true })
    .then((updatedOrder) => {
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found." });
      }
      res.json(updatedOrder);
    })
    .catch((error) => {
      console.error("Error in updateReviewStatus:", error);
      res.status(500).json({ error: "Internal Server Error" }); // Send proper error response
    });
};

export const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  try {
    // Update the order to mark it as deleted
    const order = await ordersModel.findByIdAndUpdate(
      orderId,
      { deletedMode: true },
      { new: true } // Ensures the updated document is returned
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order deleted successfully.", order });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getAllOrdersDeleted = (req, res) => {
  ordersModel.find({ deletedMode: true }).then((orders) => {
    res.json(orders);
  });
};

const massDelete = async (req, res) => {
  try {
    const result = await ordersModel.deleteMany({ deletedMode: true });

    console.log(result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No orders found to delete" });
    }

    res.json({
      message: `Successfully deleted ${result.deletedCount} orders`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting orders", error });
  }
};

export default {
  createStripeCheckout,
  stripeWebhookHandler,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getAllOrdersDeleted,
  massDelete,
};
