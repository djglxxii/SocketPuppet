<script lang="ts">
  import { connection, wsConnected, addLogEntry } from '../stores';
  
  let host = 'localhost';
  let port = 9000;
  let isConnecting = false;
  
  // Subscribe to connection state
  $: isConnected = $connection.connected;
  $: wsStatus = $wsConnected;
  
  async function handleConnect() {
    if (isConnecting || isConnected) return;
    
    isConnecting = true;
    addLogEntry('sys', `Connecting to ${host}:${port}...`);
    
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: Number(port) }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        addLogEntry('sys', `Connection failed: ${result.error}`);
      }
    } catch (err) {
      addLogEntry('sys', `Connection error: ${err}`);
    } finally {
      isConnecting = false;
    }
  }
  
  async function handleDisconnect() {
    if (!isConnected) return;
    
    try {
      await fetch('/api/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      addLogEntry('sys', `Disconnect error: ${err}`);
    }
  }
</script>

<div class="connection-bar">
  <div class="title-section">
    <span class="terminal-prompt">▶</span>
    <h1 class="title">SOCKPUPPET</h1>
    <span class="subtitle">TCP TERMINAL</span>
  </div>
  
  <div class="controls">
    <div class="input-group">
      <label for="host">HOST:</label>
      <input
        type="text"
        id="host"
        bind:value={host}
        disabled={isConnected}
        placeholder="localhost"
      />
    </div>
    
    <div class="input-group">
      <label for="port">PORT:</label>
      <input
        type="number"
        id="port"
        bind:value={port}
        disabled={isConnected}
        placeholder="9000"
        min="1"
        max="65535"
      />
    </div>
    
    <button
      class="btn connect"
      on:click={handleConnect}
      disabled={isConnected || isConnecting}
    >
      {isConnecting ? 'CONNECTING...' : 'CONNECT'}
    </button>
    
    <button
      class="btn disconnect"
      on:click={handleDisconnect}
      disabled={!isConnected}
    >
      DISCONNECT
    </button>
  </div>
  
  <div class="status-section">
    <div class="status-indicator" class:connected={isConnected}>
      <span class="dot"></span>
      <span class="label">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
    </div>
    <div class="ws-indicator" class:connected={wsStatus}>
      <span class="dot"></span>
      <span class="label">WS</span>
    </div>
  </div>
</div>

<style>
  .connection-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(180deg, #0a0a0a 0%, #050505 100%);
    border: 1px solid rgba(255, 176, 0, 0.3);
    border-bottom: 2px solid rgba(255, 176, 0, 0.4);
  }
  
  .title-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .terminal-prompt {
    color: #ffb000;
    font-size: 1.2rem;
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }
  
  .title {
    font-family: 'VT323', monospace;
    font-size: 1.8rem;
    color: #ffb84d;
    margin: 0;
    text-shadow: 0 0 10px rgba(255, 184, 77, 0.5);
    letter-spacing: 0.1em;
  }
  
  .subtitle {
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    color: rgba(255, 176, 0, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .input-group label {
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
    color: rgba(255, 176, 0, 0.7);
  }
  
  .input-group input {
    background: #0a0a0a;
    border: 1px solid rgba(255, 176, 0, 0.4);
    color: #ffb84d;
    padding: 0.4rem 0.6rem;
    font-family: 'Fira Code', monospace;
    font-size: 0.85rem;
    width: 120px;
    outline: none;
    transition: all 0.2s;
  }
  
  .input-group input[type="number"] {
    width: 80px;
  }
  
  .input-group input:focus {
    border-color: #ffb000;
    box-shadow: 0 0 8px rgba(255, 176, 0, 0.3);
  }
  
  .input-group input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn {
    font-family: 'Fira Code', monospace;
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255, 176, 0, 0.6);
    background: transparent;
    color: #ffb84d;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }
  
  .btn:hover:not(:disabled) {
    background: #ffb000;
    color: #000;
    box-shadow: 0 0 12px rgba(255, 176, 0, 0.5);
  }
  
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .btn.connect:hover:not(:disabled) {
    background: #00ff88;
    border-color: #00ff88;
    color: #000;
    box-shadow: 0 0 12px rgba(0, 255, 136, 0.5);
  }
  
  .btn.disconnect:hover:not(:disabled) {
    background: #ff4444;
    border-color: #ff4444;
    color: #000;
    box-shadow: 0 0 12px rgba(255, 68, 68, 0.5);
  }
  
  .status-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .status-indicator,
  .ws-indicator {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    color: rgba(255, 176, 0, 0.5);
  }
  
  .status-indicator .dot,
  .ws-indicator .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #444;
    transition: all 0.3s;
  }
  
  .status-indicator.connected .dot {
    background: #00ff88;
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.7);
  }
  
  .status-indicator.connected .label {
    color: #00ff88;
  }
  
  .ws-indicator.connected .dot {
    background: #4488ff;
    box-shadow: 0 0 8px rgba(68, 136, 255, 0.7);
  }
  
  .ws-indicator.connected .label {
    color: #4488ff;
  }
</style>
