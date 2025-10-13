import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import { ChatOpenAI } from "@langchain/openai";
import { createRoutes } from "./src/routes/routes";
import { createRoutes as createWebRoutes } from "./src/routes/web.routes";
import path from "path";
import { connectDatabase } from "./src/db";



const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: (origin, callback) => {
      // For now, we'll allow all origins. In a production environment,
      // you should replace this with a check against a whitelist of allowed origins.
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for the widget script
app.get("/widget.js", (req, res) => {
    res.sendFile(path.join(__dirname, "public/bot.js"));
});

const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    temperature: 0.7,
});

// Register routes with agent-based architecture
const apiRoutes = createRoutes(llm);
app.use("/api", apiRoutes);
app.use("/web", createWebRoutes());

connectDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 AI Agent running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error(`❌ Error connecting to database: ${error}`);
        process.exit(1);
    });
