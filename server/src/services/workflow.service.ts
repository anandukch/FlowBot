import Workflow, { IWorkflow, WorkflowStatus, StepStatus, IApprovalStep, IStateSnapshot } from '../models/workflow.model';
import ApprovalTemplate, { IApprovalTemplate } from '../models/approval-template.model';
import { workflowEvents } from '../../index';

export interface CreateWorkflowParams {
    conversationId: string;
    agentId: string;
    originalMessage: string;
    escalationReason: string;
    templateId?: string;
    useDefaultTemplate?: boolean;
    metadata?: Record<string, any>;
}

export interface ApprovalActionParams {
    workflowId: string;
    approver: string;
    response?: string;
    formResponse?: Record<string, any>;
}

export interface DelegationParams {
    workflowId: string;
    currentApprover: string;
    delegateTo: string;
    reason?: string;
}

export class WorkflowService {
    /**
     * Create a new workflow from template or default single-step
     */
    async createWorkflow(params: CreateWorkflowParams): Promise<IWorkflow> {
        const workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        let steps: IApprovalStep[] = [];
        let deadline: Date | undefined;

        // If useDefaultTemplate is true, find the default template for this agent
        if (params.useDefaultTemplate) {
            const defaultTemplate = await ApprovalTemplate.findOne({ 
                agentId: params.agentId,
                isDefault: true,
                isActive: true 
            }).exec();
            
            if (defaultTemplate) {
                console.log(`✅ Using default template: ${defaultTemplate.templateName}`);
                // Clone template steps
                steps = defaultTemplate.steps.map(step => {
                    const stepObj = (step as any).toObject ? (step as any).toObject() : step;
                    return {
                        ...stepObj,
                        status: StepStatus.PENDING
                    } as IApprovalStep;
                });

                // Set global deadline if specified
                if (defaultTemplate.globalDeadlineHours) {
                    deadline = new Date();
                    deadline.setHours(deadline.getHours() + defaultTemplate.globalDeadlineHours);
                }
            } else {
                console.warn(`⚠️ No default template found for agent ${params.agentId}, using fallback`);
            }
        }
        // If template specified, try to load it
        else if (params.templateId) {
            const template = await ApprovalTemplate.findOne({ 
                templateId: params.templateId,
                isActive: true 
            }).exec();

            if (template) {
                // Clone template steps
                steps = template.steps.map(step => {
                    // Convert to plain object if it's a Mongoose document
                    const stepObj = (step as any).toObject ? (step as any).toObject() : step;
                    return {
                        ...stepObj,
                        status: StepStatus.PENDING
                    } as IApprovalStep;
                });

                // Set global deadline if specified
                if (template.globalDeadlineHours) {
                    deadline = new Date();
                    deadline.setHours(deadline.getHours() + template.globalDeadlineHours);
                }
            } else {
                // Template not found, log warning and fall back to default
                console.warn(`⚠️ Template ${params.templateId} not found, using default single-step approval`);
            }
        }
        
        // If no template or template not found, use default single-step approval
        if (steps.length === 0) {
            // Default single-step approval
            // Use a generic approver email that can be updated later
            steps = [{
                stepNumber: 1,
                stepName: 'Approval Required',
                approverRole: 'support_team',
                approverEmail: 'support@company.com', // Default approver - should be configured per agent
                status: StepStatus.PENDING,
                formFields: [
                    {
                        id: 'response',
                        type: 'textarea' as any,
                        label: 'Response',
                        placeholder: 'Enter your response...',
                        required: false
                    }
                ]
            }];

            // Default 24-hour deadline
            deadline = new Date();
            deadline.setHours(deadline.getHours() + 24);
        }

        const workflow = new Workflow({
            workflowId,
            conversationId: params.conversationId,
            agentId: params.agentId,
            status: WorkflowStatus.PENDING,
            templateId: params.templateId,
            currentStep: 0,
            steps,
            originalMessage: params.originalMessage,
            escalationReason: params.escalationReason,
            metadata: params.metadata || {},
            stateHistory: [],
            deadline
        });

        // Add initial state snapshot
        workflow.addStateSnapshot('system', 'workflow_created');

        await workflow.save();

        // Emit event
        workflowEvents.emit('workflow:created', {
            workflowId: workflow.workflowId,
            conversationId: workflow.conversationId,
            templateId: params.templateId,
            totalSteps: steps.length,
            deadline: workflow.deadline
        });

        return workflow;
    }

    /**
     * Approve current step and advance workflow
     */
    async approveStep(params: ApprovalActionParams): Promise<IWorkflow> {
        const workflow = await Workflow.findOne({ workflowId: params.workflowId }).exec();
        
        if (!workflow) {
            throw new Error(`Workflow ${params.workflowId} not found`);
        }

        if (workflow.status !== WorkflowStatus.PENDING && workflow.status !== WorkflowStatus.IN_PROGRESS) {
            throw new Error(`Workflow is ${workflow.status}, cannot approve`);
        }

        const currentStep = workflow.steps[workflow.currentStep];
        if (!currentStep) {
            throw new Error('No current step found');
        }

        // Add state snapshot before modification
        workflow.addStateSnapshot(params.approver, 'step_approved');

        // Update current step
        currentStep.status = StepStatus.APPROVED;
        currentStep.approvedBy = params.approver;
        currentStep.approvedAt = new Date();
        currentStep.response = params.response;
        currentStep.formResponse = params.formResponse;

        // Check if this was the last step
        if (workflow.currentStep === workflow.steps.length - 1) {
            // Workflow complete
            workflow.status = WorkflowStatus.APPROVED;
            workflow.completedAt = new Date();

            await workflow.save();

            // Emit completion event
            workflowEvents.emit('workflow:completed', {
                workflowId: workflow.workflowId,
                conversationId: workflow.conversationId,
                finalApprover: params.approver,
                totalSteps: workflow.steps.length,
                completedAt: workflow.completedAt
            });

            workflowEvents.emit('workflow:approved', {
                workflowId: workflow.workflowId,
                conversationId: workflow.conversationId,
                response: params.response,
                approver: params.approver,
                timestamp: new Date().toISOString()
            });
        } else {
            // Move to next step
            workflow.currentStep += 1;
            workflow.status = WorkflowStatus.IN_PROGRESS;

            await workflow.save();

            const nextStep = workflow.steps[workflow.currentStep];

            // Emit step transition event
            workflowEvents.emit('workflow:step_advanced', {
                workflowId: workflow.workflowId,
                conversationId: workflow.conversationId,
                previousStep: currentStep.stepNumber,
                currentStep: nextStep.stepNumber,
                currentStepName: nextStep.stepName,
                approverRole: nextStep.approverRole,
                approverEmail: nextStep.approverEmail
            });
        }

        return workflow;
    }

    /**
     * Reject current step and terminate workflow
     */
    async rejectStep(params: ApprovalActionParams): Promise<IWorkflow> {
        const workflow = await Workflow.findOne({ workflowId: params.workflowId }).exec();
        
        if (!workflow) {
            throw new Error(`Workflow ${params.workflowId} not found`);
        }

        if (workflow.status !== WorkflowStatus.PENDING && workflow.status !== WorkflowStatus.IN_PROGRESS) {
            throw new Error(`Workflow is ${workflow.status}, cannot reject`);
        }

        const currentStep = workflow.steps[workflow.currentStep];
        if (!currentStep) {
            throw new Error('No current step found');
        }

        // Add state snapshot before modification
        workflow.addStateSnapshot(params.approver, 'step_rejected');

        // Update current step
        currentStep.status = StepStatus.REJECTED;
        currentStep.rejectedBy = params.approver;
        currentStep.rejectedAt = new Date();
        currentStep.response = params.response;
        currentStep.formResponse = params.formResponse;

        // Terminate workflow
        workflow.status = WorkflowStatus.REJECTED;
        workflow.completedAt = new Date();

        await workflow.save();

        // Emit rejection event
        workflowEvents.emit('workflow:rejected', {
            workflowId: workflow.workflowId,
            conversationId: workflow.conversationId,
            reason: params.response || 'Rejected by approver',
            approver: params.approver,
            rejectedAtStep: currentStep.stepNumber,
            timestamp: new Date().toISOString()
        });

        return workflow;
    }

    /**
     * Delegate approval to another user
     */
    async delegateApproval(params: DelegationParams): Promise<IWorkflow> {
        const workflow = await Workflow.findOne({ workflowId: params.workflowId }).exec();
        
        if (!workflow) {
            throw new Error(`Workflow ${params.workflowId} not found`);
        }

        if (workflow.status !== WorkflowStatus.PENDING && workflow.status !== WorkflowStatus.IN_PROGRESS) {
            throw new Error(`Workflow is ${workflow.status}, cannot delegate`);
        }

        // Check if template allows delegation
        if (workflow.templateId) {
            const template = await ApprovalTemplate.findOne({ templateId: workflow.templateId }).exec();
            if (template && !template.allowDelegation) {
                throw new Error('This workflow does not allow delegation');
            }
        }

        const currentStep = workflow.steps[workflow.currentStep];
        if (!currentStep) {
            throw new Error('No current step found');
        }

        // Add state snapshot
        workflow.addStateSnapshot(params.currentApprover, 'approval_delegated');

        // Update step with delegation info
        currentStep.status = StepStatus.DELEGATED;
        currentStep.delegatedTo = params.delegateTo;
        currentStep.delegatedAt = new Date();
        currentStep.approverEmail = params.delegateTo; // Update approver

        await workflow.save();

        // Emit delegation event
        workflowEvents.emit('workflow:delegated', {
            workflowId: workflow.workflowId,
            conversationId: workflow.conversationId,
            fromApprover: params.currentApprover,
            toApprover: params.delegateTo,
            stepNumber: currentStep.stepNumber,
            reason: params.reason,
            timestamp: new Date().toISOString()
        });

        return workflow;
    }

    /**
     * Cancel workflow
     */
    async cancelWorkflow(workflowId: string, cancelledBy: string, reason?: string): Promise<IWorkflow> {
        const workflow = await Workflow.findOne({ workflowId }).exec();
        
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        if (workflow.status === WorkflowStatus.APPROVED || 
            workflow.status === WorkflowStatus.REJECTED ||
            workflow.status === WorkflowStatus.CANCELLED) {
            throw new Error(`Workflow is already ${workflow.status}`);
        }

        // Add state snapshot
        workflow.addStateSnapshot(cancelledBy, 'workflow_cancelled');

        workflow.status = WorkflowStatus.CANCELLED;
        workflow.cancelledAt = new Date();
        workflow.cancelledBy = cancelledBy;
        workflow.cancellationReason = reason;

        await workflow.save();

        // Emit cancellation event
        workflowEvents.emit('workflow:cancelled', {
            workflowId: workflow.workflowId,
            conversationId: workflow.conversationId,
            cancelledBy,
            reason,
            timestamp: new Date().toISOString()
        });

        return workflow;
    }

    /**
     * Rollback workflow to previous state
     */
    async rollbackWorkflow(workflowId: string, triggeredBy: string): Promise<IWorkflow> {
        const workflow = await Workflow.findOne({ workflowId }).exec();
        
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        if (!workflow.canRollback()) {
            throw new Error('Cannot rollback - no previous state available');
        }

        const success = workflow.rollback();
        if (!success) {
            throw new Error('Rollback failed');
        }

        // Add snapshot for rollback action
        workflow.addStateSnapshot(triggeredBy, 'workflow_rolled_back');

        await workflow.save();

        // Emit rollback event
        workflowEvents.emit('workflow:rolled_back', {
            workflowId: workflow.workflowId,
            conversationId: workflow.conversationId,
            triggeredBy,
            newStatus: workflow.status,
            newStep: workflow.currentStep,
            timestamp: new Date().toISOString()
        });

        return workflow;
    }

    /**
     * Get workflow by ID
     */
    async getWorkflow(workflowId: string): Promise<IWorkflow | null> {
        return await Workflow.findOne({ workflowId }).exec();
    }

    /**
     * Get workflows by conversation ID
     */
    async getWorkflowsByConversation(conversationId: string): Promise<IWorkflow[]> {
        return await Workflow.find({ conversationId })
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Get pending workflows for an approver
     * Also includes workflows with generic/default approver emails
     */
    async getPendingWorkflowsForApprover(approverEmail: string): Promise<IWorkflow[]> {
        return await Workflow.find({
            status: { $in: [WorkflowStatus.PENDING, WorkflowStatus.IN_PROGRESS] },
            steps: {
                $elemMatch: {
                    approverEmail: approverEmail,
                    status: { $in: [StepStatus.PENDING, StepStatus.DELEGATED] }
                }
            }
        }).sort({ deadline: 1 }).exec();
    }

    /**
     * Get completed workflows for an approver (approved/rejected by them)
     */
    async getCompletedWorkflowsForApprover(approverEmail: string): Promise<IWorkflow[]> {
        return await Workflow.find({
            status: { $in: [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED] },
            $or: [
                { 'steps.approvedBy': approverEmail },
                { 'steps.rejectedBy': approverEmail }
            ]
        }).sort({ completedAt: -1 }).exec();
    }

    /**
     * Check for timed-out workflows
     */
    async checkTimeouts(): Promise<void> {
        const now = new Date();
        
        const timedOutWorkflows = await Workflow.find({
            status: { $in: [WorkflowStatus.PENDING, WorkflowStatus.IN_PROGRESS] },
            deadline: { $lt: now }
        }).exec();

        for (const workflow of timedOutWorkflows) {
            workflow.addStateSnapshot('system', 'workflow_timeout');
            workflow.status = WorkflowStatus.TIMEOUT;
            workflow.completedAt = new Date();
            
            await workflow.save();

            workflowEvents.emit('workflow:timeout', {
                workflowId: workflow.workflowId,
                conversationId: workflow.conversationId,
                deadline: workflow.deadline,
                currentStep: workflow.currentStep,
                timestamp: new Date().toISOString()
            });
        }

        if (timedOutWorkflows.length > 0) {
            console.log(`⏰ Marked ${timedOutWorkflows.length} workflows as timed out`);
        }
    }

    /**
     * Get workflow statistics
     */
    async getWorkflowStats(agentId?: string): Promise<any> {
        const match: any = {};
        if (agentId) {
            match.agentId = agentId;
        }

        const stats = await Workflow.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgSteps: { $avg: { $size: '$steps' } }
                }
            }
        ]).exec();

        return stats;
    }
}
