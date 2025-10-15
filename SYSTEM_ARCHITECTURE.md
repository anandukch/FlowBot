# System Architecture - Complete Approval Mechanism

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────────┐              ┌──────────────────┐            │
│  │ Approval         │              │ Dynamic          │            │
│  │ Dashboard        │              │ Approval Form    │            │
│  │                  │              │                  │            │
│  │ - Pending queue  │              │ - 8 field types  │            │
│  │ - Completed list │              │ - Validation     │            │
│  │ - Progress view  │              │ - Approve/Reject │            │
│  └──────────────────┘              └──────────────────┘            │
│           │                                  │                      │
│           └──────────────┬───────────────────┘                      │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                         SERVER LAYER                                 │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────┐               │
│  │           API Routes (/api/approvals)            │               │
│  │                                                   │               │
│  │  - POST /workflows           (create)            │               │
│  │  - GET  /workflows/:id       (retrieve)          │               │
│  │  - POST /workflows/:id/approve                   │               │
│  │  - POST /workflows/:id/reject                    │               │
│  │  - POST /workflows/:id/delegate                  │               │
│  │  - POST /workflows/:id/rollback                  │               │
│  │  - GET  /templates/:agentId                      │               │
│  │  - POST /templates                               │               │
│  └───────────────────────┬───────────────────────────┘               │
│                          │                                           │
│  ┌───────────────────────▼───────────────────────────┐              │
│  │         Webhook Routes (/api/webhook)             │              │
│  │                                                    │              │
│  │  - POST /slack      (Slack approvals)             │              │
│  │  - POST /email      (Email approvals)             │              │
│  │  - POST /external   (External system approvals)   │              │
│  └───────────────────────┬───────────────────────────┘              │
│                          │                                           │
│  ┌───────────────────────▼───────────────────────────┐              │
│  │            Workflow Service                       │              │
│  │                                                    │              │
│  │  Business Logic:                                  │              │
│  │  - createWorkflow()                               │              │
│  │  - approveStep()                                  │              │
│  │  - rejectStep()                                   │              │
│  │  - delegateApproval()                             │              │
│  │  - rollbackWorkflow()                             │              │
│  │  - checkTimeouts()                                │              │
│  └───────────────────────┬───────────────────────────┘              │
│                          │                                           │
│  ┌───────────────────────▼───────────────────────────┐              │
│  │              Agent Service                        │              │
│  │                                                    │              │
│  │  - Detects escalation                             │              │
│  │  - Creates workflow automatically                 │              │
│  │  - Uses templates                                 │              │
│  └───────────────────────┬───────────────────────────┘              │
│                          │                                           │
│  ┌───────────────────────▼───────────────────────────┐              │
│  │           Event Emitter (workflowEvents)          │              │
│  │                                                    │              │
│  │  Events:                                          │              │
│  │  - workflow:created                               │              │
│  │  - workflow:step_advanced                         │              │
│  │  - workflow:approved                              │              │
│  │  - workflow:rejected                              │              │
│  │  - workflow:delegated                             │              │
│  │  - workflow:rolled_back                           │              │
│  │  - workflow:timeout                               │              │
│  └───────────────────────┬───────────────────────────┘              │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                      DATABASE LAYER                                  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Workflows      │  │ Approval         │  │ Conversations    │ │
│  │   Collection     │  │ Templates        │  │ Collection       │ │
│  │                  │  │ Collection       │  │                  │ │
│  │ - workflowId     │  │ - templateId     │  │ - conversationId │ │
│  │ - status         │  │ - steps[]        │  │ - messages[]     │ │
│  │ - steps[]        │  │ - deadlines      │  │ - config         │ │
│  │ - stateHistory[] │  │ - permissions    │  │ - agentId        │ │
│  │ - deadline       │  │                  │  │                  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                      │
│                        MongoDB Database                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Approval Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────────┘

1. ESCALATION TRIGGER
   ┌──────────────┐
   │ User Message │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Agent Detects│
   │ Escalation   │
   └──────┬───────┘
          │
          ▼

2. WORKFLOW CREATION
   ┌──────────────────────────────┐
   │ WorkflowService.create()     │
   │                              │
   │ - Load template              │
   │ - Initialize steps           │
   │ - Set deadline               │
   │ - Create state snapshot      │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────┐
   │ Status:      │
   │ PENDING      │
   └──────┬───────┘
          │
          ▼

3. APPROVAL PROCESS (Multi-Step)
   
   Step 1: Manager Review
   ┌─────────────────────────────┐
   │ Approver: manager@co.com    │
   │ Form Fields:                │
   │  - Budget approved? ☑       │
   │  - Comments: [text]         │
   └──────┬──────────────────────┘
          │
          ├─── APPROVE ──────────┐
          │                      │
          │                      ▼
          │              ┌───────────────┐
          │              │ Status:       │
          │              │ IN_PROGRESS   │
          │              │ currentStep++ │
          │              └───────┬───────┘
          │                      │
          │                      ▼
          │              Step 2: Director Review
          │              ┌─────────────────────────────┐
          │              │ Approver: director@co.com   │
          │              │ Form Fields:                │
          │              │  - Priority: [select]       │
          │              │  - Comments: [text]         │
          │              └──────┬──────────────────────┘
          │                     │
          │                     ├─── APPROVE ──────────┐
          │                     │                      │
          │                     │                      ▼
          │                     │              ┌───────────────┐
          │                     │              │ Status:       │
          │                     │              │ IN_PROGRESS   │
          │                     │              │ currentStep++ │
          │                     │              └───────┬───────┘
          │                     │                      │
          │                     │                      ▼
          │                     │              Step 3: CFO Approval
          │                     │              ┌─────────────────────────────┐
          │                     │              │ Approver: cfo@co.com        │
          │                     │              │ Form Fields:                │
          │                     │              │  - Amount: [number]         │
          │                     │              │  - Final approval: ☑        │
          │                     │              └──────┬──────────────────────┘
          │                     │                     │
          │                     │                     ├─── APPROVE ──────────┐
          │                     │                     │                      │
          │                     │                     │                      ▼
          │                     │                     │              ┌───────────────┐
          │                     │                     │              │ Status:       │
          │                     │                     │              │ APPROVED ✅   │
          │                     │                     │              │ Workflow Done │
          │                     │                     │              └───────────────┘
          │                     │                     │
          │                     │                     └─── REJECT ──────────┐
          │                     │                                           │
          │                     └─── REJECT ──────────┐                     │
          │                                           │                     │
          └─── REJECT ──────────┐                     │                     │
                                │                     │                     │
                                ▼                     ▼                     ▼
                         ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
                         │ Status:       │    │ Status:       │    │ Status:       │
                         │ REJECTED ❌   │    │ REJECTED ❌   │    │ REJECTED ❌   │
                         │ Workflow Done │    │ Workflow Done │    │ Workflow Done │
                         └───────────────┘    └───────────────┘    └───────────────┘

4. SPECIAL ACTIONS

   DELEGATE:
   ┌─────────────────────────────┐
   │ Current: manager@co.com     │
   │ Delegate to: senior@co.com  │
   │ Reason: On vacation         │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Step status: DELEGATED      │
   │ New approver: senior@co.com │
   └─────────────────────────────┘

   ROLLBACK:
   ┌─────────────────────────────┐
   │ Triggered by: admin@co.com  │
   │ Action: Rollback to prev    │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Restore from state snapshot │
   │ currentStep--               │
   │ Status reverted             │
   └─────────────────────────────┘

   TIMEOUT:
   ┌─────────────────────────────┐
   │ Deadline passed             │
   │ No approval received        │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Status: TIMEOUT ⏰          │
   │ Workflow terminated         │
   └─────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

1. USER INTERACTION
   User sends message
        │
        ▼
   Agent processes
        │
        ▼
   Escalation detected
        │
        ▼

2. WORKFLOW CREATION
   ┌─────────────────────────────────────┐
   │ WorkflowService.createWorkflow()    │
   │                                     │
   │ Input:                              │
   │  - conversationId                   │
   │  - agentId                          │
   │  - originalMessage                  │
   │  - escalationReason                 │
   │  - templateId (optional)            │
   │                                     │
   │ Process:                            │
   │  1. Load template or use default    │
   │  2. Clone steps from template       │
   │  3. Set deadline                    │
   │  4. Create initial state snapshot   │
   │  5. Save to database                │
   │  6. Emit 'workflow:created' event   │
   │                                     │
   │ Output:                             │
   │  - Workflow object with ID          │
   └─────────────────────────────────────┘
        │
        ▼

3. NOTIFICATION
   Event emitted → SSE → User notified
        │
        ▼

4. APPROVAL ACTION
   ┌─────────────────────────────────────┐
   │ Approver receives notification      │
   │  (via Slack/Email/UI)               │
   └─────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────┐
   │ Approver submits decision           │
   │                                     │
   │ Via Webhook:                        │
   │  POST /api/webhook/slack            │
   │  {                                  │
   │    action: "approve",               │
   │    workflowId: "wf_123",            │
   │    approver: "user@co.com",         │
   │    formResponse: {...}              │
   │  }                                  │
   │                                     │
   │ Via UI:                             │
   │  POST /api/approvals/workflows/     │
   │       wf_123/approve                │
   │  {                                  │
   │    approver: "user@co.com",         │
   │    formResponse: {...}              │
   │  }                                  │
   └─────────────────────────────────────┘
        │
        ▼

5. STATE TRANSITION
   ┌─────────────────────────────────────┐
   │ WorkflowService.approveStep()       │
   │                                     │
   │ Process:                            │
   │  1. Load workflow from DB           │
   │  2. Validate current state          │
   │  3. Create state snapshot           │
   │  4. Update current step status      │
   │  5. Save form response              │
   │  6. Check if last step              │
   │     - Yes: Mark APPROVED            │
   │     - No: Advance to next step      │
   │  7. Save to database                │
   │  8. Emit event                      │
   │                                     │
   │ Events emitted:                     │
   │  - workflow:step_advanced (if next) │
   │  - workflow:approved (if complete)  │
   └─────────────────────────────────────┘
        │
        ▼

6. NOTIFICATION & UPDATE
   ┌─────────────────────────────────────┐
   │ Event listeners react               │
   │                                     │
   │ - SSE sends update to user          │
   │ - Next approver notified (if any)   │
   │ - Dashboard refreshes               │
   │ - Logs updated                      │
   └─────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                      WORKFLOWS COLLECTION                            │
└─────────────────────────────────────────────────────────────────────┘

{
  _id: ObjectId,
  workflowId: "wf_1729012345_abc123",          // Unique identifier
  conversationId: "conv_456",                   // Link to conversation
  agentId: "agent_123",                         // Owner agent
  status: "in_progress",                        // Workflow status
  templateId: "agent_123_multi_step_approval",  // Template used
  currentStep: 1,                               // Current step index
  
  steps: [                                      // Approval steps
    {
      stepNumber: 1,
      stepName: "Manager Review",
      approverRole: "manager",
      approverEmail: "manager@company.com",
      status: "approved",
      approvedBy: "manager@company.com",
      approvedAt: ISODate("2025-10-15T10:30:00Z"),
      response: "Approved - budget available",
      formFields: [...],                        // Field definitions
      formResponse: {                           // User's responses
        "budget_approved": true,
        "manager_comments": "Looks good"
      }
    },
    {
      stepNumber: 2,
      stepName: "Director Review",
      approverRole: "director",
      approverEmail: "director@company.com",
      status: "pending",
      formFields: [...]
    }
  ],
  
  originalMessage: "Purchase request for $5000",
  escalationReason: "Amount exceeds approval limit",
  
  metadata: {                                   // Custom data
    hasEmail: true,
    userEmail: "customer@example.com"
  },
  
  stateHistory: [                               // For rollback
    {
      timestamp: ISODate("2025-10-15T10:00:00Z"),
      status: "pending",
      currentStep: 0,
      data: {...},
      triggeredBy: "system",
      action: "workflow_created"
    },
    {
      timestamp: ISODate("2025-10-15T10:30:00Z"),
      status: "in_progress",
      currentStep: 1,
      data: {...},
      triggeredBy: "manager@company.com",
      action: "step_approved"
    }
  ],
  
  deadline: ISODate("2025-10-18T10:00:00Z"),
  createdAt: ISODate("2025-10-15T10:00:00Z"),
  updatedAt: ISODate("2025-10-15T10:30:00Z")
}

┌─────────────────────────────────────────────────────────────────────┐
│                  APPROVAL_TEMPLATES COLLECTION                       │
└─────────────────────────────────────────────────────────────────────┘

{
  _id: ObjectId,
  templateId: "agent_123_multi_step_approval",
  templateName: "Multi-Step Approval",
  description: "Three-tier approval chain",
  agentId: "agent_123",
  
  steps: [
    {
      stepNumber: 1,
      stepName: "Manager Review",
      approverRole: "manager",
      formFields: [
        {
          id: "budget_approved",
          type: "checkbox",
          label: "Budget Approved",
          required: true
        },
        {
          id: "manager_comments",
          type: "textarea",
          label: "Manager Comments",
          required: false
        }
      ]
    },
    {
      stepNumber: 2,
      stepName: "Director Review",
      approverRole: "director",
      formFields: [...]
    },
    {
      stepNumber: 3,
      stepName: "CFO Final Approval",
      approverRole: "cfo",
      formFields: [...]
    }
  ],
  
  globalDeadlineHours: 72,
  allowDelegation: true,
  allowSkip: false,
  notifyOnEachStep: true,
  isActive: true,
  
  createdAt: ISODate("2025-10-15T09:00:00Z"),
  updatedAt: ISODate("2025-10-15T09:00:00Z")
}
```

---

## 🎯 Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT INTERACTIONS                            │
└─────────────────────────────────────────────────────────────────────┘

AgentService
    │
    ├─► WorkflowService.createWorkflow()
    │       │
    │       ├─► ApprovalTemplate.findOne()
    │       ├─► Workflow.create()
    │       └─► workflowEvents.emit('workflow:created')
    │
    └─► MemoryService.addMessage()

WebhookRoutes
    │
    ├─► WorkflowService.approveStep()
    │       │
    │       ├─► Workflow.findOne()
    │       ├─► workflow.addStateSnapshot()
    │       ├─► Workflow.save()
    │       └─► workflowEvents.emit('workflow:approved')
    │
    └─► WorkflowService.rejectStep()
            │
            ├─► Workflow.findOne()
            ├─► workflow.addStateSnapshot()
            ├─► Workflow.save()
            └─► workflowEvents.emit('workflow:rejected')

ApprovalRoutes
    │
    ├─► WorkflowService.getWorkflow()
    ├─► WorkflowService.getPendingWorkflowsForApprover()
    ├─► WorkflowService.delegateApproval()
    ├─► WorkflowService.rollbackWorkflow()
    └─► ApprovalTemplate.find()

ChatRoutes (SSE)
    │
    └─► workflowEvents.on('workflow:*')
            │
            └─► sendToUser() via SSE

ApprovalDashboard (UI)
    │
    ├─► GET /api/approvals/pending/:email
    └─► Displays workflows

DynamicApprovalForm (UI)
    │
    ├─► POST /api/approvals/workflows/:id/approve
    └─► POST /api/approvals/workflows/:id/reject
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION LAYER
   ┌─────────────────────────────────────┐
   │ JWT Token Verification              │
   │  - authMiddleware()                 │
   │  - Cookie-based auth                │
   │  - Token expiration check           │
   └─────────────────────────────────────┘

2. AUTHORIZATION LAYER
   ┌─────────────────────────────────────┐
   │ Role-Based Access Control           │
   │  - Approver verification            │
   │  - Agent ownership check            │
   │  - Workflow access validation       │
   └─────────────────────────────────────┘

3. WEBHOOK SECURITY
   ┌─────────────────────────────────────┐
   │ Channel-Specific Verification       │
   │  - Slack: Signature verification    │
   │  - Email: Token validation          │
   │  - External: API key check          │
   └─────────────────────────────────────┘

4. INPUT VALIDATION
   ┌─────────────────────────────────────┐
   │ Data Sanitization                   │
   │  - Form field validation            │
   │  - Type checking                    │
   │  - Pattern matching                 │
   │  - Required field enforcement       │
   └─────────────────────────────────────┘

5. AUDIT TRAIL
   ┌─────────────────────────────────────┐
   │ Complete Action Logging             │
   │  - State snapshots                  │
   │  - Approver tracking                │
   │  - Timestamp logging                │
   │  - Action history                   │
   └─────────────────────────────────────┘
```

---

*System Architecture Documentation*  
*Last Updated: October 15, 2025*  
*Version: 1.0 - Production Ready*
