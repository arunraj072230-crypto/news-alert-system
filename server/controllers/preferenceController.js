import Preference from "../models/Preference.js";

export const savePreferences = async (req, res) => {
  try {
    const { categories, frequency, email, notificationTypes } = req.body;

    if (!email || !email.trim()) {
  return res.status(400).json({
    message: "Email is required",
  });
}

const normalizedEmail = email.trim().toLowerCase();

    const preference = await Preference.findOneAndUpdate(
       { email: normalizedEmail },
  {
    email: normalizedEmail,
    categories,
    frequency,
    notificationTypes,
  },
    
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    
    res.status(200).json(preference);
  } catch (error) {
    console.error("Preference save error:", error.message);

    res.status(500).json({
      message: "Failed to save preferences",
    });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const preference = await Preference.findOne({
  email: { $ne: "" },
});

    if (!preference) {
      return res.json({
        email: "",
        frequency: "immediate",
        categories: [],
        notificationTypes: {
        email: true,
        push: false,
        },
      });
    }

    res.json(preference);
  } catch (error) {
    console.error("Get preferences error:", error.message);

    res.status(500).json({
      message: "Failed to get preferences",
    });
  }
};