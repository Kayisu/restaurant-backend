import express from "express";
import {
  getMenuCategories,
  getCategoryMenus,
  getMenuById,
  getMenuItems,
  getActiveMenus
} from "../controllers/menuController.js";
import { verifyToken } from "../middlewares/authentication.js";

const router = express.Router();

// Menu categories and listings
router.get("/categories", verifyToken, getMenuCategories);
router.get("/categories/:categoryId/menus", verifyToken, getCategoryMenus);
router.get("/active", verifyToken, getActiveMenus);

// Menu details
router.get("/:menuId", verifyToken, getMenuById);
router.get("/:menuId/items", verifyToken, getMenuItems);

export default router;
