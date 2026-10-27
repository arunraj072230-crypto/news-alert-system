import Preference from "../models/Preference.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "./emailService.js";

async function sendAlertToPreference(article, category, preference) {
  if (!article?.url || !preference?.email) return;

  const existingNotification = await Notification.findOne({
    articleId: article.url,
    email: preference.email,
  });

  if (existingNotification) return;

  const message =
    article.description || "New news article available.";

  const success = await sendEmail(
    preference.email,
    `News Alert: ${article.title}`,
    message
  );

  if (!success) {
    console.error(`Email failed for ${preference.email}`);
    return;
  }

  await Notification.create({
    articleId: article.url,
    email: preference.email,
    title: article.title,
    message,
    category,
    notificationType: "email",
    status: "sent",
  });

  console.log(
    `${preference.frequency} alert sent to ${preference.email}`
  );
}

export const sendNewsAlert = async (article, category) => {
  try {
    const preferences = await Preference.find({
      email: { $ne: "" },
      categories: category,
      "notificationTypes.email": true,
      frequency: "immediate",
    });

    for (const preference of preferences) {
      await sendAlertToPreference(article, category, preference);
    }
  } catch (error) {
    console.error("Immediate alert error:", error.message);
  }
};

export const sendScheduledNewsAlert = async (
  article,
  category,
  frequency,
  email
) => {
  try {
    if (!["hourly", "daily"].includes(frequency)) return;

    const preference = await Preference.findOne({
      email,
      categories: category,
      "notificationTypes.email": true,
      frequency,
    });

    if (!preference) return;

    await sendAlertToPreference(article, category, preference);
  } catch (error) {
    console.error("Scheduled alert error:", error.message);
  }
};
