import { Router } from "express";
import { createChatRoutes } from "./chat.routes";
import { createAuthRoutes } from "./auth.routes";
import { createUserRoutes } from "./user.routes";
import { createWebhookRoutes } from "./webhook.routes";

export function createAllRoutes(): Router {
    const router = Router();

    // Mount all route modules with clear prefixes
    router.use("/chat", createChatRoutes());        // Chat and SSE endpoints
    router.use("/auth", createAuthRoutes());        // Authentication endpoints
    router.use("/user", createUserRoutes());        // User settings and configuration
    router.use("/webhook", createWebhookRoutes());  // Webhook endpoints

    // Root health check
    router.get("/health", (req, res) => {
        res.json({
            success: true,
            message: "API is healthy",
            timestamp: new Date().toISOString(),
            services: {
                chat: "✅ Active",
                auth: "✅ Active", 
                user: "✅ Active",
                webhooks: "✅ Active"
            }
        });
    });

    // API documentation endpoint
    router.get("/", (req, res) => {
        res.json({
            success: true,
            message: "Human-in-Loop Orchestration API",
            version: "1.0.0",
            endpoints: {
                chat: {
                    "POST /api/chat/chat": "Send chat message",
                    "GET /api/chat/events/:userId": "SSE connection for real-time updates",
                    "GET /api/chat/health": "Chat service health check"
                },
                auth: {
                    "POST /api/auth/signin": "User sign in",
                    "POST /api/auth/signup": "User sign up", 
                    "POST /api/auth/signout": "User sign out",
                    "GET /api/auth/me": "Get current user"
                },
                user: {
                    "GET /api/user/kb": "Get knowledge base",
                    "POST /api/user/kb": "Update knowledge base",
                    "DELETE /api/user/kb": "Delete knowledge base",
                    "GET /api/user/slack-config": "Get Slack configuration",
                    "POST /api/user/slack-config": "Update Slack configuration",
                    "GET /api/user/profile": "Get user profile and settings",
                    "POST /api/user/settings": "Update user settings"
                },
                webhooks: {
                    "POST /api/webhook/slack": "Slack approval webhook",
                    "POST /api/webhook/email": "Email approval webhook",
                    "POST /api/webhook/external": "External system webhook",
                    "GET /api/webhook/health": "Webhook service health"
                }
            }
        });
    });

    return router;
}

// Legacy exports for backward compatibility
export { createChatRoutes as createRoutes } from "./chat.routes";
export { createUserRoutes as createWebRoutes } from "./user.routes";
