const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Design System Sync Server');
});

const wss = new WebSocket.Server({ server });

const clients = {
  figma: null,
  react: null
};

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  fs.appendFileSync(
    path.join(__dirname, 'server.log'),
    logMessage + '\n',
    { flag: 'a' }
  );
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  log(`New connection from ${ip}`);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      log(`Received message: ${JSON.stringify(message).substring(0, 200)}...`);
      
      switch (message.type) {
        case 'client-connect':
          handleClientConnect(ws, message);
          break;
        case 'test-message':
          handleTestMessage(ws, message);
          break;
        case 'figma-to-react':
          handleFigmaToReact(message);
          break;
        case 'react-to-figma':
          handleReactToFigma(message);
          break;
        default:
          log(`Unknown message type: ${message.type}`);
          break;
      }
    } catch (error) {
      log(`Error processing message: ${error.message}`);
    }
  });
  
  ws.on('close', () => {
    if (clients.figma === ws) {
      log('Figma client disconnected');
      clients.figma = null;
    } else if (clients.react === ws) {
      log('React client disconnected');
      clients.react = null;
    }
    
    log(`Client disconnected from ${ip}`);
  });
  
  ws.on('error', (error) => {
    log(`WebSocket error: ${error.message}`);
  });
});

function handleClientConnect(ws, message) {
  const clientType = message.clientType;
  
  if (clientType === 'figma') {
    log('Figma client connected');
    clients.figma = ws;
  } else if (clientType === 'react') {
    log('React client connected');
    clients.react = ws;
  } else {
    log(`Unknown client type: ${clientType}`);
  }
}

function handleTestMessage(ws, message) {
  log(`Test message received: ${message.message}`);
  
  ws.send(JSON.stringify({
    type: 'test-message-response',
    message: `Server received: ${message.message}`,
    timestamp: new Date().toISOString()
  }));
}

function handleFigmaToReact(message) {
  if (!clients.react) {
    log('Cannot forward to React: No React client connected');
    return;
  }
  
  log('Forwarding component data from Figma to React');
  
  saveComponentsToFile(message.components, 'figma-components');
  
  clients.react.send(JSON.stringify({
    type: 'figma-to-react',
    components: message.components,
    timestamp: new Date().toISOString()
  }));
}

function handleReactToFigma(message) {
  if (!clients.figma) {
    log('Cannot forward to Figma: No Figma client connected');
    return;
  }
  
  log('Forwarding component update from React to Figma');
  
  saveComponentsToFile([message.component], 'react-components');
  
  clients.figma.send(JSON.stringify({
    type: 'react-to-figma',
    component: message.component,
    timestamp: new Date().toISOString()
  }));
}

function saveComponentsToFile(components, prefix) {
  if (!components || components.length === 0) return;
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const dir = path.join(__dirname, 'data');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  components.forEach((component, index) => {
    const filename = `${prefix}-${timestamp}-${index}.json`;
    fs.writeFileSync(
      path.join(dir, filename),
      JSON.stringify(component, null, 2)
    );
  });
}

const PORT = process.env.PORT || 3031;
server.listen(PORT, () => {
  log(`Server listening on port ${PORT}`);
}); 