import { Router } from "express";
import { MemoryService } from "../services/memory";
import authMiddleware from "../middlewares/authMiddleware";

export function createConversationRoutes(): Router {
    const router = Router();
    const memoryService = new MemoryService();

    // Get conversation history
    router.get("/:conversationId", authMiddleware(), async (req, res) => {
        try {
            const { conversationId } = req.params;
            const messages = await memoryService.getConversationMessages(conversationId);
            
            res.json({
                success: true,
                conversationId,
                messages,
                count: messages.length
            });
        } catch (error) {
            console.error("Error getting conversation:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation"
            });
        }
    });

    // Get conversations by email
    router.get("/email/:email", authMiddleware(), async (req, res) => {
        try {
            const { email } = req.params;
            const { limit = 10 } = req.query;
            
            const conversations = await memoryService.getConversationsByEmail(
                email, 
                parseInt(limit as string)
            );
            
            res.json({
                success: true,
                email,
                conversations,
                count: conversations.length
            });
        } catch (error) {
            console.error("Error getting conversations by email:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversations by email"
            });
        }
    });

    // Get agent's conversations
    router.get("/agent/:agentId", authMiddleware(), async (req, res) => {
        try {
            const { agentId } = req.params;
            const { limit = 10 } = req.query;
            
            const conversations = await memoryService.getAgentConversations(
                agentId, 
                parseInt(limit as string)
            );
            
            res.json({
                success: true,
                agentId,
                conversations,
                count: conversations.length
            });
        } catch (error) {
            console.error("Error getting agent conversations:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get agent conversations"
            });
        }
    });

    // Delete conversation
    router.delete("/:conversationId", authMiddleware(), async (req, res) => {
        try {
            const { conversationId } = req.params;
            const deleted = await memoryService.deleteConversation(conversationId);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: "Conversation deleted successfully"
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: "Conversation not found"
                });
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete conversation"
            });
        }
    });

    // Get conversation statistics
    router.get("/stats/overview", authMiddleware(), async (req, res) => {
        try {
            const stats = await memoryService.getConversationStats();
            
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error("Error getting conversation stats:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get conversation statistics"
            });
        }
    });

    return router;
}
