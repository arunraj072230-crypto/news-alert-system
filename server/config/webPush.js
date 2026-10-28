import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  throw new Error("VAPID keys are missing from the environment variables");
}

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  publicKey,
  privateKey
);

export default webpush;
