import express from "express";
import {
  getAllTables,
  getDashboardStats,
  getTableSections,
  getSectionSummary,
  getSectionTables,
  getTableById,
  createTable,
  deleteTable,
  updateTableStatus,
  updateTableReservationStatus,
  getTableOrders,
  createTableOrder,
  getActiveTableOrder
} from "../controllers/tableController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";
import { validateCreateTable } from "../middlewares/inputValidator.js";

const router = express.Router();

// Table management (Admin only for CRUD operations)
router.get("/", verifyToken, getAllTables);
router.post("/", verifyToken, requireAdmin, validateCreateTable, createTable);
router.delete("/:tableId", verifyToken, requireAdmin, deleteTable);

// Dashboard routes
router.get("/dashboard", verifyToken, getAllTables);
router.get("/dashboard/stats", verifyToken, getDashboardStats);

// Section-based routes (specific routes first)
router.get("/sections/summary", verifyToken, getSectionSummary);
router.get("/sections", verifyToken, getTableSections);
router.get("/sections/:sectionCode", verifyToken, getSectionTables);

// Table details
router.get("/:tableId", verifyToken, getTableById);
router.put("/:tableId/status", verifyToken, updateTableStatus);
router.put("/:tableId/reservation", verifyToken, updateTableReservationStatus);

// Order management
router.get("/:tableId/orders", verifyToken, getTableOrders);
router.post("/:tableId/orders", verifyToken, requireAdmin, createTableOrder);
router.get("/:tableId/orders/active", verifyToken, getActiveTableOrder);

export default router;
