const net = require('net');
const { EventEmitter } = require('events');

/**
 * TCP Client Manager
 * 
 * Manages a single TCP connection with event-based communication.
 * Events emitted:
 *   - 'sent': When data is sent successfully { messageId, data }
 *   - 'data': When data is received from the server { data }
 *   - 'error': When a socket error occurs { error }
 *   - 'close': When the connection closes
 *   - 'status': When connection status changes { connected, host, port }
 */
class TcpClientManager extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.connected = false;
    this.host = null;
    this.port = null;
    this.appendNewline = false;
  }

  /**
   * Get current connection status
   * @returns {{ connected: boolean, host: string|null, port: number|null }}
   */
  getStatus() {
    return {
      connected: this.connected,
      host: this.host,
      port: this.port
    };
  }

  /**
   * Connect to a TCP server
   * @param {string} host - The host to connect to
   * @param {number} port - The port to connect to
   * @returns {Promise<void>}
   */
  connect(host, port) {
    return new Promise((resolve, reject) => {
      // If already connected to the same host/port, resolve immediately
      if (this.connected && this.host === host && this.port === port) {
        resolve();
        return;
      }

      // If connected to a different host/port, disconnect first
      if (this.connected) {
        this.disconnect();
      }

      this.socket = new net.Socket();

      const onConnect = () => {
        this.connected = true;
        this.host = host;
        this.port = port;
        this.emitStatus();
        this.emit('sent', { 
          messageId: null, 
          data: `[SYS] Connected to ${host}:${port}`,
          direction: 'sys'
        });
        resolve();
      };

      const onError = (err) => {
        this.emit('error', { error: err.message });
        this.cleanup();
        reject(err);
      };

      const onClose = () => {
        const wasConnected = this.connected;
        this.cleanup();
        if (wasConnected) {
          this.emit('close');
          this.emitStatus();
        }
      };

      const onData = (data) => {
        const incoming = data.toString('utf-8');
        this.emit('data', { data: incoming });
      };

      this.socket.once('connect', onConnect);
      this.socket.once('error', onError);
      this.socket.on('close', onClose);
      this.socket.on('data', onData);

      this.socket.connect(port, host);
    });
  }

  /**
   * Disconnect from the current TCP server
   */
  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.emit('sent', {
        messageId: null,
        data: '[SYS] Disconnected',
        direction: 'sys'
      });
      this.cleanup();
      this.emitStatus();
    }
  }

  /**
   * Send data over the TCP connection
   * @param {string} rawXml - The raw XML data to send
   * @param {string} [messageId] - Optional message identifier for logging
   * @throws {Error} If not connected
   */
  send(rawXml, messageId = null) {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected');
    }

    const dataToSend = this.appendNewline ? rawXml + '\r\n' : rawXml;

    this.socket.write(dataToSend);
    this.emit('sent', { messageId, data: rawXml, direction: 'out' });
  }

  /**
   * Set whether to append \r\n to sent messages
   * @param {boolean} value
   */
  setAppendNewline(value) {
    this.appendNewline = value;
  }

  /**
   * Clean up internal state
   * @private
   */
  cleanup() {
    this.connected = false;
    this.socket = null;
  }

  /**
   * Emit current status
   * @private
   */
  emitStatus() {
    this.emit('status', this.getStatus());
  }
}

// Export a singleton instance
const tcpClient = new TcpClientManager();

module.exports = { tcpClient };
