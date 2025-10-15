import { WebClient } from '@slack/web-api';
import { INotificationChannel } from '../models/workflow.model';
import userModel from '../models/user.modesl';

export interface SlackConfig {
    token: string;
    enabled: boolean;
}

export interface SlackNotificationData {
    workflowId: string;
    escalationReason: string;
    approverRole: string;
    stepName: string;
    deadline?: Date;
    originalMessage?: string;
    agentId: string;
}

export class SlackService {

    /**
     * Create Slack client for agent using token from user config
     */
    private async getSlackClient(agentId: string): Promise<WebClient | null> {
        try {
            // Get user config from database
            const user = await userModel.findOne({ agentId }).exec();
            if (!user || !user.config?.slackBotToken) {
                console.log(`No Slack config found for agent ${agentId}`);
                return null;
            }

            // Create and return Slack client
            const client = new WebClient(user.config.slackBotToken);
            return client;
        } catch (error) {
            console.error(`Failed to create Slack client for agent ${agentId}:`, error);
            return null;
        }
    }

    /**
     * Send approval notification to Slack channel
     */
    async sendApprovalNotification(
        agentId: string,
        channel: INotificationChannel,
        data: SlackNotificationData
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        if (!channel.enabled || channel.type !== 'slack') {
            return false;
        }

        try {
            const blocks = this.buildApprovalBlocks(data);
            
            const result = await client.chat.postMessage({
                channel: channel.target, // This should be the channel ID or name
                text: `New approval request: ${data.escalationReason}`,
                blocks: blocks,
                unfurl_links: false,
                unfurl_media: false
            });

            if (result.ok) {
                console.log(`Slack notification sent successfully to ${channel.target}`);
                return true;
            } else {
                console.error('Slack API error:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Failed to send Slack notification:', error);
            return false;
        }
    }

    /**
     * Send delegation notification to Slack
     */
    async sendDelegationNotification(
        agentId: string,
        channel: INotificationChannel,
        data: SlackNotificationData & { delegatedFrom: string; delegatedTo: string; reason?: string }
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        try {
            const blocks = this.buildDelegationBlocks(data);
            
            const result = await client.chat.postMessage({
                channel: channel.target,
                text: `Approval delegated: ${data.escalationReason}`,
                blocks: blocks
            });

            return result.ok || false;
        } catch (error) {
            console.error('Failed to send delegation notification:', error);
            return false;
        }
    }

    /**
     * Send completion notification to Slack
     */
    async sendCompletionNotification(
        agentId: string,
        channel: INotificationChannel,
        data: SlackNotificationData & { status: 'approved' | 'rejected'; approvedBy: string; response?: string }
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        try {
            const blocks = this.buildCompletionBlocks(data);
            
            const result = await client.chat.postMessage({
                channel: channel.target,
                text: `Approval ${data.status}: ${data.escalationReason}`,
                blocks: blocks
            });

            return result.ok || false;
        } catch (error) {
            console.error('Failed to send completion notification:', error);
            return false;
        }
    }

    /**
     * Update existing Slack message (for button interactions)
     */
    async updateMessage(
        agentId: string,
        channel: string,
        messageTs: string,
        data: SlackNotificationData & { 
            status: 'approved' | 'rejected' | 'delegated'; 
            actionBy: string; 
            response?: string;
            delegatedTo?: string;
        }
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        try {
            const blocks = this.buildUpdatedBlocks(data);
            
            const result = await client.chat.update({
                channel: channel,
                ts: messageTs,
                text: `Workflow ${data.status}: ${data.escalationReason}`,
                blocks: blocks
            });

            if (result.ok) {
                console.log(`Slack message updated successfully`);
                return true;
            } else {
                console.error('Slack API error:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Failed to update Slack message:', error);
            return false;
        }
    }

    /**
     * Show approval feedback modal
     */
    async showApprovalModal(
        agentId: string,
        triggerId: string,
        messageInfoJson: string
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        try {
            const result = await client.views.open({
                trigger_id: triggerId,
                view: {
                    type: 'modal',
                    callback_id: 'approve_workflow_modal',
                    title: {
                        type: 'plain_text',
                        text: 'Approve Workflow'
                    },
                    submit: {
                        type: 'plain_text',
                        text: 'Approve'
                    },
                    close: {
                        type: 'plain_text',
                        text: 'Cancel'
                    },
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `*Approving workflow:* ${JSON.parse(messageInfoJson).workflowId.slice(0, 16)}...`
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'approval_reason_block',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'approval_reason',
                                multiline: true,
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Optional: Add approval comments or feedback'
                                }
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Approval Comments (Optional)'
                            },
                            optional: true
                        }
                    ],
                    private_metadata: messageInfoJson
                }
            });

            return result.ok || false;
        } catch (error) {
            console.error('Failed to show approval modal:', error);
            return false;
        }
    }

    /**
     * Show rejection feedback modal
     */
    async showRejectionModal(
        agentId: string,
        triggerId: string,
        messageInfoJson: string
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        try {
            const result = await client.views.open({
                trigger_id: triggerId,
                view: {
                    type: 'modal',
                    callback_id: 'reject_workflow_modal',
                    title: {
                        type: 'plain_text',
                        text: 'Reject Workflow'
                    },
                    submit: {
                        type: 'plain_text',
                        text: 'Reject'
                    },
                    close: {
                        type: 'plain_text',
                        text: 'Cancel'
                    },
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `*Rejecting workflow:* ${JSON.parse(messageInfoJson).workflowId.slice(0, 16)}...`
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'rejection_reason_block',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'rejection_reason',
                                multiline: true,
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Please provide reason for rejection'
                                }
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Rejection Reason'
                            },
                            optional: false
                        }
                    ],
                    private_metadata: messageInfoJson
                }
            });

            return result.ok || false;
        } catch (error) {
            console.error('Failed to show rejection modal:', error);
            return false;
        }
    }

    /**
     * Show user selection modal for delegation
     */
    async showDelegationModal(
        agentId: string,
        triggerId: string,
        workflowId: string
    ): Promise<boolean> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            console.error(`No Slack client found for agent ${agentId}`);
            return false;
        }

        try {
            const result = await client.views.open({
                trigger_id: triggerId,
                view: {
                    type: 'modal',
                    callback_id: 'delegate_workflow_modal',
                    title: {
                        type: 'plain_text',
                        text: 'Delegate Workflow'
                    },
                    submit: {
                        type: 'plain_text',
                        text: 'Delegate'
                    },
                    close: {
                        type: 'plain_text',
                        text: 'Cancel'
                    },
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `*Delegating workflow:* ${workflowId.slice(0, 16)}...`
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'delegate_to_block',
                            element: {
                                type: 'users_select',
                                action_id: 'delegate_to_user',
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Select user to delegate to'
                                }
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Delegate to'
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'delegation_reason_block',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'delegation_reason',
                                multiline: true,
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Optional: Reason for delegation'
                                }
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Reason (Optional)'
                            },
                            optional: true
                        }
                    ],
                    private_metadata: workflowId
                }
            });

            return result.ok || false;
        } catch (error) {
            console.error('Failed to show delegation modal:', error);
            return false;
        }
    }

    /**
     * Test Slack connection
     */
    async testConnection(agentId: string): Promise<{ success: boolean; error?: string }> {
        const client = await this.getSlackClient(agentId);
        if (!client) {
            return { success: false, error: 'No Slack client configured' };
        }

        try {
            const result = await client.auth.test();
            if (result.ok) {
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Build Slack blocks for approval notification
     */
    private buildApprovalBlocks(data: SlackNotificationData) {
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🔔 New Approval Request'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Workflow ID:*\n${data.workflowId.slice(0, 16)}...`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Step:*\n${data.stepName}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Role:*\n${data.approverRole}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Deadline:*\n${data.deadline ? data.deadline.toLocaleString() : 'No deadline'}`
                    }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Reason:*\n${data.escalationReason}`
                }
            }
        ];

        if (data.originalMessage) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Original Message:*\n> ${data.originalMessage}`
                }
            });
        }

        // Add action buttons (these would need to be handled by your app)
        blocks.push({
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '✅ Approve'
                    },
                    style: 'primary',
                    value: `approve_${data.workflowId}_${data.agentId}`,
                    action_id: 'approve_workflow'
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '❌ Reject'
                    },
                    style: 'danger',
                    value: `reject_${data.workflowId}_${data.agentId}`,
                    action_id: 'reject_workflow'
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '👥 Delegate'
                    },
                    value: `delegate_${data.workflowId}_${data.agentId}`,
                    action_id: 'delegate_workflow'
                }
            ]
        } as any);

        return blocks;
    }

    /**
     * Build Slack blocks for delegation notification
     */
    private buildDelegationBlocks(data: SlackNotificationData & { delegatedFrom: string; delegatedTo: string; reason?: string }) {
        return [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '👥 Approval Delegated'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*From:*\n${data.delegatedFrom}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*To:*\n${data.delegatedTo}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Workflow:*\n${data.workflowId.slice(0, 16)}...`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Step:*\n${data.stepName}`
                    }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Reason:*\n${data.reason || 'No reason provided'}`
                }
            }
        ];
    }

    /**
     * Build Slack blocks for completion notification
     */
    private buildCompletionBlocks(data: SlackNotificationData & { status: 'approved' | 'rejected'; approvedBy: string; response?: string }) {
        const emoji = data.status === 'approved' ? '✅' : '❌';
        const statusText = data.status === 'approved' ? 'Approved' : 'Rejected';
        
        return [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Workflow ${statusText}`
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Workflow:*\n${data.workflowId.slice(0, 16)}...`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*${statusText} by:*\n${data.approvedBy}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Step:*\n${data.stepName}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Status:*\n${statusText}`
                    }
                ]
            }
        ];
    }

    /**
     * Build updated Slack blocks after button interaction (removes buttons, shows status)
     */
    private buildUpdatedBlocks(data: SlackNotificationData & { 
        status: 'approved' | 'rejected' | 'delegated'; 
        actionBy: string; 
        response?: string;
        delegatedTo?: string;
    }) {
        const getStatusEmoji = (status: string) => {
            switch (status) {
                case 'approved': return '✅';
                case 'rejected': return '❌';
                case 'delegated': return '👥';
                default: return '⏳';
            }
        };

        const getStatusText = (status: string) => {
            switch (status) {
                case 'approved': return 'Approved';
                case 'rejected': return 'Rejected';
                case 'delegated': return 'Delegated';
                default: return 'Processing';
            }
        };

        const emoji = getStatusEmoji(data.status);
        const statusText = getStatusText(data.status);
        
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} ${statusText} Request`
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Workflow ID:*\n${data.workflowId.slice(0, 16)}...`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Step:*\n${data.stepName}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Role:*\n${data.approverRole}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Status:*\n${statusText}`
                    }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Reason:*\n${data.escalationReason}`
                }
            }
        ];

        if (data.originalMessage) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Original Message:*\n> ${data.originalMessage}`
                }
            });
        }

        // Add action details
        if (data.status === 'delegated' && data.delegatedTo) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${statusText} by:* ${data.actionBy}\n*Delegated to:* ${data.delegatedTo}`
                }
            });
        } else {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${statusText} by:* ${data.actionBy}`
                }
            });
        }

        if (data.response) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Response:*\n${data.response}`
                }
            });
        }

        return blocks;
    }


}

// Export singleton instance
export const slackService = new SlackService();
