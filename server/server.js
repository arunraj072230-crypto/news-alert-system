import dns from "node:dns";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cron from "node-cron";
import connectDB from "./config/db.js";
import Preference from "./models/Preference.js";
import newsRoutes from "./routes/newsRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import {
  sendNewsAlert,
  sendScheduledNewsAlert,
  sendNewsPushSummary,
} from "./services/alertService.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.status(200).send("News Alert Server is running");
});

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Dashboard disconnected:", socket.id);
  });
});

let immediateNewsCheckRunning = false;
let scheduledNewsCheckRunning = false;

async function fetchNewsForCategory(category) {
  const url =
    `http://127.0.0.1:${PORT}/api/news` +
    `?category=${encodeURIComponent(category)}&skipAlerts=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `News API returned ${response.status} for ${category}`
    );
  }

  const data = await response.json();
  return Array.isArray(data.articles) ? data.articles : [];
}

async function runImmediateNewsChecks() {
  if (immediateNewsCheckRunning) {
    console.log("Immediate check skipped: previous check is running");
    return;
  }

  immediateNewsCheckRunning = true;

  try {
    const preferences = await Preference.find({
      frequency: "immediate",
      categories: { $exists: true, $ne: [] },
      $or: [
        { "notificationTypes.push": true },
        { "notificationTypes.email": true },
      ],
    }).select("categories");

    const categories = [
      ...new Set(
        preferences.flatMap((preference) => preference.categories || [])
      ),
    ];

    if (categories.length === 0) {
      console.log("Immediate check: no matching preferences");
      return;
    }

    for (const category of categories) {
      try {
        const articles = await fetchNewsForCategory(category);

        console.log(
          `Immediate check: ${category}, ${articles.length} articles`
        );

        if (articles.length === 0) continue;

        await sendNewsPushSummary(
          articles,
          category,
          "immediate"
        );

        await sendNewsAlert(articles[0], category);
      } catch (error) {
        console.error(
          `Immediate news check failed for ${category}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("Immediate scheduler error:", error.message);
  } finally {
    immediateNewsCheckRunning = false;
  }
}

async function runNewsScheduler(frequency) {
  if (scheduledNewsCheckRunning) {
    console.log(
      `${frequency} check skipped: another scheduled check is running`
    );
    return;
  }

  scheduledNewsCheckRunning = true;

  try {
    console.log(`${frequency} news scheduler started`);

    const preferences = await Preference.find({
      frequency,
      categories: { $exists: true, $ne: [] },
      $or: [
        { "notificationTypes.email": true },
        { "notificationTypes.push": true },
      ],
    });

    const categories = [
      ...new Set(
        preferences.flatMap((preference) => preference.categories || [])
      ),
    ];

    if (categories.length === 0) {
      console.log(`${frequency}: no matching preferences`);
      return;
    }

    for (const category of categories) {
      try {
        const articles = await fetchNewsForCategory(category);

        console.log(
          `${frequency} check: ${category}, ${articles.length} articles`
        );

        if (articles.length === 0) continue;

        const matchingPreferences = preferences.filter(
          (preference) =>
            preference.categories.includes(category) &&
            preference.notificationTypes?.email === true
        );

        for (const preference of matchingPreferences) {
          for (const article of articles.slice(0, 5)) {
            await sendScheduledNewsAlert(
              article,
              category,
              frequency,
              preference.email
            );
          }
        }

        await sendNewsPushSummary(
          articles,
          category,
          frequency
        );
      } catch (error) {
        console.error(
          `${frequency} check failed for ${category}:`,
          error.message
        );
      }
    }

    console.log(`${frequency} news scheduler finished`);
  } catch (error) {
    console.error(
      `${frequency} scheduler error:`,
      error.message
    );
  } finally {
    scheduledNewsCheckRunning = false;
  }
}

cron.schedule("*/5 * * * *", () => {
  runImmediateNewsChecks();
});

cron.schedule("0 * * * *", () => {
  runNewsScheduler("hourly");
});

cron.schedule("0 8 * * *", () => {
  runNewsScheduler("daily");
});

async function startServer() {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Immediate news check: every 5 minutes");
      console.log("Hourly news check: every hour");
      console.log("Daily news check: 8:00 AM Asia/Kolkata");
      runImmediateNewsChecks();
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();
