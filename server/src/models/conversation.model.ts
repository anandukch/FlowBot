import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export interface IConversationConfig {
    email?: string;
    name?: string;
    phone?: string;
    awaitingEmail?: boolean;
    [key: string]: any; // Allow additional custom fields
}

export interface IConversation extends Document {
    conversationId: string; // This represents the end user's unique conversation
    messages: IMessage[];
    agentId: string; // The store/business owner's agent ID
    config?: IConversationConfig; // User info like email, name, etc.
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const ConversationSchema = new Schema<IConversation>({
    conversationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    messages: [MessageSchema],
    agentId: {
        type: String,
        required: true,
        index: true
    },
    config: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'conversations'
});

// Index for efficient queries
ConversationSchema.index({ conversationId: 1 });
ConversationSchema.index({ agentId: 1, createdAt: -1 });
ConversationSchema.index({ 'config.email': 1 }); // Index for email lookups

// TTL index to automatically delete old conversations after 30 days
ConversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
