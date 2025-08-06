import express from "express";
import {
  getCategories,
  getCategorySubcategories,
  getSubcategoryProducts,
  getActiveProducts,
  searchProducts,
  getProductById,
  getProductOptions
} from "../controllers/catalogController.js";
import { verifyToken } from "../middlewares/authentication.js";

const router = express.Router();

// Categories
router.get("/categories", verifyToken, getCategories);
router.get("/categories/:categoryId/subcategories", verifyToken, getCategorySubcategories);
router.get("/subcategories/:subcategoryId/products", verifyToken, getSubcategoryProducts);

// Products
router.get("/products/active", verifyToken, getActiveProducts);
router.get("/products/search", verifyToken, searchProducts);
router.get("/products/:productId", verifyToken, getProductById);
router.get("/products/:productId/options", verifyToken, getProductOptions);

export default router;
