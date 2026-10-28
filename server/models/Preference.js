import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  categories: {
    type: [String],
    default: [],
  },

  frequency: {
    type: String,
    enum: ["immediate", "hourly", "daily"],
    default: "immediate",
  },

  notificationTypes: {
    email: {
      type: Boolean,
      default: true,
    },

    push: {
      type: Boolean,
      default: false,
    },
  },
});

preferenceSchema.index({ userId: 1 }, { unique: true });

const Preference = mongoose.model(
  "Preference",
  preferenceSchema
);

export default Preference;