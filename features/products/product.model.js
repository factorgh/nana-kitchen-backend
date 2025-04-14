import mongoose from "mongoose";

const productSchema = mongoose.Schema({
  title: { type: String, required: true },
  dollarPrice: { type: Number },
  cediPrice: { type: Number },
  image: { type: String },
  dollarDiscount: { type: Number },
  cediDiscount: { type: Number },
  quantity: { type: Number },
  length: { type: Number, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  weight: { type: Number, required: true },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  country: {
    type: String,
    enum: ["USA", "Canada", "UK", "Australia", "Ghana"],
    required: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

export default Product;
