import Groq from "groq-sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { MemoryService } from "./services/memory";
import userModel from "./models/user.modesl";
import { workflowEvents } from "../index";

export interface AgentResult {
    output: string;
    needsEscalation: boolean;
    escalationReason?: string;
    success: boolean;
    error?: string;
}

// Groq configuration
const GROQ_CONFIG = {
    MODEL: "meta-llama/llama-4-scout-17b-16e-instruct",
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.3,
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
};

// Response schema for structured output
const agentResponseSchema = z.object({
    response: z.string().describe("The response to send to the user"),
    needsEscalation: z.boolean().describe("Whether this conversation needs to be escalated to human support"),
    escalationReason: z.string().optional().describe("Reason for escalation if needsEscalation is true"),
    confidence: z.number().min(0).max(1).describe("Confidence level in the response (0-1)")
});

const generateSystemPrompt = (KB: any): string => {
    return `You are a customer service agent for ${KB?.store?.name || 'our company'} (${KB?.store?.domain || 'our website'}).

IMPORTANT: Only use the information provided in the Knowledge Base (KB) below to answer questions.

Knowledge Base (KB):
${JSON.stringify(KB, null, 2)}

RESPONSE GUIDELINES:
1. If you can answer the question using the KB information, provide a helpful response
2. If the question is outside your KB knowledge, set needsEscalation to true
3. If the user seems frustrated or needs complex help, set needsEscalation to true
4. Always be polite, professional, and helpful
5. Keep responses concise but informative

ESCALATION CRITERIA & RESPONSES:
When escalating, provide a user-friendly message explaining what happens next:

- Question not covered in KB → "I don't have specific information about that in my knowledge base. I've forwarded your question to our customer support team who will get back to you with detailed information soon."

- User requests human support → "I've connected you with our customer support team. They'll reach out to you shortly to provide personalized assistance."

- Complex technical issues → "This seems like a technical matter that requires specialized attention. I've escalated your case to our technical support team who will contact you with a solution."

- Billing/payment issues → "For billing and payment matters, I've transferred your request to our billing department. They'll review your account and get back to you with assistance."

- Complaints or frustrated customers → "I understand your concern and want to ensure you get the best possible help. I've escalated your case to our customer support manager who will personally address your issue."

- Refund requests → "I've forwarded your refund request to our customer service team. They'll review your case and contact you with the next steps."

- Account-specific issues → "For account-related matters, I've directed your request to our account specialists who will assist you with secure access to your information."

You must respond with a JSON object containing:
- response: Your message to the user
- needsEscalation: boolean (true if human support needed)
- escalationReason: string (if escalation needed, explain why)
- confidence: number (0-1, how confident you are in your response)`;
};

export class AgentService {
    private client: Groq | null = null;
    private userKB: any = null;

    constructor(private memoryService: MemoryService, private sseConnections: Map<string, any>) {}

    async initialize(agentId: string) {
        try {
            const user = await userModel.findOne({ agentId }).exec();
            if (!user) {
                throw new Error("User not found");
            }
            
            this.userKB = user.kb;
            
            // Initialize Groq client
            this.client = new Groq({
                apiKey: process.env.GROQ_API_KEY,
                timeout: GROQ_CONFIG.TIMEOUT,
                maxRetries: GROQ_CONFIG.MAX_RETRIES,
            });

            console.log("🤖 Groq Agent initialized successfully");
        } catch (error) {
            throw error;
        }
    }

    async invoke(input: string, conversationId: string = "default", agentId?: string): Promise<AgentResult> {
        if (!this.client) {
            throw new Error("Agent not initialized. Call initialize() first.");
        }

        try {
            // if (!this.memoryService.hasUserData(conversationId)) {
            //     throw new Error("No user data found for conversationId: " + conversationId);
            // }

            await this.memoryService.addMessage(conversationId, "user", input, agentId);

            const history = await this.memoryService.getConversationHistory(conversationId);
            
            const contextMessage = history
                ? `Previous conversation:\n${history}\n\nCurrent message: ${input}`
                : input;

            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: generateSystemPrompt(this.userKB),
                    },
                    { 
                        role: 'user', 
                        content: contextMessage 
                    },
                ],
                model: GROQ_CONFIG.MODEL,
                max_tokens: GROQ_CONFIG.MAX_TOKENS,
                temperature: GROQ_CONFIG.TEMPERATURE,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'agentResponse',
                        schema: zodToJsonSchema(agentResponseSchema),
                    },
                },
            });

            const responseContent = completion.choices[0]?.message?.content;
            if (!responseContent) {
                throw new Error("No response from Groq");
            }

            const parsedResponse = JSON.parse(responseContent);
            const validatedResponse = agentResponseSchema.parse(parsedResponse);

            await this.memoryService.addMessage(conversationId, "assistant", validatedResponse.response);
            if (validatedResponse.needsEscalation) {
                await this.handleEscalation(conversationId, input, validatedResponse.escalationReason || "User needs human support");
            }

            return {
                output: validatedResponse.response,
                needsEscalation: validatedResponse.needsEscalation,
                escalationReason: validatedResponse.escalationReason,
                success: true,
            };

        } catch (error) {
            console.error("Error invoking Groq agent:", error);
            return {
                output: "I'm sorry, I encountered an error. Please try again or contact our support team.",
                needsEscalation: false,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    private async handleEscalation(conversationId: string, originalMessage: string, reason: string) {
        try {
            // Generate unique workflow ID
            const workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            
            console.log(`🚨 Escalating conversation ${conversationId}: ${reason}`);
            
            // Get conversation to check if user provided email
            const conversation = await this.memoryService.getConversationById(conversationId);
            const hasEmail = conversation?.config?.email;
            
            // Create user-friendly escalation message
            let escalationMessage = "Your request has been successfully forwarded to our customer support team. ";
            
            if (hasEmail) {
                escalationMessage += "We'll send you updates via email as soon as we have more information. ";
            } else {
                escalationMessage += "If you'd like to receive updates, please share your email address and we'll keep you informed. ";
            }
            
            escalationMessage += "Thank you for your patience!";
            
            // Emit escalation event
            workflowEvents.emit('workflow:escalated', {
                workflowId,
                conversationId,
                originalMessage,
                escalationReason: reason,
                timestamp: new Date().toISOString(),
                hasEmail: !!hasEmail
            });

            // Add user-friendly escalation message to conversation
            await this.memoryService.addMessage(
                conversationId, 
                "assistant", 
                escalationMessage
            );

        } catch (error) {
            console.error("Error handling escalation:", error);
        }
    }
}
