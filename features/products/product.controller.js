import cloudinary from "../../utils/cloudinaryConfig.js";
import Product from "./product.model.js";

// Create a new product
export const addProduct = async (req, res, next) => {
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    let imageUrl = null;

    // If there's an image, upload it
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
      });
      imageUrl = result.secure_url;
    }

    // Extract product details
    const {
      title,
      length,
      width,
      height,
      weight,
      country,
      cediDiscount,
      dollarDiscount,
      dollarPrice,
      cediPrice,
    } = req.body;

    // Build product object
    const product = {
      title,
      length,
      width,
      height,
      weight,
      country,
      cediDiscount,
      dollarDiscount,
      dollarPrice,
      cediPrice,
      image: imageUrl, // Could be null if no image uploaded
    };

    const newProduct = await Product.create(product);

    res.status(201).json({
      message: "Product created successfully",
      newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Failed to create product",
      error: error.message || error,
    });
  }
};

// Update product

export const updateProduct = async (req, res, next) => {
  const { id: productId } = req.params;

  try {
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    let updatedData = { ...req.body };

    
// ONLY sanitize if 'reviews' is present in the request
if ("reviews" in updatedData) {
  if (!updatedData.reviews || updatedData.reviews.length === 0) {
    delete updatedData.reviews; // remove empty or undefined reviews
  } else {
    // If it's a string (e.g. a single ID or empty string), wrap into array
    if (typeof updatedData.reviews === "string") {
      updatedData.reviews = [updatedData.reviews];
    }

    // Filter only valid ObjectId strings
    updatedData.reviews = updatedData.reviews.filter(
      (id) => id && typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)
    );

    // If all were filtered out, remove the field entirely
    if (updatedData.reviews.length === 0) {
      delete updatedData.reviews;
    }
  }
}


    // Handle file upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
      });
      updatedData.image = result.secure_url;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({ error: "Failed to update product." });
  }
};


// Delete product

export const deleteProduct = async (req, res, next) => {
  const { id: productId } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.send(deletedProduct); // Send the deleted product back to the client  //
  } catch (err) {
    console.error("Error in deleteProduct:", err);
    res.status(500).json({ error: "Failed to delete product." });
  }
};
//get product by Id

export const getProductById = async (req, res, next) => {
  const { id: productId } = req.params;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.send(product);
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({ error: "Failed to retrieve product." });
  }
};

// get all products

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.send(products);
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({ error: "Failed to retrieve products." });
  }
};
