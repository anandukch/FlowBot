# 🚀 **FlowBot Slack Integration Setup Guide**

This comprehensive guide will walk you through setting up Slack integration for FlowBot, including bot creation, permissions, webhooks, and OAuth configuration.

---

## 📋 **Prerequisites**

- **Slack Workspace**: Admin access to a Slack workspace
- **FlowBot Server**: Running instance of FlowBot server
- **Public URL**: Your server must be accessible via a public URL (use ngrok for development)

---

## 🔧 **Step 1: Create a Slack App**

### **1.1 Go to Slack API**
1. Visit [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app details:
   - **App Name**: `FlowBot`
   - **Development Slack Workspace**: Select your workspace
5. Click **"Create App"**

### **1.2 Basic Information**
After creating the app, you'll be on the **Basic Information** page.

---

## 🔐 **Step 2: Configure OAuth & Permissions**

### **2.1 OAuth & Permissions**
1. Go to **"OAuth & Permissions"** in the left sidebar
2. Scroll down to **"Scopes"**

### **2.2 Bot Token Scopes**
Add the following **Bot Token Scopes**:

```
channels:read          # Read public channel information
chat:write            # Send messages as FlowBot
chat:write.public     # Send messages to channels FlowBot isn't a member of
commands              # Add shortcuts and/or slash commands
im:read               # View basic information about direct messages
im:write              # Start direct messages with people
users:read            # View people in a workspace
users:read.email      # View email addresses of people in a workspace
```

### **2.3 User Token Scopes** (Optional)
Add these **User Token Scopes** if needed:

```
channels:read         # View basic information about public channels
users:read           # View people in a workspace
```

### **2.4 Important Tokens**
After setting up OAuth & Permissions, you'll need these tokens for FlowBot:
- **App ID** (from Basic Information page)
- **Bot User OAuth Token** (starts with `xoxb-`)

These will be configured in FlowBot's dashboard later.

---

## 🔗 **Step 3: Configure Interactive Components**

### **3.1 Interactivity & Shortcuts**
1. Go to **"Interactivity & Shortcuts"** in the left sidebar
2. Turn **ON** "Interactivity"
3. Set **Request URL**:
   ```
   https://your-domain.com/api/webhook/slack
   ```

### **3.2 Interactive Components**
This enables:
- ✅ **Button clicks** (Approve/Reject buttons)
- 📝 **Modal submissions** (Approval forms)
- 🔄 **Message updates** (Status changes)

---

## 📡 **Step 4: Set Up Event Subscriptions**

### **4.1 Event Subscriptions**
1. Go to **"Event Subscriptions"** in the left sidebar
2. Turn **ON** "Enable Events"
3. Set **Request URL**:
   ```
   https://your-domain.com/api/webhook/slack
   ```

### **4.2 Subscribe to Bot Events**
Add these **Bot Events**:

```
app_mention           # When FlowBot is mentioned
message.channels      # Messages in public channels
message.im           # Direct messages to FlowBot
```



## 🏠 **Step 6: Install App to Workspace**

### **6.1 Install App**
1. Go to **"Install App"** in the left sidebar
2. Click **"Install to Workspace"**
3. Review permissions and click **"Allow"**

### **6.2 Get Tokens**
After installation, you'll get:
- **Bot User OAuth Token**: `xoxb-1234567890-1234567890-abcdefghijklmnopqrstuvwx`
- **User OAuth Token**: `xoxp-1234567890-1234567890-1234567890-abcdefghijklmnopqrstuvwxyz`

---

## ⚙️ **Step 7: Configure FlowBot**

### **7.1 Add Tokens to FlowBot Dashboard**
1. Open your FlowBot dashboard
2. Go to **Slack Configuration** section
3. Enter the required information:
   - **App ID**: Found in Basic Information page (e.g., `A1234567890`)
   - **Bot User OAuth Token**: The `xoxb-` token from Step 6.2

### **7.2 Required Fields for FlowBot**
FlowBot needs these two fields to connect to Slack:
- ✅ **App ID** - Identifies your Slack app
- ✅ **Bot User OAuth Token** - Allows FlowBot to send messages and interact

**Note**: The signing secret and other tokens are handled automatically by the server configuration.



## 🚨 **Troubleshooting**

### **Common Issues:**

#### **❌ "URL Verification Failed"**
- Ensure your server responds to challenge requests
- Check that your public URL is accessible
- Verify SSL certificate if using HTTPS

#### **❌ "Invalid Signing Secret"**
- Double-check the signing secret in your .env file
- Ensure request verification is implemented correctly
- Check timestamp validation (requests expire after 5 minutes)

#### **❌ "Missing Scopes"**
- Review required bot token scopes
- Reinstall the app after adding new scopes
- Check that tokens have proper permissions

#### **❌ "Interactive Components Not Working"**
- Verify interactive components URL is correct
- Check that request verification passes
- Ensure proper JSON response format

### **Debug Tips:**

1. **Enable Verbose Logging**:
   ```javascript
   console.log('Slack request:', req.headers, req.body);
   ```

2. **Use ngrok for Local Development**:
   ```bash
   ngrok http 3001
   ```

3. **Test with Slack API Tester**:
   - Use Slack's API tester to verify tokens
   - Test individual API calls

4. **Check Slack App Event Logs**:
   - Go to your Slack app settings
   - Check "Event Subscriptions" logs for errors

---

## 📚 **Additional Resources**

- 📖 [Slack API Documentation](https://api.slack.com/)
- 🔧 [Slack Block Kit Builder](https://app.slack.com/block-kit-builder)
- 🎯 [Interactive Components Guide](https://api.slack.com/interactivity)
- 🔐 [Security Best Practices](https://api.slack.com/authentication/verifying-requests-from-slack)
- 📡 [Event Subscriptions](https://api.slack.com/events-api)

---

## ✅ **Verification Checklist**

Before going live, ensure:

- [ ] **App installed** in workspace with correct permissions
- [ ] **Bot token** and signing secret configured
- [ ] **Webhook URLs** accessible and verified
- [ ] **Interactive components** responding correctly
- [ ] **Event subscriptions** processing events
- [ ] **Request verification** implemented and working
- [ ] **Error handling** in place for all endpoints
- [ ] **Rate limiting** configured
- [ ] **SSL certificate** valid (for production)
- [ ] **Logging** enabled for debugging

---

🎉 **Congratulations!** Your FlowBot Slack integration is now ready to handle approval workflows with interactive buttons, modals, and real-time updates!

For additional help, check the [main README](../README.md) or open an issue on [GitHub](https://github.com/anandukch/flowbot/issues).
