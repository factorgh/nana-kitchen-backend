import mongoose from "mongoose";
import Review from "./review.model.js";

export const getAllReviews = async (req, res) => {
  try {
    const allReviews = await Review.find();
    res.send(allReviews);
  } catch (error) {
    console.error("Error in getAllReviews:", error);
    res.status(500).json({ error: "Failed to retrieve reviews." });
  }
};

export const updateReviewStatus = async (req, res) => {
  const { reviewId } = req.params;
  const { status } = req.body; // Extract only status

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ error: "Invalid reviewId" });
  }

  Review.findByIdAndUpdate(reviewId, { status }, { new: true })
    .then((updatedReview) => {
      if (!updatedReview) {
        return res.status(404).json({ error: "Review not found." });
      }
      res.json(updatedReview);
    })
    .catch((error) => {
      console.error("Error in updateReviewStatus:", error);
      res.status(500).json({ error: "Internal Server Error" }); // Send proper error response
    });
};
export const addReview = async (req, res) => {
  try {
    const newReview = await Review.create(req.body);
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error in addReview:", error);
    res.status(500).json({ error: "Failed to add review." });
  }
};

export const getProductReviews = (req, res) => {
  const productId = req.params.productId;
  Review.find({ productId: productId, status: "approved" })
    .then((reviews) => {
      res.send(reviews);
    })
    .catch((err) => {
      console.error("Error in getProductReviews:", err);
      res.status(500).json({ error: "Failed to retrieve product reviews." });
    });
};
