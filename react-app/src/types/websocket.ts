export type ConnectionStatus = 'OPEN' | 'CLOSED' | 'ERROR';

export interface WebSocketHook {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (message: string | object) => boolean;
  connectionStatus: ConnectionStatus;
  lastMessage: string | null;
} 