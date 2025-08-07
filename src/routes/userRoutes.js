import express from "express";
import {createUser, getAllUsers, getUserById, deleteUser, loginUser, logoutUser, updateOwnCredentials, adminUpdateCredentials, refreshToken, createAdminBypass} from "../controllers/userController.js";
import { validateUser, validateLogin, validateUpdateOwnCredentials, validateAdminUpdateCredentials } from "../middlewares/inputValidator.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Public routes
router.post("/login", validateLogin, loginUser);
router.post('/logout', logoutUser);

// Temporary admin bypass route - REMOVE AFTER SETUP!
router.post("/admin-bypass", createAdminBypass);

// Temporary debug route - REMOVE AFTER TESTING!
router.post("/debug-login", (req, res) => {
  console.log("Debug login body:", req.body);
  res.json({ received: req.body, message: "Debug endpoint working" });
});

// Token refresh route
router.post('/refresh', verifyToken, refreshToken);

// Protected routes (admin only)
router.post("/register", verifyToken, requireAdmin, validateUser, createUser);
router.post("/", verifyToken, requireAdmin, validateUser, createUser);
router.get("/", verifyToken, requireAdmin, getAllUsers);
router.get("/:id", verifyToken, requireAdmin, getUserById);
router.put("/:id", verifyToken, requireAdmin, validateAdminUpdateCredentials, adminUpdateCredentials);
router.delete("/:id", verifyToken, requireAdmin, deleteUser);

// User self-update route
router.put("/profile", verifyToken, validateUpdateOwnCredentials, updateOwnCredentials);

export default router;
