// Product routes
import express from "express";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "./product.controller.js";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const router = express.Router();

// Get all products
router.get("/", getAllProducts);

// Get a single product by ID
router.get("/:id", getProductById);

// Add a new product
router.post("/", upload.single("assetImage"), addProduct);

// Update a product
router.put("/:id", upload.single("assetImage"), updateProduct);

// Delete a product
router.delete("/:id", deleteProduct);

export default router;
