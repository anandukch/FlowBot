import { Router } from "express";
import User from "../models/user.modesl";

export function createWidgetRoutes(): Router {
    const router = Router();

    // Get widget configuration by agent ID (public endpoint)
    router.get("/config/:agentId", async (req, res) => {
        try {
            const { agentId } = req.params;
            
            if (!agentId) {
                return res.status(400).json({
                    success: false,
                    message: "Agent ID is required",
                });
            }

            const user = await User.findOne({ agentId }).exec();
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Agent not found",
                });
            }
            
            return res.json({ 
                success: true, 
                config: user.widgetConfig || {},
            });
        } catch (error) {
            console.error("Get widget config error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    return router;
}
