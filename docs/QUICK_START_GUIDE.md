# Quick Start Guide - Approval System

## 🚀 Getting Started

### 1. Initialize Default Templates

When a new agent is created, initialize default approval templates:

```bash
POST /api/approvals/templates/defaults/:agentId
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/approvals/templates/defaults/agent_123 \
  -H "Cookie: token=YOUR_AUTH_TOKEN"
```

This creates 3 default templates:
- **Simple Approval** - Single-step, 24h deadline
- **Multi-Step Approval** - 3-tier chain, 72h deadline  
- **Urgent Approval** - Fast-track, 4h deadline

---

### 2. Automatic Workflow Creation

Workflows are **automatically created** when the agent escalates a conversation:

```typescript
// In agent.ts - handleEscalation()
const workflow = await this.workflowService.createWorkflow({
  conversationId,
  agentId,
  originalMessage,
  escalationReason: reason,
  templateId: `${agentId}_simple_approval`  // Uses simple template by default
});
```

**No manual intervention needed!** The agent handles this automatically.

---

### 3. Approving via Webhooks

#### Slack Webhook
```bash
POST /api/webhook/slack
Content-Type: application/json

{
  "action": "approve",
  "conversationId": "conv_123",
  "workflowId": "wf_1729012345_abc123",
  "approver": "manager@company.com",
  "response": "Approved - looks good!",
  "formResponse": {
    "comments": "Budget approved for Q1"
  }
}
```

#### Email Webhook
```bash
POST /api/webhook/email
Content-Type: application/json

{
  "action": "approve",
  "conversationId": "conv_123",
  "workflowId": "wf_1729012345_abc123",
  "approver": "director@company.com",
  "token": "secure_token_here",
  "response": "Approved via email",
  "formResponse": {
    "priority": "High"
  }
}
```

---

### 4. Using the Approval Dashboard (Frontend)

```tsx
import { ApprovalDashboard } from "@/components/approval-dashboard"

export default function ApprovalsPage() {
  return (
    <ApprovalDashboard approverEmail="manager@company.com" />
  )
}
```

**Features:**
- ✅ View pending approvals
- ✅ See completed approvals
- ✅ Track workflow progress
- ✅ View step details

---

### 5. Dynamic Approval Form

```tsx
import { DynamicApprovalForm } from "@/components/dynamic-approval-form"

const handleApprove = async (formResponse: any, response: string) => {
  await fetch(`/api/approvals/workflows/${workflowId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approver: 'user@company.com',
      response,
      formResponse
    })
  })
}

const handleReject = async (response: string) => {
  await fetch(`/api/approvals/workflows/${workflowId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approver: 'user@company.com',
      response
    })
  })
}

<DynamicApprovalForm
  workflowId={workflow.workflowId}
  stepName={currentStep.stepName}
  formFields={currentStep.formFields}
  onApprove={handleApprove}
  onReject={handleReject}
  approverEmail="user@company.com"
/>
```

---

## 📋 Common Use Cases

### Use Case 1: Simple Approval Flow

**Scenario:** Customer requests refund

1. Agent detects escalation needed
2. Workflow created automatically with simple template
3. Manager receives notification
4. Manager approves/rejects via webhook or UI
5. Customer notified via SSE

**Code:**
```typescript
// Automatic - no code needed!
// Agent handles escalation → workflow created → approver notified
```

---

### Use Case 2: Multi-Step Approval Chain

**Scenario:** Large purchase request ($10,000)

1. Create workflow with multi-step template
2. Step 1: Manager reviews budget
3. Step 2: Director sets priority
4. Step 3: CFO final approval
5. Each step can approve/reject/delegate

**Code:**
```typescript
POST /api/approvals/workflows
{
  "conversationId": "conv_456",
  "agentId": "agent_123",
  "originalMessage": "Purchase request for $10,000",
  "escalationReason": "Amount exceeds approval limit",
  "templateId": "agent_123_multi_step_approval"
}
```

---

### Use Case 3: Delegation

**Scenario:** Manager on vacation, delegates to senior manager

**Code:**
```bash
POST /api/approvals/workflows/wf_123/delegate
{
  "currentApprover": "manager@company.com",
  "delegateTo": "senior-manager@company.com",
  "reason": "On vacation until next week"
}
```

---

### Use Case 4: Rollback

**Scenario:** Approval given by mistake, need to undo

**Code:**
```bash
POST /api/approvals/workflows/wf_123/rollback
{
  "triggeredBy": "admin@company.com"
}
```

**Result:** Workflow returns to previous state, can re-approve

---

## 🎨 Creating Custom Templates

### Example: Two-Step IT Approval

```typescript
POST /api/approvals/templates
{
  "templateId": "agent_123_it_approval",
  "templateName": "IT Request Approval",
  "description": "Two-step approval for IT requests",
  "agentId": "agent_123",
  "steps": [
    {
      "stepNumber": 1,
      "stepName": "Team Lead Review",
      "approverRole": "team_lead",
      "approverEmail": "lead@company.com",
      "formFields": [
        {
          "id": "urgency",
          "type": "select",
          "label": "Urgency Level",
          "required": true,
          "options": ["Low", "Medium", "High", "Critical"]
        },
        {
          "id": "estimated_hours",
          "type": "number",
          "label": "Estimated Hours",
          "required": true,
          "validation": {
            "min": 1,
            "max": 100,
            "message": "Must be between 1-100 hours"
          }
        },
        {
          "id": "lead_comments",
          "type": "textarea",
          "label": "Comments",
          "required": false
        }
      ]
    },
    {
      "stepNumber": 2,
      "stepName": "IT Manager Approval",
      "approverRole": "it_manager",
      "approverEmail": "it-manager@company.com",
      "formFields": [
        {
          "id": "budget_approved",
          "type": "checkbox",
          "label": "Budget Approved",
          "required": true
        },
        {
          "id": "assigned_to",
          "type": "text",
          "label": "Assign To",
          "required": true
        }
      ]
    }
  ],
  "globalDeadlineHours": 48,
  "allowDelegation": true,
  "allowSkip": false,
  "notifyOnEachStep": true
}
```

---

## 🔍 Monitoring & Analytics

### Get Pending Approvals for User

```bash
GET /api/approvals/pending/manager@company.com
```

**Response:**
```json
{
  "success": true,
  "workflows": [
    {
      "workflowId": "wf_123",
      "status": "pending",
      "currentStep": 0,
      "deadline": "2025-10-16T12:00:00Z",
      "steps": [...]
    }
  ],
  "count": 5
}
```

---

### Get Workflow Statistics

```bash
GET /api/approvals/stats/agent_123
```

**Response:**
```json
{
  "success": true,
  "stats": [
    { "_id": "approved", "count": 45, "avgSteps": 2.1 },
    { "_id": "rejected", "count": 12, "avgSteps": 1.5 },
    { "_id": "pending", "count": 8, "avgSteps": 2.0 }
  ]
}
```

---

### Get Workflow Details

```bash
GET /api/approvals/workflows/wf_123
```

**Response:**
```json
{
  "success": true,
  "workflow": {
    "workflowId": "wf_123",
    "conversationId": "conv_456",
    "status": "in_progress",
    "currentStep": 1,
    "steps": [
      {
        "stepNumber": 1,
        "stepName": "Manager Review",
        "status": "approved",
        "approvedBy": "manager@company.com",
        "approvedAt": "2025-10-15T10:30:00Z",
        "response": "Approved - budget available"
      },
      {
        "stepNumber": 2,
        "stepName": "Director Review",
        "status": "pending",
        "approverEmail": "director@company.com"
      }
    ],
    "stateHistory": [...],
    "deadline": "2025-10-18T10:00:00Z"
  }
}
```

---

## 🎯 Event Listeners

### Listen for Workflow Events

```typescript
// In your service
workflowEvents.on('workflow:created', (data) => {
  console.log('New workflow:', data.workflowId)
  // Send notification to approver
})

workflowEvents.on('workflow:step_advanced', (data) => {
  console.log('Advanced to step:', data.currentStep)
  // Notify next approver
})

workflowEvents.on('workflow:approved', (data) => {
  console.log('Workflow approved:', data.workflowId)
  // Send confirmation to user via SSE
})

workflowEvents.on('workflow:rejected', (data) => {
  console.log('Workflow rejected:', data.workflowId)
  // Send rejection notice to user
})

workflowEvents.on('workflow:timeout', (data) => {
  console.log('Workflow timed out:', data.workflowId)
  // Send timeout notification
})
```

---

## ⚙️ Configuration

### Environment Variables

Add to `.env`:
```bash
# Webhook security
WEBHOOK_API_KEY=your_secure_api_key_here

# MongoDB (already configured)
MONGODB_URI=mongodb://localhost:27017/lyzr

# Optional: Timeout check interval (milliseconds)
WORKFLOW_TIMEOUT_CHECK_INTERVAL=300000  # 5 minutes
```

---

### Setup Timeout Checker (Optional)

Add to `index.ts`:
```typescript
import { WorkflowService } from './src/services/workflow.service';

const workflowService = new WorkflowService();

// Check for timeouts every 5 minutes
setInterval(async () => {
  await workflowService.checkTimeouts();
}, 5 * 60 * 1000);
```

---

## 🧪 Testing

### Test Workflow Creation

```bash
curl -X POST http://localhost:3001/api/approvals/workflows \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "conversationId": "test_conv_1",
    "agentId": "agent_123",
    "originalMessage": "Test escalation",
    "escalationReason": "Testing workflow system",
    "templateId": "agent_123_simple_approval"
  }'
```

### Test Approval

```bash
curl -X POST http://localhost:3001/api/approvals/workflows/wf_123/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approver": "test@company.com",
    "response": "Test approval",
    "formResponse": {
      "comments": "Looks good!"
    }
  }'
```

### Test Webhook

```bash
curl -X POST http://localhost:3001/api/webhook/slack \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "conversationId": "test_conv_1",
    "workflowId": "wf_123",
    "approver": "slack_user@company.com",
    "response": "Approved via Slack"
  }'
```

---

## 📊 Database Queries

### Find All Pending Workflows

```javascript
db.workflows.find({
  status: { $in: ['pending', 'in_progress'] }
})
```

### Find Workflows by Approver

```javascript
db.workflows.find({
  'steps.approverEmail': 'manager@company.com',
  'steps.status': 'pending'
})
```

### Find Overdue Workflows

```javascript
db.workflows.find({
  status: { $in: ['pending', 'in_progress'] },
  deadline: { $lt: new Date() }
})
```

---

## 🔒 Security Best Practices

1. **Webhook Authentication**
   - Email webhooks: Verify `token` parameter
   - External webhooks: Verify `apiKey` against `WEBHOOK_API_KEY`
   - Slack webhooks: Implement Slack signature verification

2. **API Authorization**
   - Use `authMiddleware()` on all approval routes
   - Verify approver has permission for the workflow
   - Log all approval actions for audit trail

3. **Input Validation**
   - Validate form responses against field definitions
   - Sanitize user inputs
   - Check required fields

---

## 🎓 Best Practices

1. **Template Design**
   - Keep steps focused and clear
   - Use descriptive step names
   - Set realistic deadlines
   - Include helpful form fields

2. **Workflow Management**
   - Monitor timeout rates
   - Track average approval times
   - Review rejection reasons
   - Optimize step sequences

3. **User Experience**
   - Provide clear escalation messages
   - Send timely notifications
   - Make forms easy to fill
   - Show progress clearly

---

## 🐛 Troubleshooting

### Workflow Not Created
**Check:**
- Agent has default templates initialized
- MongoDB connection active
- AgentId exists in database

### Approval Not Working
**Check:**
- WorkflowId is correct
- Approver email matches step configuration
- Workflow status is 'pending' or 'in_progress'

### Webhook Failing
**Check:**
- Content-Type is 'application/json'
- Required fields present (action, conversationId)
- Authentication token/apiKey valid

---

## 📞 Support

For issues or questions:
1. Check logs: `console.log` statements in workflow service
2. Verify database state: Query workflows collection
3. Test with curl commands above
4. Review event emissions in console

---

*Last updated: 2025-10-15*
