import { IWorkflow, StepStatus, WorkflowStatus } from '../models/workflow.model';
import { slackService } from './slack.service';
import { WorkflowService } from './workflow.service';

export class ApprovalFlowService {
    private workflowService: WorkflowService;

    constructor() {
        this.workflowService = new WorkflowService();
    }

    /**
     * Handle workflow creation and send initial notifications
     */
    async createAndNotify(workflowData: any): Promise<IWorkflow> {
        // Create workflow
        const workflow = await this.workflowService.createWorkflow(workflowData);
        
        // Send notifications for current step
        await this.sendStepNotifications(workflow);
        
        return workflow;
    }

    /**
     * Handle approval and move to next step
     */
    async approveAndProgress(workflowId: string, approverEmail: string, response?: string): Promise<IWorkflow> {
        // Approve current step
        const workflow = await this.workflowService.approveStep({
            workflowId,
            approver: approverEmail,
            response
        });
        
        // Send notifications for next step (if exists)
        await this.sendStepNotifications(workflow);
        
        return workflow;
    }

    /**
     * Handle rejection
     */
    async rejectWorkflow(workflowId: string, approverEmail: string, response?: string): Promise<IWorkflow> {
        const workflow = await this.workflowService.rejectStep({
            workflowId,
            approver: approverEmail,
            response
        });
        
        // Send rejection notifications if needed
        await this.sendCompletionNotifications(workflow, 'rejected', approverEmail);
        
        return workflow;
    }

    /**
     * Handle delegation
     */
    async delegateApproval(workflowId: string, fromEmail: string, toEmail: string, reason?: string): Promise<IWorkflow> {
        const workflow = await this.workflowService.delegateApproval({
            workflowId,
            currentApprover: fromEmail,
            delegateTo: toEmail,
            reason
        });
        
        // Send notifications to new approver
        await this.sendStepNotifications(workflow);
        
        return workflow;
    }

    /**
     * Send notifications for current step
     */
    private async sendStepNotifications(workflow: IWorkflow): Promise<void> {
        if (workflow.status === WorkflowStatus.APPROVED || workflow.status === WorkflowStatus.REJECTED) {
            return; // Workflow completed, no more notifications
        }

        const currentStep = workflow.steps[workflow.currentStep];
        if (!currentStep || currentStep.status !== StepStatus.PENDING) {
            return;
        }

        // Send notifications for each channel
        if (currentStep.notificationChannels) {
            for (const channel of currentStep.notificationChannels) {
                if (!channel.enabled) continue;

                if (channel.type === 'slack') {
                    await this.sendSlackNotification(workflow, currentStep, channel);
                }
                // UI notifications are handled by the dashboard automatically
            }
        }
    }

    /**
     * Send Slack notification
     */
    private async sendSlackNotification(workflow: IWorkflow, step: any, channel: any): Promise<void> {
        try {
            await slackService.sendApprovalNotification(workflow.agentId, channel, {
                workflowId: workflow.workflowId,
                escalationReason: workflow.escalationReason,
                approverRole: step.approverRole,
                stepName: step.stepName,
                deadline: workflow.deadline,
                originalMessage: workflow.originalMessage,
                agentId: workflow.agentId
            });
        } catch (error) {
            console.error('Failed to send Slack notification:', error);
        }
    }

    /**
     * Send completion notifications
     */
    private async sendCompletionNotifications(workflow: IWorkflow, status: 'approved' | 'rejected', approvedBy: string): Promise<void> {
        // Send to all previous steps that had Slack notifications
        for (const step of workflow.steps) {
            if (step.notificationChannels) {
                for (const channel of step.notificationChannels) {
                    if (channel.enabled && channel.type === 'slack') {
                        try {
                            await slackService.sendCompletionNotification(workflow.agentId, channel, {
                                workflowId: workflow.workflowId,
                                escalationReason: workflow.escalationReason,
                                approverRole: step.approverRole,
                                stepName: step.stepName,
                                agentId: workflow.agentId,
                                status,
                                approvedBy
                            });
                        } catch (error) {
                            console.error('Failed to send completion notification:', error);
                        }
                    }
                }
            }
        }
    }


}

// Export singleton
export const approvalFlowService = new ApprovalFlowService();
