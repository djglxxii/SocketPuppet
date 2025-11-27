<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { logEntries, type LogEntry } from '../stores';
  
  let logContainer: HTMLDivElement;
  let autoScroll = true;
  
  $: entries = $logEntries;
  
  afterUpdate(() => {
    if (autoScroll && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
  
  function handleScroll() {
    if (!logContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logContainer;
    // Consider "at bottom" if within 50px of the bottom
    autoScroll = scrollHeight - scrollTop - clientHeight < 50;
  }
  
  function clearLog() {
    logEntries.set([]);
  }
  
  function scrollToBottom() {
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
      autoScroll = true;
    }
  }
  
  function getDirectionLabel(direction: string): string {
    switch (direction) {
      case 'out': return '[OUT]';
      case 'in': return '[IN ]';
      case 'sys': return '[SYS]';
      default: return '[???]';
    }
  }
</script>

<div class="log-view">
  <div class="header">
    <span class="prompt">$</span>
    <h2>TRANSMISSION LOG</h2>
    
    <div class="header-actions">
      <button class="btn scroll" on:click={scrollToBottom} title="Scroll to bottom">
        ↓ BOTTOM
      </button>
      <button class="btn clear" on:click={clearLog} title="Clear log">
        CLEAR
      </button>
    </div>
  </div>
  
  <div 
    class="log-content" 
    bind:this={logContainer}
    on:scroll={handleScroll}
  >
    {#if entries.length === 0}
      <div class="empty-log">
        <span class="cursor">_</span> Awaiting transmissions...
      </div>
    {:else}
      {#each entries as entry (entry.id)}
        <div class="log-entry {entry.direction}">
          <span class="time">{entry.time}</span>
          <span class="direction">{getDirectionLabel(entry.direction)}</span>
          <span class="text">{entry.text}</span>
        </div>
      {/each}
    {/if}
  </div>
  
  {#if !autoScroll && entries.length > 0}
    <button class="scroll-indicator" on:click={scrollToBottom}>
      ↓ New messages below
    </button>
  {/if}
</div>

<style>
  .log-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #030303;
    border: 1px solid rgba(255, 176, 0, 0.25);
    position: relative;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(90deg, rgba(255, 176, 0, 0.1) 0%, transparent 100%);
    border-bottom: 1px solid rgba(255, 176, 0, 0.2);
  }
  
  .prompt {
    color: #ffb000;
    font-family: 'Fira Code', monospace;
    font-weight: bold;
  }
  
  .header h2 {
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
    color: rgba(255, 176, 0, 0.8);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    font-family: 'Fira Code', monospace;
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid rgba(255, 176, 0, 0.3);
    background: transparent;
    color: rgba(255, 176, 0, 0.6);
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }
  
  .btn:hover {
    border-color: rgba(255, 176, 0, 0.6);
    color: #ffb84d;
  }
  
  .log-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem;
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
    line-height: 1.6;
  }
  
  .empty-log {
    color: rgba(255, 176, 0, 0.3);
    padding: 0.5rem;
  }
  
  .cursor {
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .log-entry {
    display: flex;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
    word-break: break-all;
  }
  
  .log-entry:hover {
    background: rgba(255, 176, 0, 0.05);
  }
  
  .log-entry .time {
    flex-shrink: 0;
    color: rgba(255, 176, 0, 0.4);
    font-size: 0.7rem;
  }
  
  .log-entry .direction {
    flex-shrink: 0;
    font-weight: 500;
    width: 45px;
  }
  
  .log-entry .text {
    flex: 1;
    white-space: pre-wrap;
  }
  
  /* Direction-specific colors */
  .log-entry.out .direction {
    color: #00ff88;
    text-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
  }
  
  .log-entry.out .text {
    color: rgba(0, 255, 136, 0.85);
  }
  
  .log-entry.in .direction {
    color: #4488ff;
    text-shadow: 0 0 6px rgba(68, 136, 255, 0.5);
  }
  
  .log-entry.in .text {
    color: rgba(68, 136, 255, 0.85);
  }
  
  .log-entry.sys .direction {
    color: rgba(255, 176, 0, 0.6);
  }
  
  .log-entry.sys .text {
    color: rgba(255, 176, 0, 0.5);
    font-style: italic;
  }
  
  .scroll-indicator {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    padding: 0.4rem 0.8rem;
    background: rgba(255, 176, 0, 0.9);
    border: none;
    color: #000;
    cursor: pointer;
    border-radius: 2px;
    box-shadow: 0 2px 10px rgba(255, 176, 0, 0.4);
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .scroll-indicator:hover {
    background: #ffb000;
  }
  
  /* Scanline effect overlay */
  .log-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.1) 2px,
      rgba(0, 0, 0, 0.1) 4px
    );
    opacity: 0.3;
  }
</style>
