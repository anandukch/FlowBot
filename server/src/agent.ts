import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { tools } from "./tools";
import { MemoryService } from "./services/memory";

export interface AgentResult {
    output: string;
    intermediateSteps: any[];
    success: boolean;
    error?: string;
}

import { SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { SystemMessage } from "@langchain/core/messages";
import userModel from "./models/user.modesl";

export const buildCustomPrompt = async (KB: any) => {
    const basePrompt = await pull<ChatPromptTemplate>("hwchase17/structured-chat-agent");

    return ChatPromptTemplate.fromMessages([
        new SystemMessage(
            `You are a customer service agent for ${KB?.store?.name} (${KB?.store?.domain}).
            Only use the information provided in the Knowledge Base (KB) JSON below.
            
            Knowledge Base (KB):
            ${JSON.stringify(KB, null, 2)}

        Tool Use Instructions:
         - Use 'send_chat_message' tool to send a message to customer support ONLY if you think we need to escalate the chat to customer support. (Otherwise don't use this tool)
         `
        ),
        ...basePrompt.promptMessages,
    ]);
};

export class AgentService {
    private agentExecutor: AgentExecutor | null = null;
    // private memoryService: MemoryService;

    constructor(private llm: any, private memoryService: MemoryService, private sseConnections: Map<string, any>) {}

    async initialize(agentId: string) {
        try {
            const user = await userModel.findOne({ agentId }).exec();
            if (!user) {
                throw new Error("User not found");
            }
            const KB = user.kb;
            // Pull the structured chat agent prompt from the hub
            const prompt = await buildCustomPrompt(KB);

            // Create the structured chat agent
            const agent = await createStructuredChatAgent({
                llm: this.llm,
                tools,
                prompt,
            });

            // Create the agent executor
            this.agentExecutor = new AgentExecutor({
                agent,
                tools,
                verbose: true,
                maxIterations: 5,
                returnIntermediateSteps: true,
            });

            console.log("🤖 Agent initialized successfully");
        } catch (error) {
            console.error("Failed to initialize agent:", error);
            throw error;
        }
    }

    async invoke(input: string, conversationId: string = "default", agentId?: string): Promise<AgentResult> {
        if (!this.agentExecutor) {
            throw new Error("Agent not initialized. Call initialize() first.");
        }

        try {
            if (!this.memoryService.hasUserData(conversationId)) {
                throw new Error("No user data found for conversationId: " + conversationId);
            }
            // Add user message to conversation history
            this.memoryService.addMessage(conversationId, "user", input);

            // Get conversation history for context
            const history = this.memoryService.getConversationHistory(conversationId);

            // Create input with history context
            const userChat = this.memoryService.getUserData(conversationId);
            const agentInput = history
                ? `Previous conversation:\n${history} \n\nCurrent message: ${input}`
                : input;

            // Execute the agent
            const result = await this.agentExecutor.invoke({
                input: agentInput,
            });

            // If escalated then add to messages
            console.log("Intermediate steps:", result.intermediateSteps);

            for (const step of result.intermediateSteps) {
                if (step.action.tool === "send_chat_message") {
                    try {
                        const toolOutput = JSON.parse(step.observation);
                        console.log("Tool output:", toolOutput);
                        if (toolOutput.status === "escalated") {
                            const data = {
                                type: "new_message",
                                role: "assistant",
                                isSupport: true, // Mark as support message
                                content: "Provide your email address and we will get back to you.",
                                timestamp: new Date().toISOString(),
                            };
                            const connection = this.sseConnections.get(conversationId);
                            if (connection) {
                                connection.write(`data: ${JSON.stringify(data)}\n\n`);
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing tool output:", error);
                    }
                }
            }

            // Add assistant response to conversation history
            this.memoryService.addMessage(conversationId, "assistant", result.output);

            return {
                output: result.output,
                intermediateSteps: result.intermediateSteps || [],
                success: true,
            };
        } catch (error) {
            console.error("Agent execution error:", error);
            return {
                output: "I apologize, but I encountered an error while processing your request. Please try again.",
                intermediateSteps: [],
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}
