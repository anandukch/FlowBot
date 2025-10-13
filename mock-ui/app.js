(() => {
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('message-input');
  const statusEl = document.getElementById('status');

  const userIdKey = 'cs_user_id';
  let userId = localStorage.getItem(userIdKey);
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(userIdKey, userId);
  }

  // Add loading indicator
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
    avatarImg.src = 'assets/Clara.png';
    avatarImg.alt = 'Clara Johns';
    avatar.appendChild(avatarImg);
    
    const nameLabel = document.createElement('span');
    nameLabel.className = 'message-name';
    nameLabel.textContent = 'Clara Johns';
    
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

  // Remove loading indicator
  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
  }

  function appendMessage(role, content, isSupport = false, withAnimation = true) {
    // Remove any existing loading indicator
    hideLoading();

    console.log("Append message:", role, content, isSupport, withAnimation);
    
    
    const wrap = document.createElement('div');
    wrap.className = `msg ${role}${isSupport ? ' support' : ''}${withAnimation ? ' slide-up' : ''}`;
    
    // Create bubble with header inside
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    // Create message header with avatar and name inside bubble
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    const avatarImg = document.createElement('img');
    if (role === 'user') {
      avatarImg.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
      avatarImg.alt = 'User';
    } else {
      avatarImg.src = 'assets/Clara.png';
      avatarImg.alt = 'Clara Johns';
    }
    avatar.appendChild(avatarImg);
    
    const nameLabel = document.createElement('span');
    nameLabel.className = 'message-name';
    nameLabel.textContent = role === 'user' ? 'You' : 'Clara Johns';
    
    messageHeader.appendChild(avatar);
    messageHeader.appendChild(nameLabel);
    
    // Create content div
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
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
    
    // Disable input while waiting
    input.disabled = true;
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;
    
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!emailRegex.test(text)) {
      // Show loading indicator after user message animation completes (0.4s)
      setTimeout(() => {
        showLoading();
      }, 450);
    }

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: userId })
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

      // Display the response from the API
      if (data.success) {
        // If the user submitted an email, the backend handles it directly.
        // We just need to display the confirmation and stop the loading indicator.
        if (data.email) {
            hideLoading();
        }
        appendMessage('assistant', data.response || 'No response received.');
        statusEl.textContent = 'Response received';
      } else {
        appendMessage('assistant', data.error || 'Something went wrong.');
        statusEl.textContent = 'Error occurred';
      }
    } catch (err) {
      console.error('Network error:', err);
      hideLoading();
      appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      // Re-enable input
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

  // Connect to SSE endpoint
  function connectSSE() {
    const eventSource = new EventSource(`http://localhost:3001/api/events/${userId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          appendMessage(data.role, data.content, data.isSupport);
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      // Try to reconnect after 5 seconds
      setTimeout(connectSSE, 5000);
    };
    
    return eventSource;
  }
  
  // Initialize SSE connection
  let sseConnection = connectSSE();
  
  // Greet with smooth transition - delay to allow chat window opening animation to complete
  setTimeout(() => {
    appendMessage('assistant', 'Hey I am Clara 👋 How can I help you today?');
  }, 1500);

  // Handle chat icon click
  const chatIcon = document.getElementById('chat-icon');
  if (chatIcon) {
    chatIcon.addEventListener('click', async () => {
      try {
        const res = await fetch('http://localhost:3001/api/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });

        if (!res.ok) {
          console.error('Failed to trigger workflow:', await res.text());
        }
      } catch (err) {
        console.error('Error triggering workflow:', err);
      }
    });
  }
})();
