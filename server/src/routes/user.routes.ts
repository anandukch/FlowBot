import { Router } from "express";
import User from "../models/user.modesl";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

export function createUserRoutes(): Router {
    const router = Router();

    // Get Slack configuration
    router.get("/slack-config", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            
            return res.json({ 
                success: true, 
                config: user.config || {},
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                }
            });
        } catch (error) {
            console.error("Get Slack config error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Update Slack configuration
    router.post("/slack-config", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            const { slackBotToken, slackBotId, slackChannel } = req.body;
            
            if (!slackBotToken || !slackBotId || !slackChannel) {
                return res.status(400).json({
                    success: false,
                    message: "All Slack configuration fields are required",
                });
            }

            user.config = { 
                ...user.config,
                slackBotToken, 
                slackBotId, 
                slackChannel 
            };
            await user.save();
            
            return res.json({ 
                success: true, 
                message: "Slack configuration saved successfully",
                config: user.config
            });
        } catch (error) {
            console.error("Update Slack config error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Get knowledge base
    router.get("/kb", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            
            return res.json({ 
                success: true, 
                kb: user.kb || {},
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                }
            });
        } catch (error) {
            console.error("Get KB error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Add/Update knowledge base
    router.post("/kb", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            const { kb } = req.body;
            
            if (!kb) {
                return res.status(400).json({
                    success: false,
                    message: "Knowledge base data is required",
                });
            }

            user.kb = kb;
            await user.save();
            
            return res.json({
                success: true,
                message: "Knowledge base updated successfully",
                kb: user.kb,
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                }
            });
        } catch (error) {
            console.error("Update KB error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Delete knowledge base
    router.delete("/kb", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            
            user.kb = "";
            await user.save();
            
            return res.json({
                success: true,
                message: "Knowledge base deleted successfully",
            });
        } catch (error) {
            console.error("Delete KB error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Get user profile and settings
    router.get("/profile", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            
            const profileData = {
                user: {
                    id: user._id,
                    email: user.email,
                    agentId: user.agentId,
                },
                hasKB: !!user.kb,
                hasSlackConfig: !!(user.config?.slackBotToken),
                settings: {
                    notifications: true, // TODO: Add user preferences
                    theme: 'light',
                    language: 'en'
                }
            };
            
            return res.json({
                success: true,
                profile: profileData,
            });
        } catch (error) {
            console.error("Get profile error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Update user settings
    router.post("/settings", authMiddleware, async (req, res) => {
        try {
            const user = (req as AuthRequest).user;
            const { settings } = req.body;
            
            // TODO: Add settings to user model
            // user.settings = { ...user.settings, ...settings };
            // await user.save();
            
            return res.json({
                success: true,
                message: "Settings updated successfully",
                settings: settings
            });
        } catch (error) {
            console.error("Update settings error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    return router;
}
