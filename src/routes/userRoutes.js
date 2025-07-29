import express from "express";
import {createUser, getAllUsers, getUserById, updateUser, deleteUser, loginUser, logoutUser} from "../controllers/userController.js";
import { validateUser, validateLogin } from "../middlewares/inputValidator.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Public routes (kimlik doğrulama gerektirmez)
router.post("/auth/login", validateLogin, loginUser);
router.post("/auth/register", validateUser, createUser);
router.post('/auth/logout', logoutUser);

// Protected routes (JWT token + Admin yetkisi gerektirir)
router.post("/users", verifyToken, requireAdmin, validateUser, createUser); // Admin user creation
router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.get("/users/:id", verifyToken, requireAdmin, getUserById);
router.put("/users/:id", verifyToken, requireAdmin, validateUser, updateUser);
router.delete("/users/:id", verifyToken, requireAdmin, deleteUser);

export default router;
