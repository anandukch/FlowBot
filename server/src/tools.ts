import "dotenv/config";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

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
            return JSON.stringify({ status: "escalated", message: message, workflowExecutionId: workflowExecutionId });
        } catch (error: any) {
            console.error("❌ Failed to send message:", error);

            return JSON.stringify({ status: "failed", error: error.message });
        }
    },
});

export const tools: any[] = [sendChatMessageTool];
