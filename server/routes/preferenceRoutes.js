import express from "express";
import { savePreferences, getPreferences, } from "../controllers/preferenceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, savePreferences);
router.get("/", authMiddleware,  getPreferences);

export default router;