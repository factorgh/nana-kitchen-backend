import crypto from "crypto";
import express from "express";
import Paystack from "paystack";
import { sendEmail } from "../../utils/email.js";
import { processingStatusToAdmin } from "../../utils/emailData/processing-status-to-admin.js";
import { processingCustomer } from "../../utils/emailData/processing-status-to-customer.js";
import ordersModel from "../orders/orders.model.js";
import { createShipOrder } from "../ship/ship-api-handler.js";
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
  const { cartItems, userDetails, totalPrice } = req.body;

  try {
    //   Create Order

    const newOrder = await ordersModel.create({
      cartItems,
      totalAmount: totalPrice,
      userDetails,
    });
    console.log(newOrder._id);
    const ref = newOrder._id.toString();

    // Call Paystack's API to initialize the payment
    const response = await paystack.transaction.initialize({
      amount: totalPrice * 100,
      email: userDetails.email,
      reference: ref,
      name: ref,
    });

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
    res.status(500).json({ error: "Payment request initialization failed" });
  }
};

export const verifyPayment = async (req, res) => {
  console.log("Verifying payment...");

  const { reference, orderId } = req.body;

  if (!reference || !orderId) {
    return res.status(400).json({ error: "Missing reference or orderId" });
  }

  try {
    // Step 1: Verify payment with Paystack
    const response = await paystack.transaction.verify(reference);

    if (response.data.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }
    console.log(orderId);

    // Step 2: Update order status
    const order = await ordersModel.findByIdAndUpdate(
      orderId,
      { status: "completed" },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // // Step 3: Process shipping
    // await createShipOrder(order);

    // Step 4: Calculate shipping and item costs
    const shippingDetails =
      order.totalAmount - calculateTotalAmount(order.cartItems);
    const totalItemsCost = order.totalAmount;

    // Step 5: Notify customer
    const customerEmailData = processingCustomer(
      order,
      shippingDetails,
      totalItemsCost
    );
    await sendEmail(customerEmailData);

    // Step 6: Notify admins
    // const admins = [
    //   // "lisawokor79@yahoo.com",
    //   // "eelewokor@voltican.com",
    //   // "soniaboateng17@gmail.com",
    //   // "ernestaryee11@gmail.com",
    //   "ernest@adroit360gh.com",

    // ];

    const admins =
      "ernest@adroit360.com,info@adroit360.com,mightysuccess55@gmail.com";
    const main = "ernest@adroit360gh.com";

    await sendEmail(
      processingStatusToAdmin(main, admins, order, totalItemsCost)
    );

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
  // Logging paystack webhook event
  const event = req.body;

  // Verify event signature (important for security)
  const paystackSignature = req.headers["x-paystack-signature"];
  if (!verifyPaystackSignature(paystackSignature, event)) {
    return res.status(400).json({ error: "Invalid Paystack signature" });
  }

  // Handle the event (payment successful, etc.)
  if (event.event === "charge.success") {
    const data = event.data;
    console.log("Payment success:", data);

    if (event.type === "checkout.session.completed") {
      const order = await ordersModel.findById(
        event.data.object.metadata?.orderId
      );

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Send Email
      order.status = "completed";

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
      // Send Email to user
      await sendEmail(emailData);

      // Send Email to admins

      await order.save();
    }

    // You can update your database or perform further logic here
  }

  // Respond back with 200 OK
  res.status(200).send("Event processed");
};

function verifyPaystackSignature(signature, body) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY; // Your Paystack secret key
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(JSON.stringify(body))
    .digest("hex");

  return signature === hash;
}
