import Preference from "../models/Preference.js";
import Notification from "../models/Notification.js";
import PushSubscription from "../models/PushSubscription.js";
import { sendEmail } from "./emailService.js";
import webpush from "../config/webPush.js";

async function sendEmailAlert(article, category, preference) {
  if (!article?.url || !preference?.email) return;

  const alreadySent = await Notification.exists({
    articleId: article.url,
    email: preference.email,
    notificationType: "email",
  });

  if (alreadySent) return;

  const success = await sendEmail(
    preference.email,
    `News Alert: ${article.title || "New article"}`,
    article.description || "New news article available."
  );

  if (!success) {
    console.error(`Email failed for ${preference.email}`);
    return;
  }

  await Notification.create({
    articleId: article.url,
    email: preference.email,
    title: article.title || "New article",
    message: article.description || "",
    category,
    notificationType: "email",
    status: "sent",
  });

  console.log(
    `${preference.frequency} email alert sent to ${preference.email}`
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
      try {
        await sendEmailAlert(article, category, preference);
      } catch (error) {
        console.error(
          `Immediate email alert failed for ${preference.email}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("Immediate email alert error:", error.message);
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

    if (preference) {
      await sendEmailAlert(article, category, preference);
    }
  } catch (error) {
    console.error(
      `Scheduled ${frequency} email alert failed for ${email}:`,
      error.message
    );
  }
};

export const sendNewsPushSummary = async (
  articles,
  category,
  frequency = "immediate"
) => {
  try {
    if (!["immediate", "hourly", "daily"].includes(frequency)) {
      console.error(`Unsupported push frequency: ${frequency}`);
      return;
    }

    if (!Array.isArray(articles) || articles.length === 0) {
      console.log(`Push skipped for ${category}: no articles`);
      return;
    }

    const preferences = await Preference.find({
      email: { $ne: "" },
      categories: category,
      "notificationTypes.push": true,
      frequency,
    });

    console.log(
      `${frequency} push check: category=${category}, ` +
        `articles=${articles.length}, users=${preferences.length}`
    );

    for (const preference of preferences) {
      try {
        const savedSubscription = await PushSubscription.findOne({
          userId: preference.userId,
        });

        if (!savedSubscription) {
          console.log(`No push subscription for ${preference.email}`);
          continue;
        }

        const newArticles = [];

        for (const article of articles) {
          if (!article?.url) continue;

          const alreadySent = await Notification.exists({
            articleId: article.url,
            email: preference.email,
            notificationType: "push",
          });

          if (!alreadySent) {
            newArticles.push(article);
          }
        }

        if (newArticles.length === 0) {
          console.log(`No new articles for ${preference.email}`);
          continue;
        }

        const headlines = newArticles
          .slice(0, 5)
          .map((article) => article.title)
          .filter(Boolean);

        const title =
          `${newArticles.length} new ${category} article` +
          (newArticles.length === 1 ? "" : "s");

        const body =
          headlines.join(" • ") ||
          "Open News Alert System to read the latest news.";

        try {
          await webpush.sendNotification(
            savedSubscription.subscription,
            JSON.stringify({
              title,
              body,
              url: "/",
              category,
              frequency,
            })
          );
        } catch (pushError) {
          if (
            pushError.statusCode === 404 ||
            pushError.statusCode === 410
          ) {
            await PushSubscription.deleteOne({
              _id: savedSubscription._id,
            });
          }

          console.error(
            `Push notification failed for ${preference.email}:`,
            pushError.statusCode || "",
            pushError.message
          );
          continue;
        }

        await Notification.insertMany(
          newArticles.map((article) => ({
            articleId: article.url,
            email: preference.email,
            title: article.title || "New article",
            message: article.description || "",
            category,
            notificationType: "push",
            status: "sent",
          }))
        );

        console.log(
          `${frequency} push summary sent to ${preference.email}: ` +
            `${newArticles.length} articles`
        );
      } catch (error) {
        console.error(
          `${frequency} push summary failed for ${preference.email}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      `${frequency} push summary error:`,
      error.message
    );
  }
};
