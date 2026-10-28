
import PushSubscription from "../models/PushSubscription.js";
import webpush from "../config/webPush.js";


export const savePushSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return res.status(400).json({
        message: "Invalid push subscription",
      });
    }

    const savedSubscription =
      await PushSubscription.findOneAndUpdate(
        { userId },
        {
          userId,
          subscription,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      message: "Push subscription saved successfully",
      id: savedSubscription._id,
    });
  } catch (error) {
    console.error("Save push subscription error:", error.message);

    return res.status(500).json({
      message: "Failed to save push subscription",
    });
  }
};

export const sendTestPush = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedSubscription =
      await PushSubscription.findOne({ userId });

    if (!savedSubscription) {
      return res.status(404).json({
        message: "No push subscription found. Enable notifications first.",
      });
    }

    await webpush.sendNotification(
      savedSubscription.subscription,
      JSON.stringify({
        title: "News Alert System",
        body: "Push notifications are working successfully!",
        url: "/",
      })
    );

    return res.status(200).json({
      message: "Test push notification sent successfully!",
    });
  } catch (error) {
    console.error("Push notification error:", error.message);

    if (error.statusCode === 404 || error.statusCode === 410) {
      try {
        await PushSubscription.deleteOne({
          userId: req.user.id,
        });
      } catch (deleteError) {
        console.error(
          "Failed to remove expired subscription:",
          deleteError.message
        );
      }

      return res.status(410).json({
        message: "Push subscription expired. Enable notifications again.",
      });
    }

    return res.status(500).json({
      message: "Failed to send push notification",
    });
  }
};
