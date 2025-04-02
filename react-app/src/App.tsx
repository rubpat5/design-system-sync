import React, { useState, useEffect } from 'react';
import { useWebSocket, parseFigmaComponent, generateReactToFigma } from './lib-ts';
import Button from './components/Button';
import { Component } from './types';
import './App.css';

const App: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [serverUrl, setServerUrl] = useState<string>('ws://localhost:3031');
  const [activeTab, setActiveTab] = useState<'components' | 'logs'>('components');
  
  const { 
    connect, 
    disconnect, 
    sendMessage, 
    connectionStatus, 
    lastMessage 
  } = useWebSocket();
  
  const addLog = (message: string): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
  };
  
  useEffect(() => {
    setConnected(connectionStatus === 'OPEN');
    
    if (connectionStatus === 'OPEN') {
      addLog('Connected to server');
      
      sendMessage({
        type: 'client-connect',
        clientType: 'react'
      });
    } else if (connectionStatus === 'CLOSED') {
      addLog('Disconnected from server');
    } else if (connectionStatus === 'ERROR') {
      addLog('Connection error');
    }
  }, [connectionStatus, sendMessage]);
  
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const message = JSON.parse(lastMessage);
      addLog(`Received message: ${message.type}`);
      
      if (message.type === 'figma-to-react') {
        handleFigmaComponents(message.components);
      }
    } catch (error) {
      addLog(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [lastMessage]);
  
  const handleFigmaComponents = (figmaComponents: any[]): void => {
    if (!figmaComponents?.length) {
      addLog('No components received');
      return;
    }
    
    addLog(`Received ${figmaComponents.length} component(s) from Figma`);
    
    const parsedComponents = figmaComponents.map(component => 
      parseFigmaComponent(component)
    );
    
    setComponents(prevComponents => {
      const newComponentMap = new Map<string, Component>();
      
      prevComponents.forEach(comp => {
        newComponentMap.set(comp.id, comp);
      });
      
      parsedComponents.forEach(comp => {
        newComponentMap.set(comp.id, comp);
      });
      
      return Array.from(newComponentMap.values());
    });
  };
  
  const handleConnect = (): void => {
    if (serverUrl) {
      addLog(`Connecting to ${serverUrl}...`);
      connect(serverUrl);
    }
  };
  
  const handleDisconnect = (): void => {
    disconnect();
    addLog('Disconnected from server');
  };
  
  const handleTestMessage = (): void => {
    if (connected) {
      const testMessage = {
        type: 'test-message',
        message: 'Hello from React app!',
        timestamp: new Date().toISOString()
      };
      
      sendMessage(testMessage);
      addLog('Sent test message');
    } else {
      addLog('Not connected to server');
    }
  };
  
  const handleUpdateComponent = (componentId: string, updates: any): void => {
    if (!connected) {
      addLog('Not connected to server');
      return;
    }
    
    const component = components.find(c => c.id === componentId);
    
    if (!component) {
      addLog(`Component not found: ${componentId}`);
      return;
    }
    
    const updateMessage = generateReactToFigma(component, updates);
    
    sendMessage({
      type: 'react-to-figma',
      component: updateMessage,
      timestamp: new Date().toISOString()
    });
    
    addLog(`Sent component update for: ${component.name}`);
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Design System Sync</h1>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      
      <div className="app-content">
        <div className="connection-panel">
          <h2>Server Connection</h2>
          <div className="form-group">
            <label>Server URL</label>
            <input 
              type="text" 
              value={serverUrl} 
              onChange={(e) => setServerUrl(e.target.value)}
            />
          </div>
          
          <div className="button-group">
            {!connected ? (
              <button onClick={handleConnect} className="primary-button">
                Connect
              </button>
            ) : (
              <button onClick={handleDisconnect} className="secondary-button">
                Disconnect
              </button>
            )}
            
            <button 
              onClick={handleTestMessage} 
              disabled={!connected}
              className="secondary-button"
            >
              Send Test Message
            </button>
          </div>
        </div>
        
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
          >
            Components
          </div>
          <div 
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </div>
        </div>
        
        <div className="tab-content">
          {activeTab === 'components' ? (
            <div className="components-panel">
              <h2>Synced Components</h2>
              
              {components.length === 0 ? (
                <div className="empty-state">
                  No components synced from Figma yet.
                </div>
              ) : (
                <div className="component-list">
                  {components.map(component => (
                    <div key={component.id} className="component-card">
                      <h3>{component.name}</h3>
                      <div className="component-preview">
                        {component.type === 'BUTTON' && (
                          <Button 
                            {...component.props} 
                            style={component.style ?? {}}
                            onUpdate={(updates) => handleUpdateComponent(component.id, updates)}
                          >
                            {component.name}
                          </Button>
                        )}
                      </div>
                      <div className="component-code">
                        <pre>{component.code}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="logs-panel">
              <h2>Activity Logs</h2>
              <div className="logs-container">
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App; 