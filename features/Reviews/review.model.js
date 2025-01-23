import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  customerName: String,
  name: { type: String },
  comment: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rating: { type: Number, min: 0, max: 5 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
