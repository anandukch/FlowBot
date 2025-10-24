import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import { createAllRoutes } from "./src/routes";
import path from "path";
import { connectDatabase } from "./src/db";
import { EventEmitter } from "events";

// 🚀 Global workflow event emitter - accessible throughout the app
export const workflowEvents = new EventEmitter();

// // 🚀 Global event listeners - centralized logging and monitoring
// workflowEvents.on('workflow:escalated', (data: any) => {
//     console.log(`🚨 [GLOBAL] Workflow escalated: ${data.workflowId} for conversation: ${data.conversationId}`);
//     // TODO: Add to analytics, metrics, logging service
// });

// workflowEvents.on('workflow:approved', (data: any) => {
//     console.log(`✅ [GLOBAL] Workflow approved: ${data.workflowId}`);
//     // TODO: Update database, send notifications, trigger actions
// });

// workflowEvents.on('workflow:rejected', (data: any) => {
//     console.log(`❌ [GLOBAL] Workflow rejected: ${data.workflowId}`);
//     // TODO: Log rejection reasons, update metrics
// });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
app.use(cors({
//   origin: [
//     'https://flowbot-omega.vercel.app',
//     'http://localhost:3000',
//     'http://localhost:3001',
//     'https://flowbot.pynex.space'
//   ],
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Slack form-encoded payloads
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for the widget script
app.get("/widget.js", (req, res) => {
    res.sendFile(path.join(__dirname, "public/bot.js"));
});

// Register routes with agent-based architecture
const apiRoutes = createAllRoutes();
app.use("/api", apiRoutes);

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
