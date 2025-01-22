import express from "express";
import webpush from "web-push";
import AdminSubscription from "../features/Admin/adminSubscription.js";

// Store admin subscriptions (in a real app, use a database)
const router = express.Router();

// Set VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Save admin's push subscription
router.post("/subscribe", async (req, res) => {
  const { subscription, adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({ error: "Admin ID is required" });
  }

  // Check if admin already has a subscription
  const existing = await AdminSubscription.findOne({ adminId });

  if (existing) {
    // Update existing subscription
    await AdminSubscription.updateOne(
      { adminId },
      { endpoint: subscription.endpoint, keys: subscription.keys }
    );
  } else {
    // Create new subscription
    await AdminSubscription.create({ adminId, ...subscription });
  }

  res.status(201).json({ message: "Subscribed successfully" });
});

// Send notification to all admins
router.post("/send-notification", async (req, res) => {
  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({ error: "Admin ID is required" });
  }

  // Fetch subscriptions for the given admin
  const subscriptions = await AdminSubscription.find({ adminId });

  if (subscriptions.length === 0) {
    return res
      .status(404)
      .json({ error: "No active subscriptions found for admin" });
  }

  const payload = JSON.stringify({
    title: "New Order",
    body: "An order has been placed!",
    date: new Date().toISOString(),
  });

  subscriptions.forEach((sub) => {
    webpush
      .sendNotification(sub, payload)
      .catch((err) => console.error("Push error: ", err));
  });

  res.status(200).json({ message: "Notification sent" });
});

export default router;
