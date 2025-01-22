import AdminSubscription from "../features/Admin/adminSubscription.js";

export const notifyAdmins = async (order) => {
  const subscriptions = await AdminSubscription.find(); // Fetch all admin subscriptions

  if (subscriptions.length === 0) {
    console.log("No admin subscriptions found.");
    return;
  }

  const payload = JSON.stringify({
    title: "New Order Received",
    body: `Order #${order._id} placed by a user.`,
    url: "/login",
  });

  subscriptions.forEach((sub) => {
    webpush
      .sendNotification(sub, payload)
      .catch((err) => console.error("Push Error:", err));
  });

  console.log("📢 Notification sent to admins!");
};
