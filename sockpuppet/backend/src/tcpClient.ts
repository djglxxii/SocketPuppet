import net from 'net';
import { EventEmitter } from 'events';

export interface TcpClientStatus {
  connected: boolean;
  host: string | null;
  port: number | null;
}

export interface LogEvent {
  type: 'log';
  direction: 'in' | 'out' | 'sys';
  messageId?: string;
  data: string;
}

export interface StatusEvent {
  type: 'status';
  connected: boolean;
  host: string | null;
  port: number | null;
}

export type TcpClientEvent = LogEvent | StatusEvent;

class TcpClientManager extends EventEmitter {
  private socket: net.Socket | null = null;
  private _connected: boolean = false;
  private _host: string | null = null;
  private _port: number | null = null;
  private appendNewline: boolean = false;
  private dataBuffer: string = '';

  get connected(): boolean {
    return this._connected;
  }

  get host(): string | null {
    return this._host;
  }

  get port(): number | null {
    return this._port;
  }

  getStatus(): TcpClientStatus {
    return {
      connected: this._connected,
      host: this._host,
      port: this._port,
    };
  }

  async connect(host: string, port: number): Promise<void> {
    // If already connected to the same host/port, do nothing
    if (this._connected && this._host === host && this._port === port) {
      return;
    }

    // If connected to a different host/port, disconnect first
    if (this._connected) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      const onConnect = () => {
        this._connected = true;
        this._host = host;
        this._port = port;
        this.emitStatus();
        this.emitLog('sys', `Connected to ${host}:${port}`);
        resolve();
      };

      const onError = (err: Error) => {
        this.emitLog('sys', `Connection error: ${err.message}`);
        this.cleanup();
        reject(err);
      };

      const onClose = () => {
        if (this._connected) {
          this.emitLog('sys', `Connection closed`);
        }
        this.cleanup();
        this.emitStatus();
      };

      const onData = (data: Buffer) => {
        const incoming = data.toString('utf-8');
        this.dataBuffer += incoming;
        
        // Try to extract complete XML messages
        // For simplicity, emit the raw data as it comes
        // In a more sophisticated implementation, we might buffer and parse complete messages
        this.emitLog('in', incoming);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('error', onError);
      this.socket.on('close', onClose);
      this.socket.on('data', onData);

      this.socket.connect(port, host);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.cleanup();
      this.emitLog('sys', 'Disconnected');
      this.emitStatus();
    }
  }

  send(rawXml: string, messageId?: string): void {
    if (!this.socket || !this._connected) {
      this.emitLog('sys', 'Cannot send: not connected');
      return;
    }

    const dataToSend = this.appendNewline ? rawXml + '\r\n' : rawXml;
    
    try {
      this.socket.write(dataToSend);
      this.emitLog('out', rawXml, messageId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.emitLog('sys', `Send error: ${errorMessage}`);
    }
  }

  setAppendNewline(value: boolean): void {
    this.appendNewline = value;
  }

  private cleanup(): void {
    this._connected = false;
    this.socket = null;
    this.dataBuffer = '';
  }

  private emitStatus(): void {
    const event: StatusEvent = {
      type: 'status',
      connected: this._connected,
      host: this._host,
      port: this._port,
    };
    this.emit('event', event);
  }

  private emitLog(direction: 'in' | 'out' | 'sys', data: string, messageId?: string): void {
    const event: LogEvent = {
      type: 'log',
      direction,
      data,
      ...(messageId && { messageId }),
    };
    this.emit('event', event);
  }
}

// Export a singleton instance
export const tcpClient = new TcpClientManager();
