import express from "express";
import {
  getOrderById,
  updateOrderStatus,
  addOrderItem,
  removeOrderItem,
  updateOrderItem
} from "../controllers/orderController.js";
import { verifyToken, requireStaff } from "../middlewares/authentication.js";

const router = express.Router();

// Order management
router.get("/:orderId", verifyToken, getOrderById);
router.put("/:orderId/status", verifyToken, requireStaff, updateOrderStatus);

// Order items management
router.post("/:orderId/items", verifyToken, requireStaff, addOrderItem);
router.put("/:orderId/items/:itemId", verifyToken, requireStaff, updateOrderItem);
router.delete("/:orderId/items/:itemId", verifyToken, requireStaff, removeOrderItem);

export default router;
