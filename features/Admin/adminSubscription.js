import mongoose from "mongoose";

const AdminSubscriptionSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  endpoint: String,
  keys: { auth: String, p256dh: String },
});
const AdminSubscription = mongoose.model(
  "AdminSubscription",
  AdminSubscriptionSchema
);

export default AdminSubscription;
