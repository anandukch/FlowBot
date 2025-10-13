import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {});
    console.log("📦 Connected to database");
  } catch (error) {
    console.error(`❌ Error connecting to database: ${error}`);
    process.exit(1);
  }
};
