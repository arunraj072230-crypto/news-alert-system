import Preference from "../models/Preference.js";

const ALLOWED_FREQUENCIES = ["immediate", "hourly", "daily"];
const ALLOWED_CATEGORIES = [
  "technology", "sports", "business", "politics",
  "science", "health", "entertainment",
];

export const savePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categories, frequency, email, notificationTypes } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (frequency && !ALLOWED_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ message: "Invalid alert frequency" });
    }
    if (categories && (!Array.isArray(categories) || categories.some((item) => !ALLOWED_CATEGORIES.includes(item)))) {
      return res.status(400).json({ message: "One or more news categories are invalid" });
    }
    if (notificationTypes && (typeof notificationTypes.email !== "boolean" || typeof notificationTypes.push !== "boolean")) {
      return res.status(400).json({ message: "Invalid notification settings" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const preference = await Preference.findOneAndUpdate(
      { userId },
      {
        $set: {
          email: normalizedEmail,
          categories: categories || [],
          frequency: frequency || "immediate",
          notificationTypes: notificationTypes || { email: true, push: false },
        },
        $setOnInsert: { userId },
      },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    return res.status(200).json(preference);
  } catch (error) {
    console.error("Preference save error:", error.message);
    return res.status(500).json({ message: "Failed to save preferences" });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preference = await Preference.findOne({ userId });
    if (!preference) {
      return res.json({
        userId, email: req.user.email || "", frequency: "immediate",
        categories: [], notificationTypes: { email: true, push: false },
      });
    }
    return res.json(preference);
  } catch (error) {
    console.error("Get preferences error:", error.message);
    return res.status(500).json({ message: "Failed to get preferences" });
  }
};
