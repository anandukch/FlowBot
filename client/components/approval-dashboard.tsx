"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, AlertCircle, User, ArrowRight, Loader2, UserPlus } from "lucide-react"

interface ApprovalStep {
  stepNumber: number
  stepName: string
  approverRole: string
  approverEmail?: string
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'delegated'
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  response?: string
  delegatedTo?: string
  formFields?: any[]
  formResponse?: Record<string, any>
}

interface Workflow {
  workflowId: string
  conversationId: string
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'cancelled' | 'in_progress'
  currentStep: number
  steps: ApprovalStep[]
  originalMessage: string
  escalationReason: string
  createdAt: string
  deadline?: string
}

export function ApprovalDashboard({ approverEmail }: { approverEmail: string }) {
  const [pendingWorkflows, setPendingWorkflows] = useState<Workflow[]>([])
  const [completedWorkflows, setCompletedWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    if (approverEmail) {
      fetchAllWorkflows()
    }
  }, [approverEmail])

  const fetchAllWorkflows = async () => {
    try {
      setLoading(true)
      const { approvalAPI } = await import('@/lib/api')
      
      // Fetch both pending and completed workflows
      const [pendingResponse, completedResponse] = await Promise.all([
        approvalAPI.getPendingApprovals(approverEmail),
        approvalAPI.getCompletedApprovals(approverEmail)
      ])
      
      if (pendingResponse.data.success) {
        setPendingWorkflows(pendingResponse.data.workflows)
      }
      
      if (completedResponse.data.success) {
        setCompletedWorkflows(completedResponse.data.workflows)
      }
    } catch (error) {
      console.error("Error fetching workflows:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingWorkflows = fetchAllWorkflows

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
      in_progress: 'outline',
      timeout: 'destructive',
      cancelled: 'secondary'
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  // No need to filter since we have separate arrays now

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading approvals...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Approval Dashboard</h2>
          <p className="text-muted-foreground">Manage your pending approvals</p>
        </div>
        <Button onClick={fetchAllWorkflows} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedWorkflows.filter(w => w.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedWorkflows.filter(w => w.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingWorkflows.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedWorkflows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingWorkflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            pendingWorkflows.map((workflow) => (
              <WorkflowCard 
                key={workflow.workflowId} 
                workflow={workflow} 
                onAction={fetchAllWorkflows}
                approverEmail={approverEmail}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedWorkflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-muted-foreground">No completed approvals</p>
              </CardContent>
            </Card>
          ) : (
            completedWorkflows.map((workflow) => (
              <WorkflowCard 
                key={workflow.workflowId} 
                workflow={workflow} 
                readonly 
                approverEmail={approverEmail}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WorkflowCard({ 
  workflow, 
  readonly = false,
  onAction,
  approverEmail
}: { 
  workflow: Workflow
  readonly?: boolean
  onAction?: () => void
  approverEmail?: string
}) {
  const currentStep = workflow.steps[workflow.currentStep]
  const [showDetails, setShowDetails] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [showDelegationForm, setShowDelegationForm] = useState(false)
  const [response, setResponse] = useState("")
  const [delegateTo, setDelegateTo] = useState("")
  const [delegationReason, setDelegationReason] = useState("")
  const [processing, setProcessing] = useState(false)
  
  // Check if current user can take action on this workflow
  const canTakeAction = () => {
    if (readonly || !currentStep || !approverEmail) return false
    
    // User can only act if:
    // 1. Current step is pending OR delegated to them
    // 2. Current step is assigned to this user
    // 3. Workflow is in pending/in_progress status
    return (
      (currentStep.status === 'pending' || currentStep.status === 'delegated') &&
      currentStep.approverEmail === approverEmail &&
      (workflow.status === 'pending' || workflow.status === 'in_progress')
    )
  }
  
  // Check if user has already acted on the CURRENT step
  const getUserStepStatus = () => {
    // Only check if the current step is already completed by this user
    if (!currentStep || !approverEmail) return null
    
    // If current step is completed by this user, they can't act again
    if (currentStep.approverEmail === approverEmail && 
        (currentStep.status === 'approved' || currentStep.status === 'rejected')) {
      return currentStep
    }
    
    return null
  }
  
  const userCompletedStep = getUserStepStatus()
  const canAct = canTakeAction()

  const handleApprove = async () => {
    try {
      setProcessing(true)
      const { approvalAPI } = await import('@/lib/api')
      
      await approvalAPI.approveStep(
        workflow.workflowId,
        currentStep?.approverEmail || "user@example.com",
        response || "Approved",
        {}
      )
      
      setResponse("")
      setShowApprovalForm(false)
      onAction?.()
    } catch (error) {
      console.error("Error approving:", error)
      alert("Failed to approve. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      setProcessing(true)
      const { approvalAPI } = await import('@/lib/api')
      
      await approvalAPI.rejectStep(
        workflow.workflowId,
        currentStep?.approverEmail || "user@example.com",
        response || "Rejected",
        {}
      )
      
      setResponse("")
      setShowApprovalForm(false)
      onAction?.()
    } catch (error) {
      console.error("Error rejecting:", error)
      alert("Failed to reject. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleDelegate = async () => {
    if (!delegateTo.trim()) {
      alert("Please enter an email address to delegate to.")
      return
    }

    try {
      setProcessing(true)
      const { approvalAPI } = await import('@/lib/api')
      
      await approvalAPI.delegateApproval(
        workflow.workflowId,
        currentStep?.approverEmail || approverEmail || "user@example.com",
        delegateTo,
        delegationReason || "Delegated approval"
      )
      
      setDelegateTo("")
      setDelegationReason("")
      setShowDelegationForm(false)
      onAction?.()
    } catch (error) {
      console.error("Error delegating:", error)
      alert("Failed to delegate. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {workflow.escalationReason}
            </CardTitle>
            <CardDescription>
              Workflow ID: {workflow.workflowId.slice(0, 16)}...
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {workflow.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {workflow.status === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
            {workflow.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
            {workflow.status === 'in_progress' && <AlertCircle className="w-5 h-5 text-blue-500" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <strong>Original Message:</strong> {workflow.originalMessage}
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {(() => {
                const completedSteps = workflow.steps.filter(s => s.status === 'approved' || s.status === 'rejected').length;
                if (completedSteps === workflow.steps.length) {
                  return `Completed (${workflow.steps.length}/${workflow.steps.length})`;
                } else {
                  return `Step ${completedSteps + 1} of ${workflow.steps.length}`;
                }
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {workflow.steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className={`flex-1 h-2 rounded-full ${
                  step.status === 'approved' ? 'bg-green-500' :
                  step.status === 'rejected' ? 'bg-red-500' :
                  step.status === 'delegated' ? 'bg-blue-400' :
                  step.status === 'pending' && index === workflow.currentStep ? 'bg-blue-500' :
                  'bg-gray-200'
                }`} />
                {index < workflow.steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-1 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Info */}
        {currentStep && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{currentStep.stepName}</div>
              <Badge variant="outline">{currentStep.approverRole}</Badge>
            </div>
            {currentStep.approverEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {currentStep.approverEmail}
              </div>
            )}
          </div>
        )}

        {/* Deadline */}
        {workflow.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Deadline: {new Date(workflow.deadline).toLocaleString()}
          </div>
        )}
          

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {!readonly ? (
            <>
              {/* Show different UI based on user permissions */}
              {userCompletedStep ? (
                // User has already completed their step
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      You have already {userCompletedStep.status} this workflow
                    </span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Step {userCompletedStep.stepNumber}: {userCompletedStep.stepName}
                  </div>
                </div>
              ) : canAct ? (
              // User can take action on current step
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      setShowApprovalForm(!showApprovalForm)
                      setShowDelegationForm(false)
                    }}
                    disabled={processing}
                  >
                    {showApprovalForm ? 'Cancel' : 'Take Action'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowDelegationForm(!showDelegationForm)
                      setShowApprovalForm(false)
                    }}
                    disabled={processing}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Delegate
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide' : 'View'} Details
                  </Button>
                </div>
              </div>
              ) : (
                // User cannot act (waiting for previous steps or not their turn)
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {currentStep?.approverEmail === approverEmail 
                        ? "Waiting for previous steps to complete"
                        : "Not your turn yet"
                      }
                    </span>
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Current step: {currentStep?.stepName} ({currentStep?.approverRole})
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-2"
                    size="sm"
                  >
                    {showDetails ? 'Hide' : 'View'} Details
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Readonly mode (completed workflows) - still allow viewing details
            <div className="flex justify-center">
              <Button 
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                size="sm"
              >
                {showDetails ? 'Hide' : 'View'} Details
              </Button>
            </div>
          )}

            {/* Approval Form */}
            {!readonly && showApprovalForm && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="response">Comments (Optional)</Label>
                  <Textarea
                    id="response"
                    placeholder="Add your comments here..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleReject}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Delegation Form */}
            {!readonly && showDelegationForm && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">Delegate Approval</span>
                </div>
                <div>
                  <Label htmlFor="delegateTo">Delegate to (Email)</Label>
                  <input
                    id="delegateTo"
                    type="email"
                    placeholder="colleague@company.com"
                    value={delegateTo}
                    onChange={(e) => setDelegateTo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="delegationReason">Reason (Optional)</Label>
                  <Textarea
                    id="delegationReason"
                    placeholder="Why are you delegating this approval?"
                    value={delegationReason}
                    onChange={(e) => setDelegationReason(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDelegate}
                    disabled={processing || !delegateTo.trim()}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Delegating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Delegate
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setShowDelegationForm(false)}
                    variant="outline"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="border-t pt-4 space-y-4">
            {workflow.steps.map((step, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  index === workflow.currentStep 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {step.stepNumber}. {step.stepName}
                  </div>
                  <Badge variant={
                    step.status === 'approved' ? 'default' :
                    step.status === 'rejected' ? 'destructive' :
                    step.status === 'pending' ? 'secondary' :
                    'outline'
                  }>
                    {step.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Role: {step.approverRole}
                </div>
                {step.approvedBy && (
                  <div className="text-sm text-green-600 mt-1">
                    ✓ Approved by {step.approvedBy} at {new Date(step.approvedAt!).toLocaleString()}
                  </div>
                )}
                {step.rejectedBy && (
                  <div className="text-sm text-red-600 mt-1">
                    ✗ Rejected by {step.rejectedBy} at {new Date(step.rejectedAt!).toLocaleString()}
                  </div>
                )}
                {step.response && (
                  <div className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                    <strong className="text-gray-900 dark:text-gray-100">Response:</strong> 
                    <span className="text-gray-800 dark:text-gray-200 ml-1">{step.response}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
