import { Router } from "express";
import { workflowEvents } from "../../index";

export function createWebhookRoutes(): Router {
    const router = Router();

    // Webhook for Slack responses (human approvals)
    router.post("/slack", async (req, res) => {
        try {
            const { action, conversationId, response, approver } = req.body;
            
            console.log('📥 Slack webhook received:', { action, conversationId });
            
            if (!action || !conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "Action and conversationId are required",
                });
            }
            
            // Emit event instead of directly calling sendToUser
            if (action === 'approve') {
                workflowEvents.emit('workflow:approved', {
                    conversationId,
                    response: response || 'Approved by team',
                    approver: approver || 'Unknown',
                    timestamp: new Date().toISOString()
                });
            } else if (action === 'reject') {
                workflowEvents.emit('workflow:rejected', {
                    conversationId,
                    reason: response || 'Rejected by team',
                    approver: approver || 'Unknown',
                    timestamp: new Date().toISOString()
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid action. Must be 'approve' or 'reject'",
                });
            }
            
            return res.json({ 
                success: true,
                message: `Workflow ${action}d successfully`
            });
        } catch (error) {
            console.error("Slack webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Webhook for email responses
    router.post("/email", async (req, res) => {
        try {
            const { action, conversationId, response, approver, token } = req.body;
            
            console.log('📧 Email webhook received:', { action, conversationId });
            
            // TODO: Verify token for security
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or missing token",
                });
            }
            
            if (!action || !conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "Action and conversationId are required",
                });
            }
            
            if (action === 'approve') {
                workflowEvents.emit('workflow:approved', {
                    conversationId,
                    response: response || 'Approved via email',
                    approver: approver || 'Email User',
                    timestamp: new Date().toISOString()
                });
            } else if (action === 'reject') {
                workflowEvents.emit('workflow:rejected', {
                    conversationId,
                    reason: response || 'Rejected via email',
                    approver: approver || 'Email User',
                    timestamp: new Date().toISOString()
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid action. Must be 'approve' or 'reject'",
                });
            }
            
            return res.json({ 
                success: true,
                message: `Workflow ${action}d successfully`
            });
        } catch (error) {
            console.error("Email webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Generic webhook for external systems
    router.post("/external", async (req, res) => {
        try {
            const { action, conversationId, response, approver, apiKey } = req.body;
            
            console.log('🔗 External webhook received:', { action, conversationId });
            
            // TODO: Verify API key
            if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid API key",
                });
            }
            
            if (!action || !conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "Action and conversationId are required",
                });
            }
            
            if (action === 'approve') {
                workflowEvents.emit('workflow:approved', {
                    conversationId,
                    response: response || 'Approved by external system',
                    approver: approver || 'External System',
                    timestamp: new Date().toISOString()
                });
            } else if (action === 'reject') {
                workflowEvents.emit('workflow:rejected', {
                    conversationId,
                    reason: response || 'Rejected by external system',
                    approver: approver || 'External System',
                    timestamp: new Date().toISOString()
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid action. Must be 'approve' or 'reject'",
                });
            }
            
            return res.json({ 
                success: true,
                message: `Workflow ${action}d successfully`
            });
        } catch (error) {
            console.error("External webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Health check for webhooks
    router.get("/health", (req, res) => {
        return res.json({
            success: true,
            message: "Webhook service is healthy",
            timestamp: new Date().toISOString()
        });
    });

    return router;
}
