<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    messages, 
    logEntries, 
    connection, 
    addLogEntry, 
    connectWebSocket, 
    disconnectWebSocket,
    type ParsedMessage 
  } from './lib/stores';
  import ConnectionBar from './lib/components/ConnectionBar.svelte';
  import ConversationInput from './lib/components/ConversationInput.svelte';
  import MessageList from './lib/components/MessageList.svelte';
  import LogView from './lib/components/LogView.svelte';
  
  let parsedMessages: ParsedMessage[] = [];
  
  $: parsedMessages = $messages;
  
  onMount(() => {
    connectWebSocket();
    addLogEntry('sys', 'Sockpuppet TCP Terminal initialized');
  });
  
  onDestroy(() => {
    disconnectWebSocket();
  });
  
  function handleParsed(event: CustomEvent<ParsedMessage[]>) {
    messages.set(event.detail);
  }
  
  async function handleSend(event: CustomEvent<{ id: string; rawXml: string }>) {
    const { id, rawXml } = event.detail;
    
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, rawXml }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        addLogEntry('sys', `Send failed: ${result.error}`);
      }
    } catch (err) {
      addLogEntry('sys', `Send error: ${err}`);
    }
  }
</script>

<div class="app">
  <!-- CRT screen effect overlay -->
  <div class="crt-overlay"></div>
  
  <!-- Title bar -->
  <header class="app-header">
    <ConnectionBar />
  </header>
  
  <!-- Main content area -->
  <main class="app-main">
    <div class="panel-left">
      <ConversationInput on:parsed={handleParsed} />
    </div>
    <div class="panel-right">
      <MessageList messages={parsedMessages} on:send={handleSend} />
    </div>
  </main>
  
  <!-- Log view footer -->
  <footer class="app-footer">
    <LogView />
  </footer>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  
  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
    background: #000;
    color: #ffb84d;
    font-family: 'Fira Code', 'JetBrains Mono', 'SF Mono', 'Consolas', 'Monaco', monospace;
  }
  
  :global(body) {
    /* CRT glass gradient effect */
    background: 
      radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%),
      linear-gradient(180deg, rgba(255, 176, 0, 0.02) 0%, transparent 50%, rgba(255, 176, 0, 0.02) 100%);
  }
  
  :global(#app) {
    height: 100%;
  }
  
  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }
  
  :global(::-webkit-scrollbar-track) {
    background: #0a0a0a;
  }
  
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(255, 176, 0, 0.3);
    border-radius: 0;
  }
  
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(255, 176, 0, 0.5);
  }
  
  :global(::selection) {
    background: rgba(255, 176, 0, 0.3);
    color: #fff;
  }
  
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
  
  /* CRT overlay effects */
  .crt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9999;
    
    /* Scanlines */
    background: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.15) 2px,
        rgba(0, 0, 0, 0.15) 4px
      );
    
    /* Vignette effect */
    box-shadow: inset 0 0 150px rgba(0, 0, 0, 0.7);
  }
  
  /* Subtle screen flicker */
  .crt-overlay::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 184, 77, 0.02);
    animation: flicker 0.15s infinite;
    pointer-events: none;
  }
  
  @keyframes flicker {
    0% { opacity: 0.97; }
    50% { opacity: 1; }
    100% { opacity: 0.98; }
  }
  
  .app-header {
    flex-shrink: 0;
    z-index: 10;
  }
  
  .app-main {
    flex: 1;
    display: flex;
    gap: 1px;
    min-height: 0;
    padding: 0.5rem;
    padding-bottom: 0;
    background: rgba(255, 176, 0, 0.05);
  }
  
  .panel-left,
  .panel-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  
  .app-footer {
    flex-shrink: 0;
    height: 200px;
    padding: 0.5rem;
    padding-top: 0.5rem;
  }
  
  /* Phosphor glow effect for text */
  :global(.app h1, .app h2, .app .title) {
    text-shadow: 0 0 10px rgba(255, 184, 77, 0.5);
  }
  
  /* Responsive adjustments */
  @media (max-width: 900px) {
    .app-main {
      flex-direction: column;
    }
    
    .app-footer {
      height: 180px;
    }
  }
</style>
