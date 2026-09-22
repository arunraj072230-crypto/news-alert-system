import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import newsRoutes from "./routes/newsRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";



const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

connectDB();

app.use("/api/news", newsRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("News Alert Server is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});