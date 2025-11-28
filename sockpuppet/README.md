# 🎭 Sockpuppet

**A retro amber-terminal TCP test client for POCT1-style XML conversations**

![Terminal Theme](https://img.shields.io/badge/theme-amber%20CRT-orange)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)
![No Build](https://img.shields.io/badge/build-none%20required-blue)

---

## Overview

Sockpuppet is a full-stack TCP test utility designed for testing POCT1-A style XML conversations over raw TCP connections. It features a beautiful 1980s amber monochrome CRT terminal aesthetic.

### Features

- 📡 **Raw TCP Communication** - Connect to any TCP server and send/receive data
- 📝 **XML Session Parsing** - Paste a `<Session>` document and parse individual messages
- 🎯 **Selective Message Sending** - Send any parsed message with a single click
- 📊 **Live Transmission Log** - Real-time WebSocket-powered log of all communications
- 🖥️ **Retro CRT Theme** - Authentic amber-on-black terminal aesthetic with scanlines and glow effects
- ⚡ **Zero Build** - Plain HTML5, CSS, and vanilla JavaScript. No bundlers required.

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm

### Installation & Running

```bash
# Navigate to the project
cd sockpuppet

# Install dependencies
npm install

# Start the server
npm run serve
# or
npm start
```

Then open your browser to **http://localhost:3000**

That's it! No build steps required.

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
      <HDR.creation_dttm V="2025-11-28T10:00:00-05:00"/>
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

Click the **SEND** button next to any message in the right panel to transmit it over the TCP connection. Use **SEND ALL SEQUENTIALLY** to send all messages in order.

### 5. Monitor the Log

Watch the transmission log at the bottom for:
- **[OUT]** - Outbound messages (green)
- **[IN ]** - Incoming responses (cyan)  
- **[SYS]** - System messages (amber)

---

## Project Structure

```
sockpuppet/
├── package.json       # Dependencies and scripts
├── server.js          # Express server + WebSocket + static hosting
├── tcpClient.js       # TCP client manager
├── public/
│   ├── index.html     # Main HTML page
│   ├── style.css      # Amber CRT theme styles
│   └── app.js         # Frontend JavaScript (vanilla)
└── README.md
```

---

## API Reference

### HTTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/status` | Get TCP connection status |
| POST | `/api/connect` | Connect to TCP server |
| POST | `/api/disconnect` | Disconnect from TCP server |
| POST | `/api/send` | Send XML message |

### Request/Response Examples

#### POST /api/connect
```json
// Request
{ "host": "192.168.1.100", "port": 4059 }

// Response
{ "success": true, "connected": true, "host": "192.168.1.100", "port": 4059 }
```

#### POST /api/send
```json
// Request
{ "messageId": "msg-1", "rawXml": "<HEL.R01>...</HEL.R01>" }

// Response
{ "success": true }
```

### WebSocket Events

Connect to `/ws` for real-time updates:

```javascript
// Status update
{ "type": "status", "connected": true, "host": "192.168.1.100", "port": 4059 }

// Log entry
{ "type": "log", "direction": "in" | "out" | "sys", "data": "...", "messageId": "msg-1" }
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

Example:
```bash
PORT=8080 npm start
```

---

## Tech Stack

- **Backend**: Node.js, Express, ws (WebSocket), net (TCP)
- **Frontend**: Vanilla HTML5, CSS, JavaScript (no frameworks, no build)
- **Fonts**: VT323 (titles), Fira Code (monospace)

---

## Development

Since there's no build step, you can edit the files in `public/` and simply refresh your browser:

- `public/index.html` - HTML structure
- `public/style.css` - Styles (amber CRT theme)
- `public/app.js` - Frontend logic

For backend changes, restart the server:
```bash
npm start
```

---

## License

MIT

---

<p align="center">
  <strong>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</strong><br>
  <em>Built with ❤️ and phosphor glow</em><br>
  <strong>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</strong>
</p>
