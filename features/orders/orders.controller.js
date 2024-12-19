import dotenv from "dotenv";
import Stripe from "stripe";
import { sendEmail } from "../../utils/email.js";
import { processingCustomer } from "../../utils/emailData/processing-status-to-customer.js";
import { createShipOrder } from "../ship/ship-api-handler.js";
import ordersModel from "./orders.model.js";

dotenv.config({
  path: "./.env",
});

const STRIPE = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

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
    const emailData = processingCustomer(
      order,
      shippingDetails,
      totalItemsCost
    );
    await sendEmail(emailData);

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

    // Create line items
    const lineItems = createLineItems(cartItems);

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
const createLineItems = (cartItems) => {
  try {
    return cartItems.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.title,
        },
        unit_amount: Math.round(product.price * 100), // Convert to cents
      },
      quantity: product.quantity,
    }));
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
export const getAllOrders = async (req, res) => {
  try {
    const orders = await ordersModel.find();

    if (!orders) {
      return res.status(404).json({ message: "No orders found." });
    }
    res.status(200).send(orders);
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ error: "Failed to retrieve orders." });
  }
};

export default {
  createStripeCheckout,
  stripeWebhookHandler,
  getAllOrders,
};
