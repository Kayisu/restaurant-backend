import express from "express";
import {createUser, getAllUsers, getUserById, deleteUser, loginUser, logoutUser, updateOwnCredentials, adminUpdateCredentials, refreshToken} from "../controllers/userController.js";
import { validateUser, validateLogin, validateUpdateOwnCredentials, validateAdminUpdateCredentials } from "../middlewares/inputValidator.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Public routes (kimlik doğrulama gerektirmez)
router.post("/auth/login", validateLogin, loginUser);
router.post('/auth/logout', logoutUser);

// Token refresh route (any authenticated user)
router.post('/auth/refresh', verifyToken, refreshToken);

// Protected routes (JWT token + Admin yetkisi gerektirir)
router.post("/auth/register", verifyToken, requireAdmin, validateUser, createUser);
router.post("/users", verifyToken, requireAdmin, validateUser, createUser); // Admin user creation
router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.get("/users/:id", verifyToken, requireAdmin, getUserById);
router.put("/users/:id", verifyToken, requireAdmin, validateAdminUpdateCredentials, adminUpdateCredentials); // Admin updates any user's credentials
router.delete("/users/:id", verifyToken, requireAdmin, deleteUser);

// User self-update route
router.put("/profile", verifyToken, validateUpdateOwnCredentials, updateOwnCredentials); // User updates own credentials

export default router;
