import express from "express";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "../controllers/pushController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/subscribe", authMiddleware, savePushSubscription);
router.post("/unsubscribe", authMiddleware, removePushSubscription);
router.post("/test", authMiddleware, sendTestPush);
export default router;
