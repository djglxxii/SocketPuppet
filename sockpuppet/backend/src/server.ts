import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { tcpClient, TcpClientEvent } from './tcpClient';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Store connected WebSocket clients
const wsClients = new Set<WebSocket>();

// Subscribe to TCP client events and broadcast to all WebSocket clients
tcpClient.on('event', (event: TcpClientEvent) => {
  const message = JSON.stringify(event);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  wsClients.add(ws);

  // Send current status immediately
  const status = tcpClient.getStatus();
  ws.send(JSON.stringify({
    type: 'status',
    ...status,
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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// API: Get connection status
app.get('/api/status', (_req: Request, res: Response) => {
  res.json(tcpClient.getStatus());
});

// API: Connect to TCP server
app.post('/api/connect', async (req: Request, res: Response) => {
  const { host, port } = req.body;

  if (!host || typeof host !== 'string') {
    res.json({ success: false, error: 'Invalid host', connected: tcpClient.connected });
    return;
  }

  if (!port || typeof port !== 'number' || port < 1 || port > 65535) {
    res.json({ success: false, error: 'Invalid port', connected: tcpClient.connected });
    return;
  }

  try {
    await tcpClient.connect(host, port);
    res.json({
      success: true,
      connected: tcpClient.connected,
      host: tcpClient.host,
      port: tcpClient.port,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.json({
      success: false,
      error: errorMessage,
      connected: tcpClient.connected,
      host: tcpClient.host,
      port: tcpClient.port,
    });
  }
});

// API: Disconnect from TCP server
app.post('/api/disconnect', (_req: Request, res: Response) => {
  tcpClient.disconnect();
  res.json({
    success: true,
    connected: tcpClient.connected,
    host: tcpClient.host,
    port: tcpClient.port,
  });
});

// API: Send message
app.post('/api/send', (req: Request, res: Response) => {
  const { messageId, rawXml } = req.body;

  if (!rawXml || typeof rawXml !== 'string') {
    res.json({ success: false, error: 'Invalid rawXml' });
    return;
  }

  if (!tcpClient.connected) {
    res.json({ success: false, error: 'Not connected' });
    return;
  }

  try {
    tcpClient.send(rawXml, messageId);
    res.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.json({ success: false, error: errorMessage });
  }
});

// Serve static files from the Svelte build
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all other routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║                                                          ║`);
  console.log(`║   ███████╗ ██████╗  ██████╗██╗  ██╗██████╗ ██╗   ██╗██████╗  ██████╗ ███████╗████████╗  ║`);
  console.log(`║   ██╔════╝██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔════╝╚══██╔══╝  ║`);
  console.log(`║   ███████╗██║   ██║██║     █████╔╝ ██████╔╝██║   ██║██████╔╝██████╔╝█████╗     ██║     ║`);
  console.log(`║   ╚════██║██║   ██║██║     ██╔═██╗ ██╔═══╝ ██║   ██║██╔═══╝ ██╔═══╝ ██╔══╝     ██║     ║`);
  console.log(`║   ███████║╚██████╔╝╚██████╗██║  ██╗██║     ╚██████╔╝██║     ██║     ███████╗   ██║     ║`);
  console.log(`║   ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝     ╚═╝     ╚══════╝   ╚═╝     ║`);
  console.log(`║                                                          ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
  console.log(`  🖥️  Sockpuppet TCP Terminal running on http://localhost:${PORT}`);
  console.log(`  📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`  ❤️  Health check: http://localhost:${PORT}/health\n`);
});
