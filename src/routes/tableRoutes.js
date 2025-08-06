import express from "express";
import {
  getAllTables,
  getDashboardStats,
  getTableSections,
  getSectionSummary,
  getSectionTables,
  getTableById,
  updateTableStatus,
  getTableOrders,
  createTableOrder,
  getActiveTableOrder
} from "../controllers/tableController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Table management
router.get("/", verifyToken, getAllTables);
router.get("/dashboard", verifyToken, getAllTables);
router.get("/dashboard/stats", verifyToken, getDashboardStats);

// Section-based routes (specific routes first)
router.get("/sections/summary", verifyToken, getSectionSummary);
router.get("/sections", verifyToken, getTableSections);
router.get("/sections/:sectionCode", verifyToken, getSectionTables);

// Table details
router.get("/:tableId", verifyToken, getTableById);
router.put("/:tableId/status", verifyToken, requireAdmin, updateTableStatus);

// Order management
router.get("/:tableId/orders", verifyToken, getTableOrders);
router.post("/:tableId/orders", verifyToken, requireAdmin, createTableOrder);
router.get("/:tableId/orders/active", verifyToken, getActiveTableOrder);

export default router;
