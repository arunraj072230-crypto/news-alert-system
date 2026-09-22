import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    console.log("Mongo URI exists:", !!uri);
    console.log("Mongo URI starts with:", uri?.substring(0, 20));
    console.log("Mongo username:", uri?.split("://")[1]?.split(":")[0]);

    await mongoose.connect(uri);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;