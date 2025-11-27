<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { connection, type ParsedMessage } from '../stores';
  
  export let messages: ParsedMessage[] = [];
  
  const dispatch = createEventDispatcher<{ send: { id: string; rawXml: string } }>();
  
  let expandedId: string | null = null;
  let editingId: string | null = null;
  let editText = '';
  
  $: isConnected = $connection.connected;
  
  function toggleExpand(id: string) {
    if (expandedId === id) {
      expandedId = null;
      editingId = null;
    } else {
      expandedId = id;
      editingId = null;
    }
  }
  
  function startEdit(msg: ParsedMessage) {
    editingId = msg.id;
    editText = msg.rawXml;
  }
  
  function saveEdit(msg: ParsedMessage) {
    msg.rawXml = editText;
    messages = [...messages]; // trigger reactivity
    editingId = null;
  }
  
  function cancelEdit() {
    editingId = null;
    editText = '';
  }
  
  function handleSend(msg: ParsedMessage) {
    dispatch('send', { id: msg.id, rawXml: msg.rawXml });
  }
  
  function truncate(text: string, maxLen: number): string {
    const oneLine = text.replace(/\s+/g, ' ').trim();
    if (oneLine.length <= maxLen) return oneLine;
    return oneLine.slice(0, maxLen) + '...';
  }
</script>

<div class="message-list">
  <div class="header">
    <span class="prompt">></span>
    <h2>PARSED MESSAGES</h2>
    <span class="count">{messages.length}</span>
  </div>
  
  <div class="content">
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">◇</div>
        <p>No messages parsed yet.</p>
        <p class="hint">Paste XML and click PARSE MESSAGES</p>
      </div>
    {:else}
      <table>
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th class="col-tag">TAG</th>
            <th class="col-type">TYPE</th>
            <th class="col-id">CTRL ID</th>
            <th class="col-preview">PREVIEW</th>
            <th class="col-actions">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#each messages as msg, idx}
            <tr class="message-row" class:expanded={expandedId === msg.id}>
              <td class="col-idx">{idx + 1}</td>
              <td class="col-tag">
                <button class="tag-button" on:click={() => toggleExpand(msg.id)}>
                  {msg.tagName}
                </button>
              </td>
              <td class="col-type">{msg.messageType || '-'}</td>
              <td class="col-id">{msg.controlId || '-'}</td>
              <td class="col-preview">
                <code>{truncate(msg.rawXml, 50)}</code>
              </td>
              <td class="col-actions">
                <button
                  class="btn send"
                  on:click={() => handleSend(msg)}
                  disabled={!isConnected}
                  title={isConnected ? 'Send this message' : 'Connect first'}
                >
                  SEND
                </button>
              </td>
            </tr>
            
            {#if expandedId === msg.id}
              <tr class="detail-row">
                <td colspan="6">
                  <div class="detail-content">
                    {#if editingId === msg.id}
                      <textarea
                        bind:value={editText}
                        class="edit-textarea"
                        spellcheck="false"
                      ></textarea>
                      <div class="edit-actions">
                        <button class="btn save" on:click={() => saveEdit(msg)}>SAVE</button>
                        <button class="btn cancel" on:click={cancelEdit}>CANCEL</button>
                      </div>
                    {:else}
                      <pre>{msg.rawXml}</pre>
                      <button class="btn edit" on:click={() => startEdit(msg)}>EDIT XML</button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .message-list {
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
  
  .count {
    margin-left: auto;
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
    background: rgba(255, 176, 0, 0.15);
    border: 1px solid rgba(255, 176, 0, 0.3);
    color: #ffb84d;
  }
  
  .content {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
    color: rgba(255, 176, 0, 0.4);
    font-family: 'Fira Code', monospace;
  }
  
  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }
  
  .empty-state p {
    margin: 0.25rem 0;
    font-size: 0.8rem;
  }
  
  .empty-state .hint {
    font-size: 0.7rem;
    opacity: 0.6;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Fira Code', monospace;
    font-size: 0.75rem;
  }
  
  thead {
    position: sticky;
    top: 0;
    background: #0a0a0a;
    z-index: 1;
  }
  
  th {
    padding: 0.5rem;
    text-align: left;
    color: rgba(255, 176, 0, 0.6);
    font-weight: normal;
    border-bottom: 1px solid rgba(255, 176, 0, 0.3);
    white-space: nowrap;
  }
  
  td {
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid rgba(255, 176, 0, 0.1);
    color: #ffb84d;
    vertical-align: middle;
  }
  
  .message-row:hover {
    background: rgba(255, 176, 0, 0.05);
  }
  
  .message-row.expanded {
    background: rgba(255, 176, 0, 0.08);
  }
  
  .col-idx {
    width: 30px;
    text-align: center;
    color: rgba(255, 176, 0, 0.5);
  }
  
  .col-tag {
    width: 100px;
  }
  
  .tag-button {
    background: none;
    border: 1px solid rgba(255, 176, 0, 0.3);
    color: #ffb84d;
    padding: 0.2rem 0.4rem;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .tag-button:hover {
    background: rgba(255, 176, 0, 0.1);
    border-color: rgba(255, 176, 0, 0.5);
  }
  
  .col-type,
  .col-id {
    width: 80px;
    color: rgba(255, 176, 0, 0.7);
  }
  
  .col-preview {
    max-width: 200px;
    overflow: hidden;
  }
  
  .col-preview code {
    font-size: 0.7rem;
    color: rgba(255, 176, 0, 0.5);
    word-break: break-all;
  }
  
  .col-actions {
    width: 70px;
    text-align: right;
  }
  
  .btn {
    font-family: 'Fira Code', monospace;
    font-size: 0.65rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid rgba(255, 176, 0, 0.5);
    background: transparent;
    color: #ffb84d;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }
  
  .btn:hover:not(:disabled) {
    background: #ffb000;
    color: #000;
  }
  
  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .btn.send:hover:not(:disabled) {
    background: #00ff88;
    border-color: #00ff88;
    box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
  }
  
  .detail-row td {
    padding: 0;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .detail-content {
    padding: 0.75rem;
    border-top: 1px dashed rgba(255, 176, 0, 0.2);
  }
  
  .detail-content pre {
    margin: 0 0 0.75rem 0;
    padding: 0.75rem;
    background: #0a0a0a;
    border: 1px solid rgba(255, 176, 0, 0.2);
    color: rgba(255, 176, 0, 0.8);
    font-size: 0.7rem;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
  
  .edit-textarea {
    width: 100%;
    min-height: 150px;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: #0a0a0a;
    border: 1px solid rgba(255, 176, 0, 0.4);
    color: #ffb84d;
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    line-height: 1.5;
    resize: vertical;
    outline: none;
  }
  
  .edit-textarea:focus {
    border-color: #ffb000;
    box-shadow: 0 0 8px rgba(255, 176, 0, 0.2);
  }
  
  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn.save:hover {
    background: #00ff88;
    border-color: #00ff88;
  }
  
  .btn.cancel:hover {
    background: rgba(255, 68, 68, 0.2);
    border-color: #ff4444;
    color: #ff6b6b;
  }
  
  .btn.edit {
    border-color: rgba(255, 176, 0, 0.3);
  }
</style>
