export interface SimpleMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
    [key: string]: JsonValue;
}

export class MemoryService {
    private conversations: Record<string, SimpleMessage[]> = {};
    private userData: Record<string, any> = {};
    private maxMessages: number = 20;
    private wfIdCovIdMap: Record<string, string> = {};

    constructor(maxMessages: number = 20) {
        this.maxMessages = maxMessages;
    }

    addWorkflowIdConversationIdMapping(workflowId: string, conversationId: string): void {
        this.setUserData(`workflow:${workflowId}`, conversationId, 86400); // Expires in 24 hours
    }

    getConversationIdByWorkflowId(workflowId: string): string | undefined {
        return this.getUserData<string>(`workflow:${workflowId}`);
    }

    getConversationHistory(conversationId: string): string {
        const messages = this.conversations[conversationId] || [];
        return messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
    }

    addMessage(conversationId: string, role: "user" | "assistant", content: string): void {
        if (!this.conversations[conversationId]) {
            this.conversations[conversationId] = [];
        }

        const message: SimpleMessage = {
            role,
            content,
            timestamp: new Date(),
        };

        this.conversations[conversationId].push(message);

        // Keep only recent messages
        if (this.conversations[conversationId].length > this.maxMessages) {
            this.conversations[conversationId] = this.conversations[conversationId].slice(-this.maxMessages);
        }
    }

  

   

   
    


    

    /**
     * Store arbitrary JSON data with an optional TTL (in seconds)
     * @param key Unique identifier for the data
     * @param value Data to store (must be JSON-serializable)
     * @param ttlInSeconds Optional time-to-live in seconds
     */
    setUserData<T = any>(key: string, data: T, ttlInSeconds?: number): void {
        this.userData[key] = data;
        this.cleanupExpiredData();
    }

    /**
     * Retrieve stored data by key
     * @param key Unique identifier for the data
     * @returns The stored value or undefined if not found/expired
     */
    getUserData<T = any>(key: string): T | undefined {
        this.cleanupExpiredData();
        const data = this.userData[key];
        return data as T;
    }

    /**
     * Check if a key exists in the user data store
     * @param key Key to check
     * @returns boolean indicating if the key exists and is not expired
     */
    hasUserData(key: string): boolean {
        this.cleanupExpiredData();
        return key in this.userData;
    }

   
    

    
  
  


  

    /**
     * Clean up expired data entries
     */
    private cleanupExpiredData(): void {
        const now = Date.now();
        for (const [key, data] of Object.entries(this.userData)) {
            if (data.expiresAt && data.expiresAt <= now) {
                delete this.userData[key];
            }
        }
    }
}
