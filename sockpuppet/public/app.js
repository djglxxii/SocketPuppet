/**
 * SOCKPUPPET - Frontend Application
 * 
 * A vanilla JavaScript client for the Sockpuppet TCP test utility.
 * Handles WebSocket communication, XML parsing, and UI updates.
 */

(function() {
  'use strict';

  // =====================
  // State
  // =====================
  
  let messages = [];
  let socket = null;
  let isConnected = false;

  // =====================
  // DOM Elements
  // =====================
  
  const elements = {
    // Connection controls
    hostInput: null,
    portInput: null,
    connectBtn: null,
    disconnectBtn: null,
    statusIndicator: null,
    statusText: null,
    
    // Conversation input
    conversationInput: null,
    parseBtn: null,
    clearBtn: null,
    parseError: null,
    
    // Messages table
    messagesBody: null,
    messageCount: null,
    sendAllBtn: null,
    
    // Log
    logContainer: null,
    clearLogBtn: null
  };

  // =====================
  // Initialization
  // =====================
  
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Cache DOM elements
    elements.hostInput = document.getElementById('host-input');
    elements.portInput = document.getElementById('port-input');
    elements.connectBtn = document.getElementById('connect-btn');
    elements.disconnectBtn = document.getElementById('disconnect-btn');
    elements.statusIndicator = document.getElementById('status-indicator');
    elements.statusText = document.getElementById('status-text');
    
    elements.conversationInput = document.getElementById('conversation-input');
    elements.parseBtn = document.getElementById('parse-btn');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.parseError = document.getElementById('parse-error');
    
    elements.messagesBody = document.getElementById('messages-body');
    elements.messageCount = document.getElementById('message-count');
    elements.sendAllBtn = document.getElementById('send-all-btn');
    
    elements.logContainer = document.getElementById('log');
    elements.clearLogBtn = document.getElementById('clear-log-btn');

    // Bind event listeners
    elements.connectBtn.addEventListener('click', handleConnect);
    elements.disconnectBtn.addEventListener('click', handleDisconnect);
    elements.parseBtn.addEventListener('click', handleParse);
    elements.clearBtn.addEventListener('click', handleClear);
    elements.clearLogBtn.addEventListener('click', handleClearLog);
    elements.sendAllBtn.addEventListener('click', handleSendAll);
    
    // Delegate click events for send buttons in the messages table
    elements.messagesBody.addEventListener('click', handleTableClick);

    // Initialize WebSocket connection
    initWebSocket();
    
    // Fetch initial status
    fetchStatus();
    
    // Add sample XML for testing
    elements.conversationInput.value = getSampleXml();
  }

  // =====================
  // WebSocket
  // =====================
  
  function initWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + location.host + '/ws';
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = function() {
      appendLog('sys', 'WebSocket connected to server');
    };
    
    socket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
    
    socket.onclose = function() {
      appendLog('sys', 'WebSocket disconnected from server');
      // Attempt to reconnect after a delay
      setTimeout(initWebSocket, 3000);
    };
    
    socket.onerror = function(err) {
      console.error('WebSocket error:', err);
    };
  }

  function handleWebSocketMessage(data) {
    switch (data.type) {
      case 'status':
        updateConnectionStatus(data.connected, data.host, data.port);
        break;
      case 'log':
        appendLog(data.direction, data.data, data.messageId);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  // =====================
  // Connection Handling
  // =====================
  
  async function handleConnect() {
    const host = elements.hostInput.value.trim();
    const port = parseInt(elements.portInput.value, 10);
    
    if (!host) {
      showParseError('Please enter a host');
      return;
    }
    
    if (!port || port < 1 || port > 65535) {
      showParseError('Please enter a valid port (1-65535)');
      return;
    }
    
    clearParseError();
    elements.connectBtn.disabled = true;
    
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        showParseError('Connection failed: ' + result.error);
      }
      
      updateConnectionStatus(result.connected, result.host, result.port);
    } catch (err) {
      showParseError('Request failed: ' + err.message);
    } finally {
      elements.connectBtn.disabled = false;
    }
  }

  async function handleDisconnect() {
    elements.disconnectBtn.disabled = true;
    
    try {
      const response = await fetch('/api/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      updateConnectionStatus(result.connected, result.host, result.port);
    } catch (err) {
      showParseError('Disconnect failed: ' + err.message);
    } finally {
      elements.disconnectBtn.disabled = false;
    }
  }

  async function fetchStatus() {
    try {
      const response = await fetch('/api/status');
      const result = await response.json();
      updateConnectionStatus(result.connected, result.host, result.port);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }

  function updateConnectionStatus(connected, host, port) {
    isConnected = connected;
    
    if (connected) {
      elements.statusIndicator.classList.add('connected');
      elements.statusText.textContent = 'CONNECTED: ' + host + ':' + port;
      elements.connectBtn.disabled = true;
      elements.disconnectBtn.disabled = false;
    } else {
      elements.statusIndicator.classList.remove('connected');
      elements.statusText.textContent = 'DISCONNECTED';
      elements.connectBtn.disabled = false;
      elements.disconnectBtn.disabled = true;
    }
    
    updateSendButtons();
  }

  // =====================
  // XML Parsing
  // =====================
  
  function handleParse() {
    const xmlString = elements.conversationInput.value.trim();
    
    if (!xmlString) {
      showParseError('Please paste XML content first');
      return;
    }
    
    clearParseError();
    messages = [];
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parser errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML: ' + parserError.textContent.substring(0, 100));
      }
      
      // Verify root element is Session
      const root = doc.documentElement;
      if (root.tagName !== 'Session') {
        throw new Error('Root element must be <Session>, found <' + root.tagName + '>');
      }
      
      // Parse each child element
      const serializer = new XMLSerializer();
      const children = root.children;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const tagName = child.tagName;
        
        // Extract header info
        let messageType = null;
        let controlId = null;
        
        const hdr = child.querySelector('HDR');
        if (hdr) {
          // Use CSS escaping for the dot in element names
          const mtElem = hdr.querySelector('HDR\\.message_type');
          const cidElem = hdr.querySelector('HDR\\.control_id');
          
          if (mtElem && mtElem.getAttribute('V')) {
            messageType = mtElem.getAttribute('V');
          }
          if (cidElem && cidElem.getAttribute('V')) {
            controlId = cidElem.getAttribute('V');
          }
        }
        
        // Serialize back to string
        const rawXml = serializer.serializeToString(child);
        
        messages.push({
          id: 'msg-' + (i + 1),
          index: i + 1,
          tagName: tagName,
          messageType: messageType,
          controlId: controlId,
          rawXml: rawXml
        });
      }
      
      if (messages.length === 0) {
        throw new Error('No message elements found inside <Session>');
      }
      
      renderMessagesTable();
      appendLog('sys', 'Parsed ' + messages.length + ' message(s) from XML');
      
    } catch (err) {
      showParseError(err.message);
      renderMessagesTable(); // Clear the table
    }
  }

  function handleClear() {
    elements.conversationInput.value = '';
    messages = [];
    renderMessagesTable();
    clearParseError();
  }

  // =====================
  // Messages Table
  // =====================
  
  function renderMessagesTable() {
    elements.messageCount.textContent = '(' + messages.length + ')';
    elements.sendAllBtn.disabled = messages.length === 0 || !isConnected;
    
    if (messages.length === 0) {
      elements.messagesBody.innerHTML = 
        '<tr class="empty-row"><td colspan="6">No messages parsed. Paste XML and click PARSE MESSAGES.</td></tr>';
      return;
    }
    
    let html = '';
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const preview = msg.rawXml.substring(0, 60).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      html += '<tr data-id="' + msg.id + '">';
      html += '<td class="col-index">' + msg.index + '</td>';
      html += '<td class="col-tag">' + escapeHtml(msg.tagName) + '</td>';
      html += '<td class="col-type">' + escapeHtml(msg.messageType || '-') + '</td>';
      html += '<td class="col-id">' + escapeHtml(msg.controlId || '-') + '</td>';
      html += '<td class="col-preview"><span class="preview-text">' + preview + '…</span></td>';
      html += '<td class="col-action"><button class="send-btn" data-id="' + msg.id + '"' + 
              (isConnected ? '' : ' disabled') + '>SEND</button></td>';
      html += '</tr>';
    }
    
    elements.messagesBody.innerHTML = html;
  }

  function handleTableClick(event) {
    if (event.target.classList.contains('send-btn')) {
      const messageId = event.target.getAttribute('data-id');
      sendMessage(messageId);
    }
  }

  function updateSendButtons() {
    const sendButtons = elements.messagesBody.querySelectorAll('.send-btn');
    sendButtons.forEach(function(btn) {
      btn.disabled = !isConnected;
    });
    elements.sendAllBtn.disabled = messages.length === 0 || !isConnected;
  }

  // =====================
  // Sending Messages
  // =====================
  
  async function sendMessage(messageId) {
    const message = messages.find(function(m) { return m.id === messageId; });
    
    if (!message) {
      appendLog('sys', 'Error: Message not found: ' + messageId);
      return;
    }
    
    if (!isConnected) {
      appendLog('sys', 'Error: Not connected');
      return;
    }
    
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          rawXml: message.rawXml
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        appendLog('sys', 'Send failed: ' + result.error);
      }
    } catch (err) {
      appendLog('sys', 'Request failed: ' + err.message);
    }
  }

  async function handleSendAll() {
    if (messages.length === 0 || !isConnected) {
      return;
    }
    
    elements.sendAllBtn.disabled = true;
    appendLog('sys', 'Sending all ' + messages.length + ' messages sequentially...');
    
    for (let i = 0; i < messages.length; i++) {
      await sendMessage(messages[i].id);
      // Small delay between messages
      if (i < messages.length - 1) {
        await delay(100);
      }
    }
    
    appendLog('sys', 'Finished sending all messages');
    elements.sendAllBtn.disabled = !isConnected;
  }

  // =====================
  // Log View
  // =====================
  
  function appendLog(direction, text, messageId) {
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + direction;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = getTimestamp();
    
    const dirLabel = document.createElement('span');
    dirLabel.className = 'direction';
    
    switch (direction) {
      case 'in':
        dirLabel.textContent = '[IN ]';
        break;
      case 'out':
        dirLabel.textContent = '[OUT]';
        break;
      case 'sys':
        dirLabel.textContent = '[SYS]';
        break;
      default:
        dirLabel.textContent = '[???]';
    }
    
    const content = document.createElement('span');
    content.className = 'content';
    content.textContent = text;
    
    entry.appendChild(timestamp);
    entry.appendChild(dirLabel);
    entry.appendChild(content);
    
    elements.logContainer.appendChild(entry);
    
    // Auto-scroll to bottom
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
  }

  function handleClearLog() {
    elements.logContainer.innerHTML = '';
  }

  // =====================
  // Utility Functions
  // =====================
  
  function showParseError(message) {
    elements.parseError.textContent = message;
  }

  function clearParseError() {
    elements.parseError.textContent = '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getTimestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return h + ':' + m + ':' + s + '.' + ms;
  }

  function delay(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

  function getSampleXml() {
    return `<Session>
  <HEL.R01>
    <HDR>
      <HDR.message_type V="HEL.R01"/>
      <HDR.control_id V="1001"/>
      <HDR.version_id V="POCT1"/>
      <HDR.creation_dttm V="2025-11-28T10:00:00-05:00"/>
    </HDR>
    <HEL>
      <HEL.sender_name V="POCT Device"/>
      <HEL.sender_id V="DEV001"/>
    </HEL>
  </HEL.R01>
  
  <DST.R01>
    <HDR>
      <HDR.message_type V="DST.R01"/>
      <HDR.control_id V="1002"/>
      <HDR.version_id V="POCT1"/>
      <HDR.creation_dttm V="2025-11-28T10:00:01-05:00"/>
    </HDR>
    <DST>
      <DST.device_type V="Glucose Meter"/>
      <DST.device_name V="AccuCheck Pro"/>
    </DST>
  </DST.R01>
  
  <OBS.R01>
    <HDR>
      <HDR.message_type V="OBS.R01"/>
      <HDR.control_id V="1003"/>
      <HDR.version_id V="POCT1"/>
      <HDR.creation_dttm V="2025-11-28T10:00:02-05:00"/>
    </HDR>
    <OBS>
      <OBS.observation_id V="GLU"/>
      <OBS.value V="105"/>
      <OBS.units V="mg/dL"/>
    </OBS>
  </OBS.R01>
  
  <EOT.R01>
    <HDR>
      <HDR.message_type V="EOT.R01"/>
      <HDR.control_id V="1004"/>
      <HDR.version_id V="POCT1"/>
      <HDR.creation_dttm V="2025-11-28T10:00:03-05:00"/>
    </HDR>
    <EOT>
      <EOT.reason V="Normal"/>
    </EOT>
  </EOT.R01>
</Session>`;
  }

})();
