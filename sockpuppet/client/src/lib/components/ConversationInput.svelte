<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { conversationText, parseSessionXml, addLogEntry, type ParsedMessage } from '../stores';
  
  const dispatch = createEventDispatcher<{ parsed: ParsedMessage[] }>();
  
  let error: string | null = null;
  let text = '';
  
  // Example placeholder XML
  const placeholder = `<Session>
  <HEL.R01>
    <HDR>
      <HDR.message_type V="HEL.R01"/>
      <HDR.control_id V="1001"/>
      <HDR.version_id V="POCT1"/>
    </HDR>
    <HEL>...</HEL>
  </HEL.R01>
  <DST.R01>...</DST.R01>
  <OBS.R01>...</OBS.R01>
  <EOT.R01>...</EOT.R01>
</Session>`;
  
  function handleParse() {
    error = null;
    
    if (!text.trim()) {
      error = 'Please paste XML content first';
      return;
    }
    
    const result = parseSessionXml(text);
    
    if ('error' in result) {
      error = result.error;
      addLogEntry('sys', `Parse error: ${result.error}`);
      return;
    }
    
    if (result.length === 0) {
      error = 'No messages found in <Session>';
      return;
    }
    
    addLogEntry('sys', `Parsed ${result.length} message(s) from XML`);
    dispatch('parsed', result);
    conversationText.set(text);
  }
  
  function handleClear() {
    text = '';
    error = null;
  }
</script>

<div class="conversation-input">
  <div class="header">
    <span class="prompt">#</span>
    <h2>XML CONVERSATION</h2>
  </div>
  
  <div class="content">
    <textarea
      bind:value={text}
      {placeholder}
      spellcheck="false"
    ></textarea>
    
    {#if error}
      <div class="error-message">
        <span class="error-icon">⚠</span>
        {error}
      </div>
    {/if}
    
    <div class="actions">
      <button class="btn parse" on:click={handleParse}>
        PARSE MESSAGES
      </button>
      <button class="btn clear" on:click={handleClear}>
        CLEAR
      </button>
    </div>
  </div>
</div>

<style>
  .conversation-input {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #050505;
    border: 1px solid rgba(255, 176, 0, 0.25);
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
  
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.75rem;
    min-height: 0;
  }
  
  textarea {
    flex: 1;
    background: #0a0a0a;
    border: 1px solid rgba(255, 176, 0, 0.3);
    color: #ffb84d;
    font-family: 'Fira Code', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    padding: 0.75rem;
    resize: none;
    outline: none;
    min-height: 150px;
  }
  
  textarea::placeholder {
    color: rgba(255, 176, 0, 0.3);
  }
  
  textarea:focus {
    border-color: rgba(255, 176, 0, 0.6);
    box-shadow: 0 0 8px rgba(255, 176, 0, 0.15);
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 68, 68, 0.15);
    border: 1px solid rgba(255, 68, 68, 0.4);
    color: #ff6b6b;
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
  }
  
  .error-icon {
    font-size: 1rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    flex: 1;
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255, 176, 0, 0.5);
    background: transparent;
    color: #ffb84d;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }
  
  .btn:hover {
    background: #ffb000;
    color: #000;
    box-shadow: 0 0 10px rgba(255, 176, 0, 0.4);
  }
  
  .btn.parse {
    flex: 2;
  }
  
  .btn.clear {
    flex: 1;
    border-color: rgba(255, 176, 0, 0.3);
  }
  
  .btn.clear:hover {
    background: rgba(255, 176, 0, 0.2);
    color: #ffb84d;
    box-shadow: none;
  }
</style>
