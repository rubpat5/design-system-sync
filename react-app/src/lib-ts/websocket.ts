import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionStatus, WebSocketHook } from '../types/websocket';

export const useWebSocket = (): WebSocketHook => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CLOSED');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const connect = useCallback((url: string): void => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setConnectionStatus('OPEN');
      };
      
      ws.onclose = () => {
        setConnectionStatus('CLOSED');
        wsRef.current = null;
      };
      
      ws.onerror = () => {
        setConnectionStatus('ERROR');
      };
      
      ws.onmessage = (event) => {
        setLastMessage(event.data);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('ERROR');
    }
  }, []);
  
  const disconnect = useCallback((): void => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnectionStatus('CLOSED');
    }
  }, []);
  
  const sendMessage = useCallback((message: string | object): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  return {
    connect,
    disconnect,
    sendMessage,
    connectionStatus,
    lastMessage
  };
} 