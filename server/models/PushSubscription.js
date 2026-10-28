import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscription: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ userId: 1 }, { unique: true });

const PushSubscription = mongoose.model(
  "PushSubscription",
  pushSubscriptionSchema
);

export default PushSubscription;
