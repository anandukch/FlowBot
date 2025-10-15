import mongoose, { Document, Schema } from 'mongoose';
import { IApprovalStep, IFormField, FieldType, StepStatus } from './workflow.model';

export interface IApprovalTemplate extends Document {
    templateId: string;
    templateName: string;
    description: string;
    agentId: string; // Owner of this template
    steps: IApprovalStep[];
    globalDeadlineHours?: number;
    allowDelegation: boolean;
    allowSkip: boolean;
    notifyOnEachStep: boolean;
    isActive: boolean;
    isDefault: boolean; // Mark as default template for widget escalations
    createdAt: Date;
    updatedAt: Date;
}

// Form field schema (reused from workflow model)
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

// Approval step schema for templates
const TemplateStepSchema = new Schema<IApprovalStep>({
    stepNumber: { type: Number, required: true },
    stepName: { type: String, required: true },
    approverRole: { type: String, required: true },
    approverEmail: String,
    status: { 
        type: String, 
        enum: Object.values(StepStatus),
        default: StepStatus.PENDING 
    },
    deadline: Date,
    formFields: [FormFieldSchema]
}, { _id: false });

const ApprovalTemplateSchema = new Schema<IApprovalTemplate>({
    templateId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    templateName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    agentId: {
        type: String,
        required: true,
        index: true
    },
    steps: {
        type: [TemplateStepSchema],
        required: true,
        validate: {
            validator: function(steps: IApprovalStep[]) {
                return steps.length > 0;
            },
            message: 'Template must have at least one approval step'
        }
    },
    globalDeadlineHours: {
        type: Number,
        min: 1,
        max: 720 // 30 days max
    },
    allowDelegation: {
        type: Boolean,
        default: true
    },
    allowSkip: {
        type: Boolean,
        default: false
    },
    notifyOnEachStep: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isDefault: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    collection: 'approval_templates'
});

// Indexes
ApprovalTemplateSchema.index({ agentId: 1, isActive: 1 });
ApprovalTemplateSchema.index({ templateId: 1 });

// Static method to create default templates
ApprovalTemplateSchema.statics.createDefaultTemplates = async function(agentId: string) {
    const templates = [
        {
            templateId: `${agentId}_simple_approval`,
            templateName: 'Simple Approval',
            description: 'Single-step approval for basic requests',
            agentId,
            steps: [
                {
                    stepNumber: 1,
                    stepName: 'Manager Approval',
                    approverRole: 'manager',
                    status: StepStatus.PENDING,
                    formFields: [
                        {
                            id: 'comments',
                            type: FieldType.TEXTAREA,
                            label: 'Comments',
                            placeholder: 'Add your comments here...',
                            required: false
                        }
                    ]
                }
            ],
            globalDeadlineHours: 24,
            allowDelegation: true,
            allowSkip: false,
            notifyOnEachStep: true,
            isActive: true,
            isDefault: true // Make Simple Approval the default template
        },
        {
            templateId: `${agentId}_multi_step_approval`,
            templateName: 'Multi-Step Approval',
            description: 'Three-tier approval chain (Manager → Director → CFO)',
            agentId,
            steps: [
                {
                    stepNumber: 1,
                    stepName: 'Manager Review',
                    approverRole: 'manager',
                    status: StepStatus.PENDING,
                    formFields: [
                        {
                            id: 'budget_approved',
                            type: FieldType.CHECKBOX,
                            label: 'Budget Approved',
                            required: true
                        },
                        {
                            id: 'manager_comments',
                            type: FieldType.TEXTAREA,
                            label: 'Manager Comments',
                            required: false
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    stepName: 'Director Review',
                    approverRole: 'director',
                    status: StepStatus.PENDING,
                    formFields: [
                        {
                            id: 'priority',
                            type: FieldType.SELECT,
                            label: 'Priority Level',
                            options: ['Low', 'Medium', 'High', 'Critical'],
                            required: true
                        },
                        {
                            id: 'director_comments',
                            type: FieldType.TEXTAREA,
                            label: 'Director Comments',
                            required: false
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    stepName: 'CFO Final Approval',
                    approverRole: 'cfo',
                    status: StepStatus.PENDING,
                    formFields: [
                        {
                            id: 'financial_impact',
                            type: FieldType.NUMBER,
                            label: 'Financial Impact ($)',
                            required: true,
                            validation: {
                                min: 0,
                                message: 'Amount must be positive'
                            }
                        },
                        {
                            id: 'cfo_comments',
                            type: FieldType.TEXTAREA,
                            label: 'CFO Comments',
                            required: true
                        }
                    ]
                }
            ],
            globalDeadlineHours: 72,
            allowDelegation: true,
            allowSkip: false,
            notifyOnEachStep: true,
            isActive: true,
            isDefault: false
        },
        {
            templateId: `${agentId}_urgent_approval`,
            templateName: 'Urgent Approval',
            description: 'Fast-track approval for urgent requests',
            agentId,
            steps: [
                {
                    stepNumber: 1,
                    stepName: 'Urgent Review',
                    approverRole: 'senior_manager',
                    status: StepStatus.PENDING,
                    formFields: [
                        {
                            id: 'urgency_reason',
                            type: FieldType.TEXTAREA,
                            label: 'Reason for Urgency',
                            required: true
                        },
                        {
                            id: 'risk_assessment',
                            type: FieldType.RADIO,
                            label: 'Risk Level',
                            options: ['Low', 'Medium', 'High'],
                            required: true
                        }
                    ]
                }
            ],
            globalDeadlineHours: 4,
            allowDelegation: false,
            allowSkip: false,
            notifyOnEachStep: true,
            isActive: true,
            isDefault: false
        }
    ];

    try {
        await this.insertMany(templates);
        console.log(`✅ Created ${templates.length} default approval templates for agent ${agentId}`);
    } catch (error) {
        console.error('Error creating default templates:', error);
    }
};

export default mongoose.model<IApprovalTemplate>('ApprovalTemplate', ApprovalTemplateSchema);
