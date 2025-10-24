import { ConversationService, SimpleMessage } from "./conversation.service";

// Re-export for backward compatibility
export { SimpleMessage };

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
    [key: string]: JsonValue;
}

export class MemoryService {
    private conversationService: ConversationService;
    private userData: Record<string, any> = {};
    private maxMessages: number = 20;

    constructor(maxMessages: number = 20) {
        this.maxMessages = maxMessages;
        this.conversationService = new ConversationService(maxMessages);
    }

    async getConversationHistory(conversationId: string): Promise<string> {
        return await this.conversationService.getConversationHistory(conversationId);
    }

    async addMessage(conversationId: string, role: "user" | "assistant", content: string, agentId: string, config?: any): Promise<void> {
        await this.conversationService.addMessage(conversationId, role, content, agentId, config);
    }

    async getConversationMessages(conversationId: string): Promise<SimpleMessage[]> {
        return await this.conversationService.getConversationMessages(conversationId);
    }

    // Additional conversation management methods
    async getConversationsByEmail(email: string, limit: number = 10) {
        return await this.conversationService.getConversationsByEmail(email, limit);
    }

    async getAgentConversations(agentId: string, limit: number = 10) {
        return await this.conversationService.getAgentConversations(agentId, limit);
    }

    async deleteConversation(conversationId: string): Promise<boolean> {
        return await this.conversationService.deleteConversation(conversationId);
    }

    async getConversationStats() {
        return await this.conversationService.getConversationStats();
    }

    async getConversationById(conversationId: string) {
        return await this.conversationService.getConversationById(conversationId);
    }
    
    async getByConversationIdAndAgentId(conversationId: string, agentId: string) {
        return await this.conversationService.getByConversationIdAndAgentId(conversationId, agentId);
    }
}
