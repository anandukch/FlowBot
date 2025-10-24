import Conversation, { IConversation, IMessage } from "../models/conversation.model";

export interface SimpleMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export class ConversationService {
    private maxMessages: number = 20;

    constructor(maxMessages: number = 20) {
        this.maxMessages = maxMessages;
    }

    /**
     * Get conversation history as formatted string
     */
    async getConversationHistory(conversationId: string): Promise<string> {
        try {
            const conversation = await Conversation.findOne({ conversationId }).exec();
            if (!conversation || !conversation.messages) {
                return "";
            }

            return conversation.messages.map((msg: IMessage) => `${msg.role}: ${msg.content}`).join("\n");
        } catch (error) {
            console.error("Error getting conversation history:", error);
            return "";
        }
    }

    /**
     * Get conversation messages as array
     */
    async getConversationMessages(conversationId: string): Promise<SimpleMessage[]> {
        try {
            const conversation = await Conversation.findOne({ conversationId }).exec();
            if (!conversation || !conversation.messages) {
                return [];
            }

            return conversation.messages.map((msg: IMessage) => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
            }));
        } catch (error) {
            console.error("Error getting conversation messages:", error);
            return [];
        }
    }

    /**
     * Add a message to conversation
     */
    async addMessage(conversationId: string, role: "user" | "assistant", content: string, agentId?: string, config?: any): Promise<void> {
        try {
            const message: IMessage = {
                role,
                content,
                timestamp: new Date(),
            };

            // Find existing conversation or create new one
            let conversation = await Conversation.findOne({ conversationId }).exec();

            if (!conversation) {
                // Create new conversation
                conversation = new Conversation({
                    conversationId,
                    messages: [message],
                    agentId: agentId || "",
                    config: config || {},
                });
            } else {
                // Add message to existing conversation
                conversation.messages.push(message);

                // Keep only recent messages to prevent unlimited growth
                if (conversation.messages.length > this.maxMessages) {
                    conversation.messages = conversation.messages.slice(-this.maxMessages);
                }

                // Update metadata if provided
                if (agentId && !conversation.agentId) {
                    conversation.agentId = agentId;
                }
                if (config) {
                    conversation.config = { ...conversation.config, ...config };
                }
            }

            await conversation.save();
        } catch (error) {
            console.error("Error adding message to conversation:", error);
            throw error;
        }
    }

    /**
     * Get conversations by email (from config)
     */
    async getConversationsByEmail(email: string, limit: number = 10): Promise<IConversation[]> {
        try {
            return await Conversation.find({ "config.email": email }).sort({ updatedAt: -1 }).limit(limit).exec();
        } catch (error) {
            console.error("Error getting conversations by email:", error);
            return [];
        }
    }

    /**
     * Get recent conversations for an agent
     */
    async getAgentConversations(agentId: string, limit: number = 10): Promise<IConversation[]> {
        try {
            return await Conversation.find({ agentId }).sort({ updatedAt: -1 }).limit(limit).exec();
        } catch (error) {
            console.error("Error getting agent conversations:", error);
            return [];
        }
    }

    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId: string): Promise<boolean> {
        try {
            const result = await Conversation.deleteOne({ conversationId }).exec();
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting conversation:", error);
            return false;
        }
    }

    /**
     * Clear old conversations (older than specified days)
     */
    async clearOldConversations(daysOld: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await Conversation.deleteMany({
                updatedAt: { $lt: cutoffDate },
            }).exec();

            return result.deletedCount || 0;
        } catch (error) {
            console.error("Error clearing old conversations:", error);
            return 0;
        }
    }

    /**
     * Get conversation statistics
     */
    async getConversationStats(): Promise<{
        totalConversations: number;
        totalMessages: number;
        averageMessagesPerConversation: number;
    }> {
        try {
            const stats = await Conversation.aggregate([
                {
                    $group: {
                        _id: null,
                        totalConversations: { $sum: 1 },
                        totalMessages: { $sum: { $size: "$messages" } },
                    },
                },
            ]).exec();

            if (stats.length === 0) {
                return {
                    totalConversations: 0,
                    totalMessages: 0,
                    averageMessagesPerConversation: 0,
                };
            }

            const { totalConversations, totalMessages } = stats[0];
            return {
                totalConversations,
                totalMessages,
                averageMessagesPerConversation: totalMessages / totalConversations,
            };
        } catch (error) {
            console.error("Error getting conversation stats:", error);
            return {
                totalConversations: 0,
                totalMessages: 0,
                averageMessagesPerConversation: 0,
            };
        }
    }

    async getConversationById(conversationId: string): Promise<IConversation | null> {
        try {
            return await Conversation.findOne({ conversationId }).exec();
        } catch (error) {
            console.error("Error getting conversation by ID:", error);
            return null;
        }
    }

    async getByConversationIdAndAgentId(conversationId: string, agentId: string): Promise<IConversation | null> {
        try {
            return await Conversation.findOne({ conversationId, agentId }).exec();
        } catch (error) {
            console.error("Error getting conversation by ID:", error);
            return null;
        }
    }
}
