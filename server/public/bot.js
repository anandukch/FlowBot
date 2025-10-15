(() => {
    const script = document.currentScript;
    const agentId = script.dataset.agentId;
  
    if (!agentId) {
      console.error('Chat widget: data-agent-id attribute is missing from script tag.');
      return;
    }

    // Default configuration (fallback)
    let widgetConfig = {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      backgroundColor: '#ffffff',
      textColor: '#37352f',
      headerColor: '#ffffff',
      borderRadius: 10,
      shadowIntensity: 15,
      width: 600,
      height: 700,
      position: 'bottom-right',
      agentName: 'Lyzr Assistant',
      welcomeMessage: 'Hey I am Lyzr Assistant 👋 How can I help you today?',
      avatarUrl: '',
      showAvatar: true,
      showTypingIndicator: true,
      enableSounds: false,
      fontFamily: 'system-ui',
      fontSize: 14,
      animationSpeed: 'normal'
    };

    // Fetch user's widget configuration
    const fetchWidgetConfig = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/widget/config/${agentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            widgetConfig = { ...widgetConfig, ...data.config };
          }
        }
      } catch (error) {
        console.log('Using default widget configuration');
      }
    };

    const initializeWidget = async () => {
      await fetchWidgetConfig();
      createWidget();
    };

    const createWidget = () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
  
    const style = document.createElement('style');
    const animationDuration = widgetConfig.animationSpeed === 'fast' ? '0.2s' : 
                              widgetConfig.animationSpeed === 'slow' ? '0.6s' : 
                              widgetConfig.animationSpeed === 'none' ? '0s' : '0.3s';
    
    style.textContent = `
      /* Modern Chat Container */
      .chat-container {
        position: fixed;
        ${widgetConfig.position.includes('bottom') ? 'bottom' : 'top'}: 24px;
        ${widgetConfig.position.includes('right') ? 'right' : 'left'}: 24px;
        width: ${widgetConfig.width}px;
        height: ${widgetConfig.height}px;
        background: ${widgetConfig.backgroundColor};
        border-radius: ${widgetConfig.borderRadius}px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 ${widgetConfig.shadowIntensity + 12}px ${widgetConfig.shadowIntensity * 2}px rgba(0, 0, 0, 0.1), 0 ${Math.floor(widgetConfig.shadowIntensity / 2)}px ${widgetConfig.shadowIntensity}px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1000;
        font-family: ${widgetConfig.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
        font-size: ${widgetConfig.fontSize}px;
        box-sizing: border-box;
        transition: all ${animationDuration} cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: ${widgetConfig.position.includes('bottom') ? 'bottom' : 'top'} ${widgetConfig.position.includes('right') ? 'right' : 'left'};
      }
  
      .chat-container.closed {
        opacity: 0;
        transform: scale(0.8) translateY(20px);
        pointer-events: none;
        visibility: hidden;
      }
  
      /* Modern Floating Chat Icon */
      .chat-icon {
        position: fixed;
        ${widgetConfig.position.includes('bottom') ? 'bottom' : 'top'}: 24px;
        ${widgetConfig.position.includes('right') ? 'right' : 'left'}: 24px;
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, ${widgetConfig.primaryColor}, ${widgetConfig.primaryColor}dd);
        border-radius: ${Math.min(widgetConfig.borderRadius + 4, 20)}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 ${widgetConfig.shadowIntensity + 4}px ${widgetConfig.shadowIntensity * 2}px rgba(0, 0, 0, 0.15), 0 ${Math.floor(widgetConfig.shadowIntensity / 3)}px ${widgetConfig.shadowIntensity}px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        transition: all ${animationDuration} cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        outline: none;
        opacity: 0;
        transform: scale(0.8);
        pointer-events: none;
        visibility: hidden;
        backdrop-filter: blur(10px);
      }
  
      .chat-icon.visible {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
        visibility: visible;
      }
  
      .chat-icon:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 ${widgetConfig.shadowIntensity + 8}px ${widgetConfig.shadowIntensity * 2.5}px rgba(0, 0, 0, 0.2), 0 ${widgetConfig.shadowIntensity}px ${widgetConfig.shadowIntensity * 1.5}px rgba(0, 0, 0, 0.15);
      }
  
      .chat-icon i {
        color: ${widgetConfig.secondaryColor};
        font-size: 26px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }
  
      /* Modern Header */
      .chat-container .header {
        background: linear-gradient(135deg, ${widgetConfig.headerColor}, ${widgetConfig.headerColor}f8);
        color: ${widgetConfig.textColor};
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        backdrop-filter: blur(10px);
        position: relative;
      }
      
      .chat-container .header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
      }
  
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
  
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: ${Math.min(widgetConfig.borderRadius, 12)}px;
        overflow: hidden;
        flex-shrink: 0;
        box-shadow: 0 ${Math.floor(widgetConfig.shadowIntensity / 6)}px ${Math.floor(widgetConfig.shadowIntensity / 2)}px rgba(0, 0, 0, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        ${!widgetConfig.showAvatar ? 'display: none !important;' : ''}
      }
  
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
  
      .header-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
  
      .chat-container .header h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: ${widgetConfig.textColor};
        line-height: 1.2;
        letter-spacing: -0.01em;
      }

      .typing {
        ${!widgetConfig.showTypingIndicator ? 'display: none !important;' : ''}
      }
  
      .subtext {
        font-size: 12px;
        color: rgba(${widgetConfig.textColor === '#ffffff' ? '255, 255, 255' : '0, 0, 0'}, 0.6);
        line-height: 1.3;
        font-weight: 400;
      }
  
      .chat-container .status {
        font-size: 12px;
        color: #10b981;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }
  
      .chat-container .status::before {
        content: '';
        display: block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      }
  
      /* Modern Header Buttons */
      .close-chat, .retry-btn {
        background: rgba(0, 0, 0, 0.05);
        border: none;
        font-size: 14px;
        color: rgba(${widgetConfig.textColor === '#ffffff' ? '255, 255, 255' : '0, 0, 0'}, 0.6);
        cursor: pointer;
        padding: 8px;
        border-radius: ${Math.min(widgetConfig.borderRadius, 10)}px;
        transition: all ${animationDuration} ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        backdrop-filter: blur(10px);
      }

      .close-chat:hover, .retry-btn:hover {
        background: rgba(0, 0, 0, 0.1);
        color: rgba(${widgetConfig.textColor === '#ffffff' ? '255, 255, 255' : '0, 0, 0'}, 0.8);
        transform: scale(1.05);
      }

      .retry-btn.loading {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
  
      /* Modern Messages Area */
      .chat {
        flex: 1;
        padding: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        position: relative;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.01) 0%, transparent 100%);
      }
  
      .messages {
        flex: 1;
        padding: 24px 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      
      .messages::-webkit-scrollbar {
        display: none;
      }
  
      .messages {
        padding: 16px;
        margin-bottom: 0;
        flex: 1;
        min-height: 0;
      }
  
{{ ... }}
      /* Message Styles */
      .msg {
        display: flex;
        width: 100%;
        margin-bottom: 12px;
      }
  
      /* Message slide-up animation */
      .msg.slide-up {
        opacity: 0;
        transform: translateY(15px);
        animation: slideUpMessage 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
  
      @keyframes slideUpMessage {
        0% {
          opacity: 0;
          transform: translateY(15px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
  
      .msg.user {
        justify-content: flex-end;
      }
  
      .msg.assistant {
        justify-content: flex-start;
      }
  
      .msg.loading {
        justify-content: flex-start;
      }
  
      .msg.error {
        justify-content: flex-start;
      }
  
      /* Message Header - now inside bubble */
      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
  
      .msg.user .message-header {
        flex-direction: row;
      }
  
      .message-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
      }
  
      .message-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
  
      .message-name {
        font-size: 12px;
        font-weight: 600;
        color: #37352f;
        line-height: 1;
      }
  
      .msg.user .message-name {
        color: white;
      }
  
      /* Message Bubbles */
      .bubble {
        max-width: 85%;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
        position: relative;
        z-index: 1;
        margin: 2px 0;
        box-shadow: none;
        background-clip: padding-box;
        -webkit-background-clip: padding-box;
        background-origin: padding-box;
      }
  
      .msg.user .bubble {
        background: linear-gradient(135deg, ${widgetConfig.primaryColor}, ${widgetConfig.primaryColor}dd);
        color: ${widgetConfig.secondaryColor};
        border-radius: ${widgetConfig.borderRadius + 4}px ${widgetConfig.borderRadius + 4}px ${Math.max(widgetConfig.borderRadius - 12, 4)}px ${widgetConfig.borderRadius + 4}px;
        box-shadow: 0 ${Math.floor(widgetConfig.shadowIntensity / 6)}px ${widgetConfig.shadowIntensity}px rgba(0, 0, 0, 0.1);
        border: none;
      }
  
      .msg.assistant .bubble {
        background: ${widgetConfig.secondaryColor};
        color: ${widgetConfig.textColor};
        border-radius: ${widgetConfig.borderRadius + 4}px ${widgetConfig.borderRadius + 4}px ${widgetConfig.borderRadius + 4}px ${Math.max(widgetConfig.borderRadius - 12, 4)}px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        white-space: pre-wrap;
        word-wrap: break-word;
        position: relative;
        overflow: visible;
        box-shadow: 0 ${Math.floor(widgetConfig.shadowIntensity / 8)}px ${Math.floor(widgetConfig.shadowIntensity / 2)}px rgba(0, 0, 0, 0.05);
      }
  
      /* Support Message Styling */
      .msg.assistant.support .bubble {
        background: #ffffff !important;
        border: 1px solid #e9e9e7;
        border-radius: 16px;
        margin: 2px 0;
        position: relative;
        padding: 8px 12px;
        background-image: none !important;
      }
  
      .msg.assistant.support .bubble::before {
        content: '';
        display: none;
      }
  
      /* Loading Animation */
      .msg.loading .message-content {
        display: flex;
        align-items: center;
        color: #666666;
      }
  
      .typing {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 2px 0;
      }
  
      .typing span:first-child {
        font-size: 13px;
        color: #666666;
      }
  
      .typing span:not(:first-child) {
        height: 3px;
        width: 3px;
        margin: 0 0.5px;
        background-color: #999999;
        border-radius: 50%;
        opacity: 0.4;
        display: block;
      }
  
      .typing span:nth-child(2) {
        animation: 1.2s blink infinite 0.0s;
      }
  
      .typing span:nth-child(3) {
        animation: 1.2s blink infinite 0.2s;
      }
  
      .typing span:nth-child(4) {
        animation: 1.2s blink infinite 0.4s;
      }
  
      @keyframes blink {
        50% {
          opacity: 1;
        }
      }
  
      /* Message Composer */
      .composer {
        padding: 20px 24px 24px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        background: linear-gradient(135deg, ${widgetConfig.backgroundColor}, ${widgetConfig.backgroundColor}f8);
        position: relative;
        backdrop-filter: blur(10px);
      }
  
      .composer form {
        position: relative;
        display: flex;
        align-items: center;
      }
  
      #message-input {
        flex: 1;
        padding: 12px 50px 12px 18px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: ${widgetConfig.borderRadius + 14}px;
        font-size: 14px;
        outline: none;
        background: rgba(255, 255, 255, 0.9);
        color: #1f2937;
        font-family: inherit;
        resize: none;
        transition: all ${animationDuration} ease;
        box-shadow: 0 ${Math.floor(widgetConfig.shadowIntensity / 6)}px ${Math.floor(widgetConfig.shadowIntensity / 2)}px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        width: 100%;
        backdrop-filter: blur(10px);
      }
  
      #message-input:focus {
        border-color: transparent;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06), 
                    0 0 0 2px ${widgetConfig.primaryColor}15, 
                    0 0 0 4px ${widgetConfig.primaryColor}08,
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 1);
        transform: translateY(-1px);
        outline: none;
      }
  
      #emoji-btn {
        display: none !important;
      }
  
      #send-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        padding: 10px;
        border-radius: ${widgetConfig.borderRadius + 6}px;
        border: 0;
        background: linear-gradient(135deg, ${widgetConfig.primaryColor}, ${widgetConfig.primaryColor}dd);
        color: ${widgetConfig.secondaryColor};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${animationDuration} ease;
        font-weight: 500;
        font-size: 16px;
        width: 40px;
        height: 40px;
        box-shadow: 0 ${Math.floor(widgetConfig.shadowIntensity / 6)}px ${Math.floor(widgetConfig.shadowIntensity / 2)}px rgba(0, 0, 0, 0.15);
      }
  
      #send-btn:hover {
        background: linear-gradient(135deg, ${widgetConfig.primaryColor}ee, ${widgetConfig.primaryColor}cc);
        transform: translateY(-50%) scale(1.05);
        box-shadow: 0 ${Math.floor(widgetConfig.shadowIntensity / 3)}px ${widgetConfig.shadowIntensity}px rgba(0, 0, 0, 0.2);
      }
  
      /* Disabled State */
      #message-input:disabled,
      #send-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
  
      /* Loading Message */
      .msg.loading .bubble {
        background: #ffffff;
        border: 1px solid #e9e9e7;
        border-radius: 16px;
        padding: 6px 10px;
      }
  
      /* Error Message */
      .msg.error .bubble {
        background: #fff5f5;
        border: 1px solid #fed7d7;
        border-radius: 16px;
        color: #e53e3e;
      }
  
      /* Scrollbar */
      .messages::-webkit-scrollbar {
        width: 4px;
      }
  
      .messages::-webkit-scrollbar-track {
        background: transparent;
      }
  
      .messages::-webkit-scrollbar-thumb {
        background: #d3d3d1;
        border-radius: 2px;
      }
  
      .messages::-webkit-scrollbar-thumb:hover {
        background: #a8a8a6;
      }
  
      /* Responsive Design */
      @media (max-width: 768px) {
        .chat-container {
          width: 90%;
          right: 5%;
          bottom: 1rem;
          max-width: none;
        }
      }
    `;
    shadowRoot.appendChild(style);
  
    const fontAwesome = document.createElement('link');
    fontAwesome.setAttribute('rel', 'stylesheet');
    fontAwesome.setAttribute('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
    shadowRoot.appendChild(fontAwesome);
  
    const chatIcon = document.createElement('button');
    chatIcon.id = 'chat-icon';
    chatIcon.className = 'chat-icon';
    chatIcon.innerHTML = `<i class="far fa-comment-dots"></i>`;
    shadowRoot.appendChild(chatIcon);
  
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.className = 'chat-container';
    chatContainer.innerHTML = `
      <div class="header">
        <div class="header-left">
          ${widgetConfig.showAvatar ? `
          <div class="avatar">
            <img src="${widgetConfig.avatarUrl || 'assets/Clara.png'}" alt="${widgetConfig.agentName}" />
          </div>` : ''}
          <div class="header-info">
            <h1>${widgetConfig.agentName}</h1>
            <span class="subtext">Customer Support</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="status" class="status">Online</span>
          <button class="retry-btn" id="retry-btn" title="Check for updates">
            <i class="fas fa-sync-alt"></i>
          </button>
          <button class="close-chat" id="close-chat">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <section class="chat">
        <div id="messages" class="messages"></div>
      </section>
      <section class="composer">
        <form id="chat-form">
          <input id="message-input" type="text" placeholder="Type your message..." autocomplete="off" />
          <button id="emoji-btn" type="button">
            <i class="far fa-smile"></i>
          </button>
          <button id="send-btn" type="submit">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </section>
    `;
    shadowRoot.appendChild(chatContainer);
  
    const messagesEl = shadowRoot.getElementById('messages');
    const form = shadowRoot.getElementById('chat-form');
    const input = shadowRoot.getElementById('message-input');
    const closeBtn = shadowRoot.getElementById('close-chat');
    const retryBtn = shadowRoot.getElementById('retry-btn');
  
    let isChatOpen = false;
  
    function closeChat() {
      chatContainer.classList.add('closed');
      chatIcon.classList.add('visible');
      isChatOpen = false;
    }
  
    function openChat() {
      chatContainer.classList.remove('closed');
      chatIcon.classList.remove('visible');
      isChatOpen = true;
    }
  
    closeChat();
  
    if (closeBtn) {
      closeBtn.addEventListener('click', closeChat);
    }
  
    if (chatIcon) {
      chatIcon.addEventListener('click', openChat);
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', fetchWorkflowUpdates);
    }

    async function fetchWorkflowUpdates() {
      if (retryBtn.classList.contains('loading')) return;
      
      retryBtn.classList.add('loading');
      
      try {
        const response = await fetch(`http://localhost:3001/api/chat/workflows/${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          console.error('Failed to fetch workflows');
          appendMessage('assistant', 'Failed to check for updates. Please try again.', true);
          return;
        }

        const data = await response.json();
        if (data.success) {
          displayWorkflowResponses(data.workflows);
        }
      } catch (error) {
        console.error('Error fetching workflow updates:', error);
        appendMessage('assistant', 'Error checking for updates. Please try again.', true);
      } finally {
        retryBtn.classList.remove('loading');
      }
    }

    function displayWorkflowResponses(workflows) {
      if (!workflows || workflows.length === 0) {
        appendMessage('assistant', 'No new updates found.', true);
        return;
      }

      // Group workflows by status for cleaner display
      const approved = workflows.filter(w => w.status === 'approved');
      const rejected = workflows.filter(w => w.status === 'rejected');
      const completed = workflows.filter(w => w.status === 'completed');

      // Display approved workflows
      approved.forEach(workflow => {
        const message = `✅ **Request Approved**\n"${workflow.originalMessage}"\n\n💬 ${workflow.finalResponse}`;
        appendMessage('assistant', message, true);
      });

      // Display rejected workflows
      rejected.forEach(workflow => {
        const message = `❌ **Request Declined**\n"${workflow.originalMessage}"\n\n💬 ${workflow.finalResponse}`;
        appendMessage('assistant', message, true);
      });

      // Display completed workflows
      completed.forEach(workflow => {
        const message = `✅ **Request Completed**\n"${workflow.originalMessage}"\n\n💬 ${workflow.finalResponse}`;
        appendMessage('assistant', message, true);
      });

      // Summary message
      if (workflows.length > 1) {
        appendMessage('assistant', `📋 ${workflows.length} updates shown above.`, true);
      }
    }
  
    const userIdKey = 'cs_user_id';
    let userId = localStorage.getItem(userIdKey);
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(userIdKey, userId);
    }
  
    function showLoading() {
      const loading = document.createElement('div');
      loading.id = 'loading';
      loading.className = 'msg assistant loading';
      
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      
      const avatarImg = document.createElement('img');
      avatarImg.src = widgetConfig.avatarUrl || 'assets/Clara.png';
      avatarImg.alt = widgetConfig.agentName;
      avatar.appendChild(avatarImg);
      
      const nameLabel = document.createElement('span');
      nameLabel.className = 'message-name';
      nameLabel.textContent = widgetConfig.agentName;
      
      messageHeader.appendChild(avatar);
      messageHeader.appendChild(nameLabel);
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.innerHTML = `
        <div class="typing">
          <span>Thinking</span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      
      bubble.appendChild(messageHeader);
      bubble.appendChild(messageContent);
      loading.appendChild(bubble);
      messagesEl.appendChild(loading);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return loading;
    }
  
    function hideLoading() {
      const loading = shadowRoot.getElementById('loading');
      if (loading) loading.remove();
    }
  
    function appendMessage(role, content, isSupport = false, withAnimation = true) {
      hideLoading();
  
      const wrap = document.createElement('div');
      wrap.className = `msg ${role}${isSupport ? ' support' : ''}${withAnimation ? ' slide-up' : ''}`;
      
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      
      const avatarImg = document.createElement('img');
      if (role === 'user') {
        avatarImg.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
        avatarImg.alt = 'User';
      } else {
        avatarImg.src = widgetConfig.avatarUrl || 'assets/Clara.png';
        avatarImg.alt = widgetConfig.agentName;
      }
      avatar.appendChild(avatarImg);
      
      const nameLabel = document.createElement('span');
      nameLabel.className = 'message-name';
      nameLabel.textContent = role === 'user' ? 'You' : widgetConfig.agentName;
      
      messageHeader.appendChild(avatar);
      messageHeader.appendChild(nameLabel);
      
      const messageContent = document.createElement('div');
      messageContent.textContent = content;
      
      bubble.appendChild(messageHeader);
      bubble.appendChild(messageContent);
      wrap.appendChild(bubble);
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  
    async function sendMessage(text) {
      appendMessage('user', text);
      input.value = '';
      
      input.disabled = true;
      const sendBtn = shadowRoot.getElementById('send-btn');
      if (sendBtn) sendBtn.disabled = true;
      
      const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/
      if (!emailRegex.test(text)) {
        setTimeout(() => {
          showLoading();
        }, 450);
      }
  
      try {
        const res = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversationId: userId, agentId })
        });
  
        const data = await res.json();
        if (!res.ok) {
          appendMessage('assistant', 'Sorry, something went wrong.');
          console.error('API error:', data);
          hideLoading();
          input.disabled = false;
          if (sendBtn) sendBtn.disabled = false;
          return;
        }
  
        if (data.success) {
          if (data.email) {
              hideLoading();
          }
          appendMessage('assistant', data.response || 'No response received.');
        } else {
          appendMessage('assistant', data.error || 'Something went wrong.');
        }
      } catch (err) {
        console.error('Network error:', err);
        hideLoading();
        appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      } finally {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    }
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      sendMessage(text);
    });
  
    function connectSSE() {
      const eventSource = new EventSource(`http://localhost:3001/api/chat/events/${userId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            appendMessage(data.role, data.content, data.isSupport);
          } else if (data.type === 'workflow_approved') {
            appendMessage('assistant', `✅ ${data.message}\n\nResponse: ${data.response || 'No additional comments'}`, true);
          } else if (data.type === 'workflow_rejected') {
            appendMessage('assistant', `❌ ${data.message}\n\nReason: ${data.reason || 'No reason provided'}`, true);
          } else if (data.type === 'workflow_escalated') {
            appendMessage('assistant', data.message, true);
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setTimeout(connectSSE, 5000);
      };
      
      return eventSource;
    }
    
    let sseConnection = connectSSE();
    
    setTimeout(() => {
      appendMessage('assistant', widgetConfig.welcomeMessage);
    }, 1500);
    
    }; // End of createWidget function
    
    // Initialize the widget
    initializeWidget();
  })();
  