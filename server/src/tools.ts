import "dotenv/config";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { workflowEvents } from "../index";

export const sendChatMessageTool = new DynamicStructuredTool({
    name: "send_chat_message",
    description: "Tool to escale chat to customer support, required inputs are user's message and workflowExecutionId",
    schema: z.object({
        message: z.string(),
        workflowExecutionId: z.string(),
    }),
    func: async ({ message, workflowExecutionId }) => {
        console.log("💬 Sending chat message:", message, workflowExecutionId);
        try {
            // Generate unique workflow ID
            const workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            
            // 🚀 NEW: Emit event instead of direct action
            workflowEvents.emit('workflow:escalated', {
                workflowId,
                conversationId: workflowExecutionId,
                originalMessage: message,
                timestamp: new Date().toISOString()
            });
            
            // TODO: Send to Slack with interactive buttons
            // await sendSlackApprovalMessage(workflowId, message);
            
            return JSON.stringify({ 
                status: "escalated", 
                workflowId,
                message: message, 
                workflowExecutionId: workflowExecutionId 
            });
        } catch (error: any) {
            console.error("❌ Failed to send message:", error);
            return JSON.stringify({ status: "failed", error: error.message });
        }
    },
});

export const tools: any[] = [sendChatMessageTool];
