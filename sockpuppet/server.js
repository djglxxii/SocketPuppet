const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { tcpClient } = require('./tcpClient');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Create WebSocket server on /ws path
const wss = new WebSocketServer({ server, path: '/ws' });

// Store connected WebSocket clients
const wsClients = new Set();

// Middleware
app.use(express.json());

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Broadcast a message to all connected WebSocket clients
 * @param {object} message - The message object to send
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  });
}

// Subscribe to TCP client events
tcpClient.on('sent', (event) => {
  if (event.direction === 'sys') {
    broadcast({
      type: 'log',
      direction: 'sys',
      data: event.data
    });
  } else {
    broadcast({
      type: 'log',
      direction: 'out',
      messageId: event.messageId,
      data: event.data
    });
  }
});

tcpClient.on('data', (event) => {
  broadcast({
    type: 'log',
    direction: 'in',
    data: event.data
  });
});

tcpClient.on('error', (event) => {
  broadcast({
    type: 'log',
    direction: 'sys',
    data: `Error: ${event.error}`
  });
});

tcpClient.on('close', () => {
  broadcast({
    type: 'log',
    direction: 'sys',
    data: 'Connection closed by remote host'
  });
});

tcpClient.on('status', (status) => {
  broadcast({
    type: 'status',
    ...status
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  wsClients.add(ws);

  // Send current status immediately
  const status = tcpClient.getStatus();
  ws.send(JSON.stringify({
    type: 'status',
    ...status
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    wsClients.delete(ws);
  });
});

// ===================
// REST API Endpoints
// ===================

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Get connection status
app.get('/api/status', (req, res) => {
  res.json(tcpClient.getStatus());
});

// Connect to TCP server
app.post('/api/connect', async (req, res) => {
  const { host, port } = req.body;

  if (!host || typeof host !== 'string') {
    return res.json({
      success: false,
      error: 'Invalid host',
      connected: tcpClient.connected,
      host: tcpClient.host,
      port: tcpClient.port
    });
  }

  const portNum = parseInt(port, 10);
  if (!portNum || portNum < 1 || portNum > 65535) {
    return res.json({
      success: false,
      error: 'Invalid port (must be 1-65535)',
      connected: tcpClient.connected,
      host: tcpClient.host,
      port: tcpClient.port
    });
  }

  try {
    await tcpClient.connect(host, portNum);
    res.json({
      success: true,
      connected: tcpClient.connected,
      host: tcpClient.host,
      port: tcpClient.port
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      connected: tcpClient.connected,
      host: tcpClient.host,
      port: tcpClient.port
    });
  }
});

// Disconnect from TCP server
app.post('/api/disconnect', (req, res) => {
  tcpClient.disconnect();
  res.json({
    success: true,
    connected: tcpClient.connected,
    host: tcpClient.host,
    port: tcpClient.port
  });
});

// Send a message
app.post('/api/send', (req, res) => {
  const { messageId, rawXml } = req.body;

  if (!rawXml || typeof rawXml !== 'string') {
    return res.json({ success: false, error: 'Invalid rawXml' });
  }

  if (!tcpClient.connected) {
    return res.json({ success: false, error: 'Not connected' });
  }

  try {
    tcpClient.send(rawXml, messageId);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗ ██████╗  ██████╗██╗  ██╗██████╗ ██╗   ██╗██████╗  ║
║   ██╔════╝██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║██╔══██╗ ║
║   ███████╗██║   ██║██║     █████╔╝ ██████╔╝██║   ██║██████╔╝ ║
║   ╚════██║██║   ██║██║     ██╔═██╗ ██╔═══╝ ██║   ██║██╔═══╝  ║
║   ███████║╚██████╔╝╚██████╗██║  ██╗██║     ╚██████╔╝██║      ║
║   ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝      ║
║                                                              ║
║             TCP Terminal for POCT1-A XML Testing             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

  🖥️  Server running at http://localhost:${PORT}
  📡  WebSocket endpoint: ws://localhost:${PORT}/ws
  ❤️  Health check: http://localhost:${PORT}/health
`);
});
