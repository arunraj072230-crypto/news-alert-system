import Notification from "../models/Notification.js";
import { sendEmail } from "../services/emailService.js";

export const createNotification = async (req, res) => {
  try {
    const {
      email,
      title,
      message,
      category,
      notificationType,
      status,
    } = req.body;

    const notification = await Notification.create({
      email,
      title,
      message,
      category,
      notificationType,
      status,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error(
      "Notification creation error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create notification",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error(
      "Get notifications error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to get notifications",
    });
  }
};

export const testEmail = async (req, res) => {
  try {
    const { to } = req.body;

    await sendEmail(
      to,
      "News Alert Test",
      "This is a test email from your News Alert System."
    );

    res.status(200).json({
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Test email error:", error.message);

    res.status(500).json({
      message: "Failed to send test email",
    });
  }
};