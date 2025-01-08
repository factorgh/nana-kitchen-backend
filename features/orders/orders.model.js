import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  cartItems: [
    {
      title: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      weight: { type: Number, required: true },
      length: { type: Number, required: true },
      height: { type: Number, required: true },
      width: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  userDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String },
    location: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ["processing", "completed", "cancelled"],
    default: "processing",
  },
  country: { type: String },
  ref: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
