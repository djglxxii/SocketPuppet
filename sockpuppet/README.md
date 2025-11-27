# 🎭 Sockpuppet

**A retro amber-terminal TCP test client for POCT1-style XML conversations**

![Terminal Theme](https://img.shields.io/badge/theme-amber%20CRT-orange)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Svelte](https://img.shields.io/badge/svelte-4.x-red)

---

## Overview

Sockpuppet is a full-stack TCP test utility designed for testing POCT1-A style XML conversations over raw TCP connections. It features a beautiful 1980s amber monochrome CRT terminal aesthetic.

### Features

- 📡 **Raw TCP Communication** - Connect to any TCP server and send/receive data
- 📝 **XML Session Parsing** - Paste a `<Session>` document and parse individual messages
- 🎯 **Selective Message Sending** - Send any parsed message with a single click
- 📊 **Live Transmission Log** - Real-time WebSocket-powered log of all communications
- 🖥️ **Retro CRT Theme** - Authentic amber-on-black terminal aesthetic with scanlines and glow effects

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd sockpuppet

# Install all dependencies
npm run install:all
# Or manually:
# cd backend && npm install && cd ../client && npm install
```

### Development Mode

Run both backend and frontend in development mode:

```bash
# Terminal 1: Start the backend
npm run dev:backend

# Terminal 2: Start the frontend (Vite dev server)
npm run dev:client
```

- Backend runs on: `http://localhost:3000`
- Frontend dev server: `http://localhost:5173` (proxies API calls to backend)

### Production Build

```bash
# Build the client
npm run build:client

# Start the production server
npm start
```

The production server serves both the API and the built Svelte app on `http://localhost:3000`.

---

## Usage

### 1. Connect to a TCP Server

Enter the target host and port in the connection bar and click **CONNECT**.

### 2. Paste XML Conversation

In the left panel, paste your XML conversation wrapped in a `<Session>` root element:

```xml
<Session>
  <HEL.R01>
    <HDR>
      <HDR.message_type V="HEL.R01"/>
      <HDR.control_id V="1001"/>
      <HDR.version_id V="POCT1"/>
      <HDR.creation_dttm V="2025-11-26T10:00:00-05:00"/>
    </HDR>
    <HEL>...</HEL>
  </HEL.R01>
  
  <DST.R01>...</DST.R01>
  <OBS.R01>...</OBS.R01>
  <EOT.R01>...</EOT.R01>
</Session>
```

### 3. Parse Messages

Click **PARSE MESSAGES** to extract individual messages from the session.

### 4. Send Messages

Click the **SEND** button next to any message in the right panel to transmit it over the TCP connection.

### 5. Monitor the Log

Watch the transmission log at the bottom for:
- **[OUT]** - Outbound messages (green)
- **[IN ]** - Incoming responses (blue)  
- **[SYS]** - System messages (amber)

---

## Project Structure

```
sockpuppet/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts      # Express server + WebSocket
│       └── tcpClient.ts   # TCP client manager
├── client/
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.ts
│       ├── App.svelte
│       └── lib/
│           ├── stores.ts
│           └── components/
│               ├── ConnectionBar.svelte
│               ├── ConversationInput.svelte
│               ├── MessageList.svelte
│               └── LogView.svelte
├── package.json           # Root scripts
└── README.md
```

---

## API Reference

### HTTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/status` | Get connection status |
| POST | `/api/connect` | Connect to TCP server |
| POST | `/api/disconnect` | Disconnect from TCP server |
| POST | `/api/send` | Send XML message |

### WebSocket Events

Connect to `/ws` for real-time updates:

```typescript
// Status update
{ type: 'status', connected: boolean, host: string, port: number }

// Log entry
{ type: 'log', direction: 'in' | 'out' | 'sys', data: string, messageId?: string }
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

---

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, ws (WebSocket), net (TCP)
- **Frontend**: Svelte 4, Vite, TypeScript
- **Fonts**: VT323 (titles), Fira Code (monospace)

---

## License

MIT

---

<p align="center">
  <strong>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</strong><br>
  <em>Built with ❤️ and phosphor glow</em><br>
  <strong>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</strong>
</p>
