import crypto from "crypto";
import express from "express";
import Paystack from "paystack";
import { sendEmail } from "../../utils/email.js";
import { processingStatusToAdmin } from "../../utils/emailData/processing-status-to-admin.js";
import { processingCustomerPaystack } from "../../utils/emailData/processing-status-to-customer-paystack.js";
import logger from "../../utils/logger.js";

import { notifyAdmins } from "../../utils/notfi-orders.js";
import ordersModel from "../orders/orders.model.js";
const router = express.Router();

// Initialize Paystack with your secret key
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

const calculateTotalAmount = (cartItems) => {
  return cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
};

export const makePayment = async (req, res) => {
  console.log(req.body);
  const { cartItems, userDetails, totalPrice, location } = req.body;

  try {
    //   Create Order

    const newOrder = await ordersModel.create({
      cartItems,
      totalAmount: totalPrice,
      userDetails,
      location,
    });
    console.log(newOrder._id);
    const ref = newOrder._id.toString();

    // Call Paystack's API to initialize the payment
    const response = await paystack.transaction.initialize({
      amount: totalPrice * 100,
      email: userDetails.email,
      // reference: ref,
      name: ref,
    });

    // Logger section
    logger.info("Paystack checkout fired");

    console.log("Paystack initialization successful");
    console.log(response);
    // newOrder.ref = response.reference;

    // Send back the Paystack authorization URL
    res.status(200).json({
      authorization_url: response.data.authorization_url,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error(error);
    logger.error("Paystack checkout failed");
    res.status(500).json({ error: "Payment request initialization failed" });
  }
};

export const verifyPayment = async (req, res) => {
  console.log("Verifying payment...");

  const { reference, orderId } = req.body;

  console.log("-------------------------------reference", reference);
  console.log("-------------------------------orderId", orderId);

  if (!reference || !orderId) {
    return res.status(400).json({ error: "Missing reference or orderId" });
  }

  try {
    // Step 1: Verify payment with Paystack
    const response = await paystack.transaction.verify(reference);
    console.log(
      1,
      "--------------------------------------------------------------"
    );
    console.log(response);
    if (response.data.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }
    console.log(
      2,
      "--------------------------------------------------------------"
    );
    console.log(orderId);

    // Step 2: Update order status
    const order = await ordersModel.findByIdAndUpdate(
      orderId,
      { status: "completed" },
      { new: true }
    );

    order.userDetails.phone = `(${order.userDetails.phone} / ${
      response.data?.customer.phone || ""
    })`;

    console.log(order);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await notifyAdmins(order);

    // Step 4: Calculate shipping and item costs
    const shippingDetails =
      order.totalAmount - calculateTotalAmount(order.cartItems);
    const totalItemsCost = order.totalAmount;

    // Step 5: Notify customer
    const customerEmailData = processingCustomerPaystack(
      order,
      shippingDetails,
      totalItemsCost
    );
    await sendEmail(customerEmailData);

    const admins =
      "ernest@adroit360.com,mightysuccess55@gmail.com,burchellsbale@gmail.com";
    const main = "eric.elewokor@gmail.com";

    // const main = "abdulaziz021099@gmail.com";
    // const admins = "abdulazi6960@gmail.com,burchellsbale@gmail.com";
    // console.log(
    //   "---------------------------Order Details sent --------------------"
    // );
    console.log(order);
    await sendEmail(
      processingStatusToAdmin(main, admins, order, totalItemsCost)
    );

    logger.info("Email sent succesfully");

    // Step 7: Send success response
    res.status(200).json({
      message: "Payment successful",
      data: response.data,
    });
  } catch (error) {
    console.error("Error during payment verification:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Paystack webhook
export const createWebhook = async (req, res) => {
  logger.info("Paystack webhook received successfully");
  try {
    // Parse Paystack webhook event
    const event = req.body;

    // Verify event signature (important for security)
    const paystackSignature = req.headers["x-paystack-signature"];
    if (!verifyPaystackSignature(paystackSignature, event)) {
      return res.status(400).json({ error: "Invalid Paystack signature" });
    }

    console.log("Received Paystack event:", event.event);

    // Handle successful payment
    if (event.event === "charge.success") {
      const data = event.data;
      console.log("Payment success:", data);

      // Get order ID from metadata
      const orderId = data.metadata?.orderId;
      if (!orderId) {
        return res
          .status(400)
          .json({ message: "Order ID not found in metadata" });
      }

      const order = await ordersModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Mark order as completed
      order.status = "completed";
      order.userDetails.phone = `(${order.userDetails.phone} / ${
        data.customer.phone || ""
      })`;

      console.log(
        "Updating order status to completed",
        order.userDetails.phone
      );

      // Calculate shipping details and total cost
      const totalItemsCost = calculateTotalAmount(order.cartItems);
      const shippingDetails = order.totalAmount - totalItemsCost;

      // Prepare and send email
      const emailData = processingCustomerPaystack(
        order,
        shippingDetails,
        totalItemsCost
      );
      await sendEmail(emailData);

      // Save updated order
      await order.save();
      console.log("Order updated successfully");
    }

    // Respond to Paystack
    res.status(200).send("Event processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Function to verify Paystack signature
function verifyPaystackSignature(signature, body) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY; // Ensure this is set in your .env file
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(JSON.stringify(body))
    .digest("hex");

  return signature === hash;
}
