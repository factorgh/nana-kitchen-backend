import express from "express";
import {
  addReview,
  getAllReviews,
  getProductReviews,
  updateReviewStatus,
} from "./review.controller.js";

const router = express.Router();

router.route("/").get(getAllReviews).post(addReview);
router.get("/:productId/review", getProductReviews);
router.put("/:reviewId", updateReviewStatus);

export default router;
