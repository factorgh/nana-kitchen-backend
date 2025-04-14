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
    // Find the existing product
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    let updatedData = { ...req.body };

    // Check if a new file is attached
    if (req.file) {
      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
      });

      // Update the image URL
      updatedData.image = result.secure_url;
    }

    // Update product with the new or unchanged data
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true } // Return the updated product
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
