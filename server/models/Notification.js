import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {

    articleId: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
    },

    notificationType: {
      type: String,
      enum: ["email", "push"],
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;