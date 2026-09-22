import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema({
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

const Preference = mongoose.model(
  "Preference",
  preferenceSchema
);

export default Preference;