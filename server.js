const WebSocket = require('ws');
const discover = require('./discover');
// Create WebSocket server on port 3000
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', ws => 
{
  console.log('WebSocket client connected');
  ws.send('Welcome to WebSocket server!');

  ws.on('message', data => 
  {
    var data = JSON.parse(data);
    var message = data.message;
    ws.send('ACK');
    if (message == 'discover') 
    {
      discover(ws);
    }
    else if (message == 'wink') 
    {
      wink(ws);
    }
  });
});

console.log('WebSocket server is running on ws://10.84.30.91:3000');