import Preference from "../models/Preference.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "./emailService.js";

export const sendNewsAlert = async (article, category) => {
  try {
    const preferences = await Preference.find();

    for (const preference of preferences) {
      const emailEnabled =
        preference.notificationTypes?.email === true;

      const categorySelected =
        preference.categories?.includes(category);

      if (!preference.email ||!emailEnabled || !categorySelected) {
        continue;
      }
   
      
      const existingNotification = await Notification.findOne({
        articleId: article.url,
          email: preference.email,
           });

        if (existingNotification) {
  continue;
          }
      
      await sendEmail(
        preference.email,
        `News Alert: ${article.title}`,
        article.description || "New news article available."
      );

      await Notification.create({
         articleId: article.url,
        email: preference.email,
        title: article.title,
        message:
          article.description ||
          "New news article available.",
        category: category,
        notificationType: "email",
        status: "sent",
      });

      console.log(
        `News alert sent to ${preference.email}`
      );
    }
  } catch (error) {
    console.error(
      "News alert error:",
      error.message
    );
  }
};