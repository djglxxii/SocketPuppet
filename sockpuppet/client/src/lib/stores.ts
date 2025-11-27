import { writable, derived } from 'svelte/store';

// Connection state
export interface ConnectionState {
  connected: boolean;
  host: string;
  port: number | null;
}

export const connection = writable<ConnectionState>({
  connected: false,
  host: 'localhost',
  port: 9000,
});

// Parsed messages from XML
export interface ParsedMessage {
  id: string;
  tagName: string;
  messageType: string | null;
  controlId: string | null;
  rawXml: string;
}

export const messages = writable<ParsedMessage[]>([]);

// Log entries
export interface LogEntry {
  id: string;
  time: string;
  direction: 'in' | 'out' | 'sys';
  text: string;
}

export const logEntries = writable<LogEntry[]>([]);

// WebSocket connection status
export const wsConnected = writable<boolean>(false);

// Conversation input text
export const conversationText = writable<string>('');

// Helper to add a log entry
let logId = 0;
export function addLogEntry(direction: 'in' | 'out' | 'sys', text: string): void {
  const entry: LogEntry = {
    id: `log-${++logId}`,
    time: new Date().toISOString().slice(11, 23),
    direction,
    text,
  };
  logEntries.update((entries) => [...entries, entry]);
}

// Parse XML session and extract messages
export function parseSessionXml(xmlText: string): ParsedMessage[] | { error: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { error: 'XML Parse Error: ' + parseError.textContent };
  }
  
  // Ensure root is <Session>
  const root = doc.documentElement;
  if (root.tagName !== 'Session') {
    return { error: `Root element must be <Session>, found <${root.tagName}>` };
  }
  
  const serializer = new XMLSerializer();
  const parsedMessages: ParsedMessage[] = [];
  let msgIndex = 0;
  
  // Iterate direct children (element nodes only)
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    
    // Extract HDR.message_type and HDR.control_id if present
    let messageType: string | null = null;
    let controlId: string | null = null;
    
    const hdr = child.querySelector('HDR');
    if (hdr) {
      const msgTypeEl = hdr.querySelector('HDR\\.message_type');
      if (msgTypeEl) {
        messageType = msgTypeEl.getAttribute('V');
      }
      
      const controlIdEl = hdr.querySelector('HDR\\.control_id');
      if (controlIdEl) {
        controlId = controlIdEl.getAttribute('V');
      }
    }
    
    // Serialize the child back to XML
    const rawXml = serializer.serializeToString(child);
    
    parsedMessages.push({
      id: `msg-${++msgIndex}`,
      tagName: child.tagName,
      messageType,
      controlId,
      rawXml,
    });
  }
  
  return parsedMessages;
}

// WebSocket manager
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;

export function connectWebSocket(): void {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    wsConnected.set(true);
    addLogEntry('sys', 'WebSocket connected to server');
  };
  
  ws.onclose = () => {
    wsConnected.set(false);
    addLogEntry('sys', 'WebSocket disconnected');
    
    // Attempt reconnection after 3 seconds
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    reconnectTimer = window.setTimeout(() => {
      connectWebSocket();
    }, 3000);
  };
  
  ws.onerror = () => {
    addLogEntry('sys', 'WebSocket error');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status') {
        connection.update((conn) => ({
          ...conn,
          connected: data.connected,
          host: data.host || conn.host,
          port: data.port || conn.port,
        }));
      } else if (data.type === 'log') {
        addLogEntry(data.direction, data.data);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  };
}

export function disconnectWebSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}
