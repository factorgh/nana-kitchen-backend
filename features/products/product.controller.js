import cloudinary from "../../utils/cloudinaryConfig.js";
import Product from "./product.model.js";

// Create a new product
export const addProduct = async (req, res, next) => {
  console.log(req.body);
  console.log(req.file);
  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products",
    });

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

    // Save product details along with the image URL
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
      image: result.secure_url, // URL from Cloudinary
    };

    // TODO: Save 'product' to your database
    console.log("Product details:", product);
    const newProduct = await Product.create(product);

    // Respond with success
    res
      .status(201)
      .json({ message: "Product created successfully", newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product", error });
  }
};

// Update product

export const updateProduct = async (req, res, next) => {
  const { id: productId } = req.params;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.send(updatedProduct);
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
