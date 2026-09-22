import express from "express";
import {
  createNotification,
  getNotifications,
  testEmail,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/", createNotification);
router.get("/", getNotifications);
router.post("/test-email", testEmail);

export default router;