
import dns from "node:dns";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cron from "node-cron";
import connectDB from "./config/db.js";
import newsRoutes from "./routes/newsRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import Preference from "./models/Preference.js";
import { sendScheduledNewsAlert } from "./services/alertService.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

dns.setServers(["8.8.8.8", "1.1.1.1"]);

app.use("/api/news", newsRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("News Alert Server is running");
});

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Dashboard disconnected:", socket.id);
  });
});

async function runNewsScheduler(frequency) {
  try {
    console.log(`${frequency} news scheduler started`);

    const preferences = await Preference.find({
      frequency,
      email: { $ne: "" },
      categories: { $exists: true, $ne: [] },
      "notificationTypes.email": true,
    });

    for (const preference of preferences) {
      for (const category of preference.categories || []) {
        const response = await fetch(
          `http://localhost:${PORT}/api/news?category=${encodeURIComponent(category)}&skipAlerts=true`
        );

        if (!response.ok) {
          console.error("News fetch failed:", category);
          continue;
        }

        const data = await response.json();
        const articles = data.articles || [];

        for (const article of articles.slice(0, 5)) {
          await sendScheduledNewsAlert(
            article,
            category,
            frequency,
            preference.email
          );
        }
      }
    }
  } catch (error) {
    console.error(`${frequency} scheduler error:`, error.message);
  }
}

// Hourly: every hour at minute 00 (India time)
cron.schedule("0 * * * *", () => {
  runNewsScheduler("hourly");
}, {
  timezone: "Asia/Kolkata",
});

// Daily: every day at 8:00 AM (India time)
cron.schedule("0 8 * * *", () => {
  runNewsScheduler("daily");
}, {
  timezone: "Asia/Kolkata",
});
 
async function startServer() {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
}

startServer();
