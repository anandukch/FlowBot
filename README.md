<div align="center">

# 🎯 **FlowBot**

*Smart Customer Support with Intelligent Approval Workflows*

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/anandukch/flowbot)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)](https://github.com/anandukch/flowbot)

</div>

---

## 🌟 **What is FlowBot?**

FlowBot is a next-generation **AI-powered customer support platform** that revolutionizes how businesses handle customer inquiries. It combines intelligent chatbot capabilities with sophisticated approval workflows, ensuring every customer request is handled efficiently and professionally.

### 🎯 **Perfect For:**
- **E-commerce businesses** handling product inquiries and discount requests
- **SaaS companies** managing feature requests and support tickets  
- **Service providers** processing approval-based customer requests
- **Any business** wanting to automate customer support while maintaining human oversight

---

## 🎬 **Demo Video**

<div align="left">

[🎥 **Click here to watch FlowBot Demo**](https://youtu.be/rnnEjoGMGME)

</div>

## 🚀 **Try FlowBot Live**

<div align="left">

[🌐 **Launch FlowBot App**](https://flowbot-omega.vercel.app/) - *Experience FlowBot in action!*

</div>

---

## ✨ **Key Features**

### 🤖 **Intelligent AI Assistant**
- **Smart Conversations**: Natural language processing for human-like interactions
- **Context Awareness**: Remembers conversation history and user preferences
- **Knowledge Base Integration**: Upload JSON/TEXT (currently supported) for AI to reference in responses
- **Multi-Agent Support**: Deploy multiple specialized assistants for different departments
- **Real-time Responses**: Instant replies with typing indicators and smooth animations

### 🔄 **Smart Approval Workflows**
- **Automatic Escalation**: Complex requests automatically route to appropriate approvers
- **Multi-Step Approvals**: Configure approval chains for different request types
- **Delegation Support**: Approvers can delegate decisions to colleagues
- **Deadline Management**: Set time limits with automatic timeout handling

### 💬 **Multi-Channel Integration**
- **Slack Integration**: Approve/reject requests directly from Slack with interactive modals
- **Web Widget**: Beautiful, customizable chat widget for your website
- **Real-time Updates**: Instant notifications via Server-Sent Events (SSE)

### 📊 **Advanced Workflow Management**
- **Status Tracking**: Monitor request progress from submission to completion
- **Audit Trail**: Complete history of all actions and decisions
- **Smart Retry**: Users can check for updates without duplicate notifications
- **Response Caching**: Efficient handling of multiple workflow responses

### 🎨 **Customizable Experience**
- **Brand Customization**: Match your brand colors, fonts, and styling
- **Flexible Positioning**: Choose widget placement and behavior
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Theme Support**: Light/dark mode and custom themes

---

## 🚀 **How It Works**

### 1. **Customer Interaction**
```
Customer asks: "Can I get a 20% discount on the iPhone?"
↓
AI Assistant processes the request and determines it needs approval
```

### 2. **Smart Escalation**
```
System creates approval workflow
↓
Sends notification to appropriate approver via Slack/Email
```

### 3. **Approval Process**
```
Approver receives interactive Slack message with buttons:
[✅ Approve] [❌ Reject] [👥 Delegate]
↓
Approver clicks button → Modal opens for feedback
```

### 4. **Real-time Updates**
```
Decision made → Customer instantly notified
↓
"✅ Your discount request has been approved! 
Response: 15% discount approved for loyal customers."
```

---

## 🛠️ **Technical Architecture**

### **Backend Services**
- **Node.js/TypeScript** - Robust server architecture
- **MongoDB** - Scalable document database for workflows
- **Express.js** - RESTful API endpoints
- **Socket.io/SSE** - Real-time communication

### **Frontend Components**
- **Vanilla JavaScript** - Lightweight chat widget
- **Shadow DOM** - Isolated styling and functionality
- **Responsive CSS** - Modern, mobile-first design
- **Font Awesome** - Beautiful icons and indicators

### **Integrations**
- **Slack API** - Interactive messages and modals
- **Email Services** - SMTP/SendGrid integration
- **Webhook Support** - External system notifications
- **REST APIs** - Easy integration with existing systems

---

## 📦 **Quick Start**

### **1. Installation**
```bash
# Clone the repository
git clone https://github.com/anandukch/flowbot.git
cd flowbot

# Install server dependencies
cd server
npm install

# Install client dependencies (if using React dashboard)
cd ../client
npm install
```

### **2. Configuration**
```bash
# Copy environment template
cp server/.env.example server/.env

# Configure your settings
# - MongoDB connection string
# - OpenAI/Groq API keys
# - Google OAuth credentials
```

### **3. Slack Integration Setup**
For detailed Slack bot configuration including webhooks, permissions, and OAuth setup, see:
📋 **[Slack Setup Guide](docs/SLACK_SETUP.md)**

### **4. Start the Application**
```bash
# Start the server
cd server
npm run dev

# The server will start on http://localhost:3001
```

### **5. Add Widget to Your Website**
```html
<!-- Add this script tag to your website -->
<script 
  src="http://localhost:3001/widget.js" 
  data-agent-id="your-agent-id">
</script>
```

---

## 🎯 **Use Cases & Examples**

### **E-commerce Discount Requests**
- Customer requests product discount
- AI escalates to sales manager
- Manager approves with conditions
- Customer receives instant notification

### **Feature Request Approval**
- User suggests new product feature
- Routes to product team for evaluation
- Team discusses and makes decision
- User gets detailed feedback

### **Service Upgrade Requests**
- Customer wants to upgrade service plan
- Requires billing team approval
- Automated workflow handles the process
- Seamless upgrade experience

---

## 🔧 **Configuration Options**

### **Widget Customization**
```javascript
{
  primaryColor: '#007bff',
  agentName: 'Support Assistant',
  welcomeMessage: 'How can I help you today?',
  position: 'bottom-right',
  showAvatar: true,
  enableSounds: false
}
```

### **Workflow Templates**
```javascript
{
  templateName: 'Discount Approval',
  steps: [
    { role: 'sales_manager', deadline: '2 hours' },
    { role: 'finance_team', deadline: '1 day' }
  ],
  allowDelegation: true
}
```

---

## 📈 **Benefits**

### **For Businesses**
- ✅ **Reduce Response Time** - Instant AI responses with human oversight
- ✅ **Improve Efficiency** - Automated workflows save time and resources
- ✅ **Better Tracking** - Complete audit trail of all customer interactions
- ✅ **Scalable Solution** - Handle more customers without hiring more staff

### **For Customers**
- ✅ **24/7 Availability** - Get help anytime, anywhere
- ✅ **Instant Responses** - No waiting in long support queues
- ✅ **Transparent Process** - Know exactly what's happening with your request
- ✅ **Professional Service** - Consistent, high-quality support experience

### **For Support Teams**
- ✅ **Smart Prioritization** - Focus on requests that need human attention
- ✅ **Easy Approvals** - Handle requests directly from Slack or email
- ✅ **Complete Context** - Full conversation history and customer details
- ✅ **Flexible Workflows** - Customize approval processes for different scenarios

---

<!-- ## 🔒 **Security & Compliance**

- **Data Encryption** - All data encrypted in transit and at rest
- **Access Control** - Role-based permissions and authentication
- **Audit Logging** - Complete audit trail for compliance
- **Privacy Protection** - GDPR and privacy regulation compliant
- **Secure Integrations** - OAuth and secure API connections

--- -->

<!-- ## 🤝 **Support & Community**

### **Documentation**
- 📚 [Complete API Documentation](docs/api.md)
- 🎯 [Integration Guides](docs/integrations/)
- 🛠️ [Configuration Reference](docs/configuration.md)
- 🔧 [Troubleshooting Guide](docs/troubleshooting.md)

### **Get Help**
- 💬 [Community Forum](https://community.flowbot.ai)
- 📧 [Email Support](mailto:support@flowbot.ai)
- 🐛 [Report Issues](https://github.com/anandukch/flowbot/issues)
- 📖 [Knowledge Base](https://help.flowbot.ai)

--- -->

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by the FlowBot Team**

<!-- [Website](https://flowbot.ai) • [Documentation](docs/) • [Community](https://community.flowbot.ai) • [Support](mailto:support@flowbot.ai) -->

</div>
