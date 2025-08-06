import express from "express";
import {
  getTranslationSystemInfo,
  getLanguageSettings,
  getLanguageTranslations,
  reloadTranslations,
  getTextByKey
} from "../controllers/translationController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Translation system
router.get("/info", verifyToken, getTranslationSystemInfo);
router.get("/languages", verifyToken, getLanguageSettings);
router.get("/languages/:language", verifyToken, getLanguageTranslations);
router.get("/text/:keyPath", verifyToken, getTextByKey);

// Admin operations
router.post("/reload", verifyToken, requireAdmin, reloadTranslations);

export default router;
