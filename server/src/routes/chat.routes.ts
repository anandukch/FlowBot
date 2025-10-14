import { Router } from "express";
import { AgentService } from "../agent";
import { MemoryService } from "../services/memory";
import { workflowEvents } from "../../index";

export function createChatRoutes(): Router {
    const router = Router();
    const memoryService = new MemoryService();
    const sseConnections = new Map();
    
    const agentService = new AgentService(memoryService, sseConnections);

    // Initialize the agent service
    let agentInitialized = false;
    const initializeAgent = async (agentId: string) => {
        if (!agentInitialized) {
            await agentService.initialize(agentId);
            agentInitialized = true;
            console.log("🤖 Agent initialized with structured chat pattern");
        }
    };

    // Main chat endpoint
    router.post("/", async (req, res) => {
        try {
            const { message, conversationId = "default", agentId } = req.body;

            if (!message) {
                return res.status(400).json({ error: "Message is required" });
            }

            let userChat: any = {};
            if (memoryService.hasUserData(conversationId)) {
                userChat = memoryService.getUserData(conversationId);
            }

            const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
            if (emailRegex.test(message)) {
                const match = message.match(emailRegex);
                if (match) {
                    userChat.email = match[0];
                    userChat.awaitingEmail = false;
                    const ack = `Thanks! We'll send updates to ${userChat.email}.`;
                    memoryService.setUserData(conversationId, {
                        email: match[0],
                        awaitingEmail: false,
                        ...userChat,
                    });
                    memoryService.addMessage(conversationId, "assistant", ack);
                    return res.json({
                        success: true,
                        response: ack,
                        conversationId,
                        email: match[0],
                    });
                } else {
                    const prompt = "Please share a valid email address (for example: name@example.com) so our support team can follow up.";
                    memoryService.addMessage(conversationId, "assistant", prompt);
                    return res.json({
                        success: false,
                        message: prompt,
                        conversationId,
                        email: null,
                        response: "Provide a valid email address.",
                    });
                }
            }
            await initializeAgent(agentId);
            const result = await agentService.invoke(message, conversationId, agentId);

            res.json({
                response: result.output,
                conversationId,
                success: result.success,
                needsEscalation: result.needsEscalation,
                escalationReason: result.escalationReason,
                ...(result.error && { error: result.error }),
            });
        } catch (error) {
            console.error("Error in chat endpoint:", error);
            res.status(500).json({
                error: "Something went wrong",
                success: false,
            });
        }
    });

    // Server-Sent Events for real-time updates
    router.get("/events/:userId", (req, res) => {
        const { userId } = req.params;

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        // Store this connection
        sseConnections.set(userId, res);

        // Remove connection on close
        req.on("close", () => {
            sseConnections.delete(userId);
        });

        // Send a ping to keep connection alive
        const pingInterval = setInterval(() => {
            if (!sseConnections.has(userId)) {
                clearInterval(pingInterval);
                return;
            }
            res.write("event: ping\ndata: {}\n\n");
        }, 30000);
    });

    function sendToUser(userId: string, data: any) {
        const connection = sseConnections.get(userId);
        if (connection) {
            connection.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    }

    // 🚀 Event-driven SSE handlers
    // Listen for workflow events and automatically send via SSE
    workflowEvents.on('workflow:escalated', (data: any) => {
        console.log('📤 Workflow escalated:', data);
        sendToUser(data.conversationId, {
            type: 'workflow_escalated',
            message: 'Your request has been escalated to our team',
            conversationId: data.conversationId
        });
    });

    workflowEvents.on('workflow:approved', (data: any) => {
        console.log('✅ Workflow approved:', data);
        sendToUser(data.conversationId, {
            type: 'workflow_approved',
            message: 'Your request has been approved!',
            response: data.response
        });
    });

    workflowEvents.on('workflow:rejected', (data: any) => {
        console.log('❌ Workflow rejected:', data);
        sendToUser(data.conversationId, {
            type: 'workflow_rejected',
            message: 'Your request was not approved',
            reason: data.reason
        });
    });

    // Health check
    router.get("/health", (req, res) => {
        res.json({
            status: "OK",
            agentInitialized,
        });
    });

    return router;
}
