import "dotenv/config";
import { sendEmail } from "./services/emailService.js";

const success = await sendEmail(
  process.env.EMAIL_USER,
  "News Alert Test",
  "Your News Alert System email test is working."
);

console.log("Email test result:", success);
process.exit(0);