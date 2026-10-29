import express from "express";
import {
  createNotification,
  getNotifications,
  testEmail,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createNotification);

router.get("/", authMiddleware, getNotifications);

router.post("/test-email", authMiddleware, testEmail);

export default router;