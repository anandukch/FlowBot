import express, { Router } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { approvalFlowService } from '../services/approval-flow.service';
import ApprovalTemplate from "../models/approval-template.model";
import authMiddleware from "../middlewares/authMiddleware";

export function createApprovalRoutes(): Router {
    const router = Router();
    const workflowService = new WorkflowService();

    // ==================== WORKFLOW MANAGEMENT ====================

    /**
     * Create a new workflow
     * POST /api/approvals/workflows
     */
    router.post("/workflows", authMiddleware(), async (req, res) => {
        try {
            const { conversationId, agentId, originalMessage, escalationReason, templateId, metadata } = req.body;

            if (!conversationId || !agentId || !originalMessage || !escalationReason) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: conversationId, agentId, originalMessage, escalationReason"
                });
            }

            const workflow = await workflowService.createWorkflow({
                conversationId,
                agentId,
                originalMessage,
                escalationReason,
                templateId,
                metadata
            });

            return res.json({
                success: true,
                workflow: {
                    workflowId: workflow.workflowId,
                    status: workflow.status,
                    currentStep: workflow.currentStep,
                    totalSteps: workflow.steps.length,
                    deadline: workflow.deadline,
                    steps: workflow.steps
                }
            });
        } catch (error: any) {
            console.error("Create workflow error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to create workflow"
            });
        }
    });

    /**
     * Get workflow by ID
     * GET /api/approvals/workflows/:workflowId
     */
    router.get("/workflows/:workflowId", authMiddleware(), async (req, res) => {
        try {
            const { workflowId } = req.params;
            const workflow = await workflowService.getWorkflow(workflowId);

            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    message: "Workflow not found"
                });
            }

            return res.json({
                success: true,
                workflow
            });
        } catch (error: any) {
            console.error("Get workflow error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get workflow"
            });
        }
    });

    /**
     * Get workflows by conversation ID
     * GET /api/approvals/workflows/conversation/:conversationId
     */
    router.get("/workflows/conversation/:conversationId", authMiddleware(), async (req, res) => {
        try {
            const { conversationId } = req.params;
            const workflows = await workflowService.getWorkflowsByConversation(conversationId);

            return res.json({
                success: true,
                workflows,
                count: workflows.length
            });
        } catch (error: any) {
            console.error("Get workflows by conversation error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get workflows"
            });
        }
    });

    /**
     * Get pending workflows for approver
     * GET /api/approvals/pending/:approverEmail
     */
    router.get("/pending/:approverEmail", authMiddleware(), async (req, res) => {
        try {
            const { approverEmail } = req.params;
            const workflows = await workflowService.getPendingWorkflowsForApprover(approverEmail);

            return res.json({
                success: true,
                workflows,
                count: workflows.length
            });
        } catch (error: any) {
            console.error("Get pending workflows error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get pending workflows"
            });
        }
    });

    /**
     * Get completed workflows for approver
     * GET /api/approvals/completed/:approverEmail
     */
    router.get("/completed/:approverEmail", authMiddleware(), async (req, res) => {
        try {
            const { approverEmail } = req.params;
            const workflows = await workflowService.getCompletedWorkflowsForApprover(approverEmail);

            return res.json({
                success: true,
                workflows,
                count: workflows.length
            });
        } catch (error: any) {
            console.error("Get completed workflows error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get completed workflows"
            });
        }
    });

    // ==================== APPROVAL ACTIONS ====================

    /**
     * Approve current step
     * POST /api/approvals/workflows/:workflowId/approve
     */
    router.post("/workflows/:workflowId/approve", async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { approver, response, formResponse } = req.body;

            if (!approver) {
                return res.status(400).json({
                    success: false,
                    message: "Approver is required"
                });
            }

            const workflow = await approvalFlowService.approveAndProgress(workflowId, approver, response);

            return res.json({
                success: true,
                message: "Step approved successfully",
                workflow: {
                    workflowId: workflow.workflowId,
                    status: workflow.status,
                    currentStep: workflow.currentStep,
                    totalSteps: workflow.steps.length
                }
            });
        } catch (error: any) {
            console.error("Approve step error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to approve step"
            });
        }
    });

    /**
     * Reject current step
     * POST /api/approvals/workflows/:workflowId/reject
     */
    router.post("/workflows/:workflowId/reject", async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { approver, response, formResponse } = req.body;

            if (!approver) {
                return res.status(400).json({
                    success: false,
                    message: "Approver is required"
                });
            }

            const workflow = await approvalFlowService.rejectWorkflow(workflowId, approver, response);

            return res.json({
                success: true,
                message: "Step rejected successfully",
                workflow: {
                    workflowId: workflow.workflowId,
                    status: workflow.status
                }
            });
        } catch (error: any) {
            console.error("Reject step error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to reject step"
            });
        }
    });

    /**
     * Delegate approval
     * POST /api/approvals/workflows/:workflowId/delegate
     */
    router.post("/workflows/:workflowId/delegate", authMiddleware(), async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { currentApprover, delegateTo, reason } = req.body;

            if (!currentApprover || !delegateTo) {
                return res.status(400).json({
                    success: false,
                    message: "currentApprover and delegateTo are required"
                });
            }

            const workflow = await approvalFlowService.delegateApproval(workflowId, currentApprover, delegateTo, reason);

            return res.json({
                success: true,
                message: "Approval delegated successfully",
                workflow: {
                    workflowId: workflow.workflowId,
                    delegatedTo: delegateTo
                }
            });
        } catch (error: any) {
            console.error("Delegate approval error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to delegate approval"
            });
        }
    });

    /**
     * Cancel workflow
     * POST /api/approvals/workflows/:workflowId/cancel
     */
    router.post("/workflows/:workflowId/cancel", authMiddleware(), async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { cancelledBy, reason } = req.body;

            if (!cancelledBy) {
                return res.status(400).json({
                    success: false,
                    message: "cancelledBy is required"
                });
            }

            const workflow = await workflowService.cancelWorkflow(workflowId, cancelledBy, reason);

            return res.json({
                success: true,
                message: "Workflow cancelled successfully",
                workflow: {
                    workflowId: workflow.workflowId,
                    status: workflow.status
                }
            });
        } catch (error: any) {
            console.error("Cancel workflow error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to cancel workflow"
            });
        }
    });

    /**
     * Rollback workflow
     * POST /api/approvals/workflows/:workflowId/rollback
     */
    router.post("/workflows/:workflowId/rollback", authMiddleware(), async (req, res) => {
        try {
            const { workflowId } = req.params;
            const { triggeredBy } = req.body;

            if (!triggeredBy) {
                return res.status(400).json({
                    success: false,
                    message: "triggeredBy is required"
                });
            }

            const workflow = await workflowService.rollbackWorkflow(workflowId, triggeredBy);

            return res.json({
                success: true,
                message: "Workflow rolled back successfully",
                workflow: {
                    workflowId: workflow.workflowId,
                    status: workflow.status,
                    currentStep: workflow.currentStep
                }
            });
        } catch (error: any) {
            console.error("Rollback workflow error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to rollback workflow"
            });
        }
    });

    // ==================== TEMPLATES ====================

    /**
     * Get all templates for an agent
     * GET /api/approvals/templates/:agentId
     */
    router.get("/templates/:agentId", authMiddleware(), async (req, res) => {
        try {
            const { agentId } = req.params;
            const templates = await ApprovalTemplate.find({ 
                agentId,
                isActive: true 
            }).exec();

            return res.json({
                success: true,
                templates,
                count: templates.length
            });
        } catch (error: any) {
            console.error("Get templates error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get templates"
            });
        }
    });

    /**
     * Get template by ID
     * GET /api/approvals/templates/detail/:templateId
     */
    router.get("/templates/detail/:templateId", authMiddleware(), async (req, res) => {
        try {
            const { templateId } = req.params;
            const template = await ApprovalTemplate.findOne({ templateId }).exec();

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: "Template not found"
                });
            }

            return res.json({
                success: true,
                template
            });
        } catch (error: any) {
            console.error("Get template error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get template"
            });
        }
    });

    /**
     * Create or update custom template
     * POST /api/approvals/templates
     */
    router.post("/templates", authMiddleware(), async (req, res) => {
        try {
            const { 
                templateId, 
                templateName, 
                description, 
                agentId, 
                steps, 
                globalDeadlineHours,
                allowDelegation,
                allowSkip,
                notifyOnEachStep
            } = req.body;

            if (!templateId || !templateName || !agentId || !steps || steps.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: templateId, templateName, agentId, steps"
                });
            }

            // Use upsert to create or update
            const template = await ApprovalTemplate.findOneAndUpdate(
                { templateId }, // Find by templateId
                {
                    templateId,
                    templateName,
                    description,
                    agentId,
                    steps,
                    globalDeadlineHours,
                    allowDelegation: allowDelegation !== undefined ? allowDelegation : true,
                    allowSkip: allowSkip !== undefined ? allowSkip : false,
                    notifyOnEachStep: notifyOnEachStep !== undefined ? notifyOnEachStep : true,
                    isActive: true
                },
                { 
                    new: true, // Return updated document
                    upsert: true, // Create if doesn't exist
                    runValidators: true // Run schema validation
                }
            ).exec();

            return res.json({
                success: true,
                message: template.isNew ? "Template created successfully" : "Template updated successfully",
                template
            });
        } catch (error: any) {
            console.error("Create/Update template error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to save template"
            });
        }
    });

    /**
     * Set template as default
     * PUT /api/approvals/templates/:templateId/default
     */
    router.put("/templates/:templateId/default", authMiddleware(), async (req, res) => {
        try {
            const { templateId } = req.params;
            
            console.log(`🎯 Setting template as default: ${templateId}`);
            
            // First, find the template to get the agentId
            const template = await ApprovalTemplate.findOne({ templateId }).exec();
            
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: "Template not found"
                });
            }
            
            // Remove default flag from all templates for this agent
            await ApprovalTemplate.updateMany(
                { agentId: template.agentId },
                { isDefault: false }
            ).exec();
            
            // Set this template as default
            const updatedTemplate = await ApprovalTemplate.findOneAndUpdate(
                { templateId },
                { isDefault: true },
                { new: true }
            ).exec();
            
            console.log(`✅ Template ${template.templateName} is now the default for agent ${template.agentId}`);

            return res.json({
                success: true,
                message: "Template set as default successfully",
                template: updatedTemplate
            });
        } catch (error: any) {
            console.error("Set default template error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to set default template"
            });
        }
    });

    /**
     * Delete template
     * DELETE /api/approvals/templates/:templateId
     */
    router.delete("/templates/:templateId", authMiddleware(), async (req, res) => {
        try {
            const { templateId } = req.params;
            
            console.log(`🗑️ Attempting to delete template: ${templateId}`);
            
            // First check if template exists
            const existingTemplate = await ApprovalTemplate.findOne({ templateId }).exec();
            
            if (!existingTemplate) {
                console.log(`❌ Template not found: ${templateId}`);
                return res.status(404).json({
                    success: false,
                    message: "Template not found"
                });
            }
            
            console.log(`✅ Found template: ${existingTemplate.templateName}, isActive: ${existingTemplate.isActive}`);
            
            // Soft delete by setting isActive to false
            const result = await ApprovalTemplate.findOneAndUpdate(
                { templateId },
                { isActive: false },
                { new: true }
            ).exec();

            console.log(`🔄 Update result: ${result ? 'Success' : 'Failed'}, isActive: ${result?.isActive}`);

            return res.json({
                success: true,
                message: "Template deleted successfully",
                template: result
            });
        } catch (error: any) {
            console.error("Delete template error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to delete template"
            });
        }
    });

    /**
     * Create default templates for agent
     * POST /api/approvals/templates/defaults/:agentId
     */
    router.post("/templates/defaults/:agentId", authMiddleware(), async (req, res) => {
        try {
            const { agentId } = req.params;
            
            // @ts-ignore - Static method exists
            await ApprovalTemplate.createDefaultTemplates(agentId);

            return res.json({
                success: true,
                message: "Default templates created successfully"
            });
        } catch (error: any) {
            console.error("Create default templates error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to create default templates"
            });
        }
    });

   
    router.get("/stats/:agentId", authMiddleware(), async (req, res) => {
        try {
            const { agentId } = req.params;
            const stats = await workflowService.getWorkflowStats(agentId);

            return res.json({
                success: true,
                stats
            });
        } catch (error: any) {
            console.error("Get workflow stats error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to get workflow statistics"
            });
        }
    });

    return router;
}
