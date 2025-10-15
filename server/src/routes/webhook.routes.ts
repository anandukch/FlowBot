import { Router } from "express";
import { approvalFlowService } from '../services/approval-flow.service';
import { slackService } from '../services/slack.service';
import { workflowEvents } from '../../index';

export function createWebhookRoutes(): Router {
    const router = Router();
    // Webhook for Slack responses (human approvals)
    router.post("/slack", async (req, res) => {
        try {
            
            // Handle case where body is undefined or empty
            if (!req.body) {
                return res.status(400).json({
                    success: false,
                    message: "Request body is required"
                });
            }

            // Handle Slack URL verification challenge
            if (req.body?.type === 'url_verification') {
                return res.json({ challenge: req.body.challenge });
            }

            // Handle Slack interactive components (button clicks and modal submissions)
            if (req.body?.type === 'interactive_message' || req.body?.type === 'block_actions' || req.body?.type === 'view_submission' || req.body?.payload) {
                // Parse Slack interactive payload
                const payload = req.body.payload ? JSON.parse(req.body.payload) : req.body;
                
                
                // Extract workflow info from button value
                const action = payload.actions?.[0];
                if (action?.value) {
                    // Button value format: "approve_wf_1760556520063_4m4y5y3yosm_agentId"
                    // Split and extract: actionType, workflowId, agentId
                    const valueParts = action.value.split('_');
                    const actionType = valueParts[0]; // "approve" or "reject" or "delegate"
                    const agentId = valueParts[valueParts.length - 1]; // Last part is agentId
                    const workflowId = valueParts.slice(1, -1).join('_'); // Middle parts form workflowId
                    const approver = payload.user?.email || payload.user?.username || payload.user?.name || 'Slack User';
                    
                    console.log(`🎯 Processing ${actionType} for workflow ${workflowId} by ${approver}`);
                    
                    // Extract message info for updating
                    const channel = payload.channel?.id;
                    const messageTs = payload.message?.ts;
                    
                    if (actionType === 'approve') {
                        // Show approval feedback modal
                        const triggerId = payload.trigger_id;
                        if (triggerId) {
                            // Store message info in metadata for later update
                            const messageInfo = {
                                workflowId,
                                channel,
                                messageTs,
                                agentId
                            };
                            await slackService.showApprovalModal(
                                agentId,
                                triggerId,
                                JSON.stringify(messageInfo)
                            );
                        }
                    } else if (actionType === 'reject') {
                        // Show rejection reason modal
                        const triggerId = payload.trigger_id;
                        if (triggerId) {
                            // Store message info in metadata for later update
                            const messageInfo = {
                                workflowId,
                                channel,
                                messageTs,
                                agentId
                            };
                            await slackService.showRejectionModal(
                                agentId,
                                triggerId,
                                JSON.stringify(messageInfo)
                            );
                        }
                    } else if (actionType === 'delegate') {
                        // Show delegation modal
                        const triggerId = payload.trigger_id;
                        if (triggerId) {
                            await slackService.showDelegationModal(
                                agentId,
                                triggerId,
                                workflowId
                            );
                        }
                    }
                    
                    return res.json({ success: true, message: `Workflow ${actionType}d successfully` });
                }

                // Handle modal submission (delegation)
                if (payload.type === 'view_submission' && payload.view?.callback_id === 'delegate_workflow_modal') {
                    console.log('🎯 Delegation modal submitted');
                    console.log('📋 Payload type:', payload.type);
                    console.log('📋 Callback ID:', payload.view?.callback_id);
                    const workflowId = payload.view.private_metadata;
                    const values = payload.view.state.values;
                    
                    const delegatedToUserId = values.delegate_to_block?.delegate_to_user?.selected_user;
                    const delegationReason = values.delegation_reason_block?.delegation_reason?.value || 'No reason provided';
                    const delegatedBy = payload.user?.username || payload.user?.name || 'Slack User';
                    
                    console.log(`🎯 Processing delegation for workflow ${workflowId} by ${delegatedBy} to user ${delegatedToUserId}`);
                    console.log(`📝 Delegation reason: ${delegationReason}`);
                    
                    try {
                        const startTime = Date.now();
                        
                        // First, respond to Slack immediately to avoid timeout
                        res.status(200).json({
                            "response_action": "clear"
                        });
                        
                        // Then process delegation asynchronously
                        setImmediate(async () => {
                            try {
                                // Extract agentId from workflowId or use a default approach
                                const agentId = 'default'; // You might need to store this differently
                                
                                // Process the delegation through approval flow service
                                await approvalFlowService.delegateApproval(
                                    workflowId,
                                    delegatedBy, // from email/username
                                    delegatedToUserId, // to user ID (you might need to convert this to email)
                                    delegationReason
                                );
                                
                                const endTime = Date.now();
                                console.log(`✅ Successfully delegated workflow ${workflowId} from ${delegatedBy} to ${delegatedToUserId} (${endTime - startTime}ms)`);
                                
                                // TODO: Update the original message to show delegation status
                                
                            } catch (asyncError) {
                                console.error('❌ Error in async delegation processing:', asyncError);
                            }
                        });
                        
                        return; // Response already sent
                    } catch (error) {
                        console.error('❌ Error processing delegation:', error);
                        return res.json({
                            response_action: 'errors',
                            errors: {
                                'delegate_to_block': 'Failed to process delegation. Please try again.'
                            }
                        });
                    }
                }

                // Handle approval modal submission
                if (payload.type === 'view_submission' && payload.view?.callback_id === 'approve_workflow_modal') {
                    console.log('✅ Approval modal submitted');
                    const messageInfo = JSON.parse(payload.view.private_metadata);
                    const { workflowId, channel, messageTs, agentId } = messageInfo;
                    const values = payload.view.state.values;
                    
                    const approvalReason = values.approval_reason_block?.approval_reason?.value || 'Approved via Slack';
                    const approver = payload.user?.username || payload.user?.name || 'Slack User';
                    
                    console.log(`✅ Processing approval for workflow ${workflowId} by ${approver}`);
                    console.log(`📝 Approval reason: ${approvalReason}`);
                    
                    try {
                        // Respond to Slack immediately
                        res.status(200).json({
                            "response_action": "clear"
                        });
                        
                        // Process approval asynchronously
                        setImmediate(async () => {
                            try {
                                await approvalFlowService.approveAndProgress(
                                    workflowId,
                                    approver,
                                    approvalReason
                                );
                                
                                console.log(`✅ Successfully approved workflow ${workflowId} by ${approver}`);
                                
                                // Update original message to show approval status
                                if (channel && messageTs) {
                                    await slackService.updateMessage(
                                        agentId,
                                        channel,
                                        messageTs,
                                        {
                                            workflowId,
                                            escalationReason: 'Approval request',
                                            approverRole: 'support_team',
                                            stepName: 'Approval Required',
                                            agentId: agentId,
                                            status: 'approved',
                                            actionBy: approver,
                                            response: approvalReason
                                        }
                                    );
                                }
                                
                            } catch (asyncError) {
                                console.error('❌ Error in async approval processing:', asyncError);
                            }
                        });
                        
                        return;
                    } catch (error) {
                        console.error('❌ Error processing approval:', error);
                        return res.json({
                            response_action: 'errors',
                            errors: {
                                'approval_reason_block': 'Failed to process approval. Please try again.'
                            }
                        });
                    }
                }

                // Handle rejection modal submission
                if (payload.type === 'view_submission' && payload.view?.callback_id === 'reject_workflow_modal') {
                    console.log('❌ Rejection modal submitted');
                    const messageInfo = JSON.parse(payload.view.private_metadata);
                    const { workflowId, channel, messageTs, agentId } = messageInfo;
                    const values = payload.view.state.values;
                    
                    const rejectionReason = values.rejection_reason_block?.rejection_reason?.value || 'Rejected via Slack';
                    const rejector = payload.user?.username || payload.user?.name || 'Slack User';
                    
                    console.log(`❌ Processing rejection for workflow ${workflowId} by ${rejector}`);
                    console.log(`📝 Rejection reason: ${rejectionReason}`);
                    
                    try {
                        // Respond to Slack immediately
                        res.status(200).json({
                            "response_action": "clear"
                        });
                        
                        // Process rejection asynchronously
                        setImmediate(async () => {
                            try {
                                await approvalFlowService.rejectWorkflow(
                                    workflowId,
                                    rejector,
                                    rejectionReason
                                );
                                
                                console.log(`❌ Successfully rejected workflow ${workflowId} by ${rejector}`);
                                
                                // Update original message to show rejection status
                                if (channel && messageTs) {
                                    await slackService.updateMessage(
                                        agentId,
                                        channel,
                                        messageTs,
                                        {
                                            workflowId,
                                            escalationReason: 'Approval request',
                                            approverRole: 'support_team',
                                            stepName: 'Approval Required',
                                            agentId: agentId,
                                            status: 'rejected',
                                            actionBy: rejector,
                                            response: rejectionReason
                                        }
                                    );
                                }
                                
                            } catch (asyncError) {
                                console.error('❌ Error in async rejection processing:', asyncError);
                            }
                        });
                        
                        return;
                    } catch (error) {
                        console.error('❌ Error processing rejection:', error);
                        return res.json({
                            response_action: 'errors',
                            errors: {
                                'rejection_reason_block': 'Failed to process rejection. Please try again.'
                            }
                        });
                    }
                }
            }
            const { action, conversationId, workflowId, response, approver, formResponse } = req.body;
            
            console.log('📥 Slack webhook received:', { action, conversationId });
            
            if (!action || !conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "Action and conversationId are required",
                });
            }
            
            // Use approval flow service if workflowId provided, otherwise emit legacy event
            if (workflowId) {
                // New workflow-based approval with automatic Slack notifications
                if (action === 'approve') {
                    await approvalFlowService.approveAndProgress(
                        workflowId,
                        approver || 'Slack User',
                        response || 'Approved via Slack'
                    );
                } else if (action === 'reject') {
                    await approvalFlowService.rejectWorkflow(
                        workflowId,
                        approver || 'Slack User',
                        response || 'Rejected via Slack'
                    );
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid action. Must be 'approve' or 'reject'",
                    });
                }
            } else {
                // Legacy event-based approval (backward compatibility)
                if (action === 'approve') {
                    workflowEvents.emit('workflow:approved', {
                        conversationId,
                        response: response || 'Approved by team',
                        approver: approver || 'Unknown',
                        timestamp: new Date().toISOString()
                    });
                } else if (action === 'reject') {
                    workflowEvents.emit('workflow:rejected', {
                        conversationId,
                        reason: response || 'Rejected by team',
                        approver: approver || 'Unknown',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid action. Must be 'approve' or 'reject'",
                    });
                }
            }
            
            return res.json({ 
                success: true,
                message: `Workflow ${action}d successfully`
            });
        } catch (error) {
            console.error("Slack webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Webhook for email responses
    router.post("/email", async (req, res) => {
        try {
            const { action, conversationId, workflowId, response, approver, token, formResponse } = req.body;
            
            console.log('📧 Email webhook received:', { action, conversationId });
            
            // TODO: Verify token for security
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or missing token",
                });
            }
            
            if (!action || !conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "Action and conversationId are required",
                });
            }
            
            // Use approval flow service if workflowId provided
            if (workflowId) {
                if (action === 'approve') {
                    await approvalFlowService.approveAndProgress(
                        workflowId,
                        approver || 'Email User',
                        response || 'Approved via email'
                    );
                } else if (action === 'reject') {
                    await approvalFlowService.rejectWorkflow(
                        workflowId,
                        approver || 'Email User',
                        response || 'Rejected via email'
                    );
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid action. Must be 'approve' or 'reject'",
                    });
                }
            } else {
                // Legacy event-based approval
                if (action === 'approve') {
                    workflowEvents.emit('workflow:approved', {
                        conversationId,
                        response: response || 'Approved via email',
                        approver: approver || 'Email User',
                        timestamp: new Date().toISOString()
                    });
                } else if (action === 'reject') {
                    workflowEvents.emit('workflow:rejected', {
                        conversationId,
                        reason: response || 'Rejected via email',
                        approver: approver || 'Email User',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid action. Must be 'approve' or 'reject'",
                    });
                }
            }
            
            return res.json({ 
                success: true,
                message: `Workflow ${action}d successfully`
            });
        } catch (error) {
            console.error("Email webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Generic webhook for external systems
    router.post("/external", async (req, res) => {
        try {
            const { action, conversationId, workflowId, response, approver, apiKey, formResponse } = req.body;
            
            console.log('🔗 External webhook received:', { action, conversationId });
            
            // TODO: Verify API key
            if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid API key",
                });
            }
            
            if (!action || !conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "Action and conversationId are required",
                });
            }
            
            // Use approval flow service if workflowId provided
            if (workflowId) {
                if (action === 'approve') {
                    await approvalFlowService.approveAndProgress(
                        workflowId,
                        approver || 'External System',
                        response || 'Approved via external system'
                    );
                } else if (action === 'reject') {
                    await approvalFlowService.rejectWorkflow(
                        workflowId,
                        approver || 'External System',
                        response || 'Rejected via external system'
                    );
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid action. Must be 'approve' or 'reject'",
                    });
                }
            } else {
                // Legacy event-based approval
                if (action === 'approve') {
                    workflowEvents.emit('workflow:approved', {
                        conversationId,
                        response: response || 'Approved by external system',
                        approver: approver || 'External System',
                        timestamp: new Date().toISOString()
                    });
                } else if (action === 'reject') {
                    workflowEvents.emit('workflow:rejected', {
                        conversationId,
                        reason: response || 'Rejected by external system',
                        approver: approver || 'External System',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid action. Must be 'approve' or 'reject'",
                    });
                }
            }
            
            return res.json({ 
                success: true,
                message: `Workflow ${action}d successfully`
            });
        } catch (error) {
            console.error("External webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // Health check for webhooks
    router.get("/health", (req, res) => {
        return res.json({
            success: true,
            message: "Webhook service is healthy",
            timestamp: new Date().toISOString()
        });
    });

    return router;
}
