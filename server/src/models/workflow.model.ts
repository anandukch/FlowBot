import mongoose, { Document, Schema } from 'mongoose';

// Workflow status enum
export enum WorkflowStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    TIMEOUT = 'timeout',
    CANCELLED = 'cancelled',
    IN_PROGRESS = 'in_progress'
}

// Approval step status
export enum StepStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SKIPPED = 'skipped',
    DELEGATED = 'delegated'
}

// Field types for dynamic forms
export enum FieldType {
    TEXT = 'text',
    TEXTAREA = 'textarea',
    NUMBER = 'number',
    EMAIL = 'email',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
    DATE = 'date',
    FILE = 'file'
}

// Dynamic form field definition
export interface IFormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select, multiselect, radio
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
    defaultValue?: any;
}

// State snapshot for rollback
export interface IStateSnapshot {
    timestamp: Date;
    status: WorkflowStatus;
    currentStep: number;
    data?: any;
    triggeredBy: string;
    action: string;
}

// Approval step in multi-step chain
export interface INotificationChannel {
    type: 'email' | 'slack' | 'ui';
    target: string; // Email address, Slack channel ID, or 'ui' for dashboard only
    enabled: boolean;
}

export interface IApprovalStep {
    stepNumber: number;
    stepName: string;
    approverRole: string;
    approverEmail?: string;
    notificationChannels?: INotificationChannel[];
    status: StepStatus;
    deadline?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedAt?: Date;
    delegatedTo?: string;
    delegatedAt?: Date;
    response?: string;
    formResponse?: any;
    formFields?: IFormField[];
}
export interface IApprovalTemplate {
    templateId: string;
    templateName: string;
    description: string;
    steps: IApprovalStep[];
    globalDeadlineHours?: number; // Overall deadline for entire workflow
    allowDelegation: boolean;
    allowSkip: boolean;
    notifyOnEachStep: boolean;
}

// Main workflow document
export interface IWorkflow extends Document {
    workflowId: string;
    conversationId: string;
    agentId: string;
    status: WorkflowStatus;
    templateId?: string; // Reference to approval template
    currentStep: number;
    steps: IApprovalStep[];
    originalMessage: string;
    escalationReason: string;
    metadata: Record<string, any>;
    stateHistory: IStateSnapshot[];
    createdAt: Date;
    updatedAt: Date;
    deadline?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancelledBy?: string;
    cancellationReason?: string;
    responseDisplayed?: boolean; // Flag to track if response was shown to user
    
    // Instance methods
    addStateSnapshot(triggeredBy: string, action: string): void;
    canRollback(): boolean;
    rollback(): boolean;
}

// Form field schema
const FormFieldSchema = new Schema<IFormField>({
    id: { type: String, required: true },
    type: { 
        type: String, 
        enum: Object.values(FieldType),
        required: true 
    },
    label: { type: String, required: true },
    placeholder: String,
    required: { type: Boolean, default: false },
    options: [String],
    validation: {
        min: Number,
        max: Number,
        pattern: String,
        message: String
    },
    defaultValue: Schema.Types.Mixed
}, { _id: false });

// Notification channel schema
const NotificationChannelSchema = new Schema<INotificationChannel>({
    type: {
        type: String,
        enum: ['email', 'slack', 'ui'],
        required: true
    },
    target: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    }
}, { _id: false });

// State snapshot schema
const StateSnapshotSchema = new Schema<IStateSnapshot>({
    timestamp: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: Object.values(WorkflowStatus),
        required: true 
    },
    currentStep: { type: Number, required: true },
    data: Schema.Types.Mixed,
    triggeredBy: { type: String, required: true },
    action: { type: String, required: true }
}, { _id: false });

// Approval step schema
const ApprovalStepSchema = new Schema<IApprovalStep>({
    stepNumber: { type: Number, required: true },
    stepName: { type: String, required: true },
    approverRole: { type: String, required: true },
    approverEmail: String,
    notificationChannels: [NotificationChannelSchema],
    status: { 
        type: String, 
        enum: Object.values(StepStatus),
        default: StepStatus.PENDING 
    },
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
    response: String,
    delegatedTo: String,
    delegatedAt: Date,
    deadline: Date,
    formFields: [FormFieldSchema],
    formResponse: Schema.Types.Mixed
}, { _id: false });

// Main workflow schema
const WorkflowSchema = new Schema<IWorkflow>({
    workflowId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    agentId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(WorkflowStatus),
        default: WorkflowStatus.PENDING,
        index: true
    },
    templateId: {
        type: String,
        index: true
    },
    currentStep: {
        type: Number,
        default: 0
    },
    steps: [ApprovalStepSchema],
    originalMessage: {
        type: String,
        required: true
    },
    escalationReason: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    stateHistory: [StateSnapshotSchema],
    deadline: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: String,
    cancellationReason: String,
    responseDisplayed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'workflows'
});

// Indexes for efficient queries
WorkflowSchema.index({ workflowId: 1 });
WorkflowSchema.index({ conversationId: 1 });
WorkflowSchema.index({ agentId: 1, status: 1 });
WorkflowSchema.index({ status: 1, createdAt: -1 });
WorkflowSchema.index({ 'steps.approverEmail': 1, status: 1 });

// TTL index to automatically delete old completed workflows after 90 days
WorkflowSchema.index({ updatedAt: 1 }, { 
    expireAfterSeconds: 90 * 24 * 60 * 60,
    partialFilterExpression: { 
        status: { $in: [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED, WorkflowStatus.CANCELLED] }
    }
});

// Instance methods
WorkflowSchema.methods.addStateSnapshot = function(triggeredBy: string, action: string) {
    this.stateHistory.push({
        timestamp: new Date(),
        status: this.status,
        currentStep: this.currentStep,
        data: this.toObject(),
        triggeredBy,
        action
    });
};

WorkflowSchema.methods.canRollback = function(): boolean {
    return this.stateHistory.length > 1;
};

WorkflowSchema.methods.rollback = function(): boolean {
    if (!this.canRollback()) {
        return false;
    }
    
    // Remove current state
    this.stateHistory.pop();
    
    // Get previous state
    const previousState = this.stateHistory[this.stateHistory.length - 1];
    
    // Restore state
    this.status = previousState.status;
    this.currentStep = previousState.currentStep;
    
    return true;
};

export default mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
