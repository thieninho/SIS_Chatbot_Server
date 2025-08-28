const WebSocket = require('ws');
const discover = require('./functions/discover');
const wink = require('./functions/wink');
const changeIP = require('./functions/changeIP');
const { openHMP, closeHMP, commandHMP } = require('./functions/HMP.js');
const { changeConfig } = require('./functions/changeConfig.js');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

wss.on('error', (err) => {
  console.error('WebSocket server error:', err.message);
});

wss.on('connection', ws => {
  console.log('WebSocket client connected');
  ws.send('Welcome to WebSocket server!');

  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Received:', parsedData);
      const message = parsedData.message;
      ws.send('ACK');

      if (message === 'discover') {
        const discoveredData = await discover();
        ws.send(JSON.stringify({ type: 'success', results: discoveredData, errorCode: 0 }));
        ws.discoveredData = discoveredData;
      } else if (message === 'wink') {
        if (ws.discoveredData) {
          console.log('Winking device with serial:', parsedData);
          const response = await wink(ws.discoveredData, parsedData);
          console.log('Wink response:', response);
          if (response) {
            ws.send(JSON.stringify({ type: 'success', message: 'Wink command sent successfully.', errorCode: 0 }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Device not found for wink command.', errorCode: 1 }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.', errorCode: 1 }));
        }
      } else if (message === 'changeIP') {
        if (ws.discoveredData) {
          await changeIP(ws.discoveredData, parsedData);
          const discoveredData = await discover();
          ws.send(JSON.stringify({ type: 'success', results: discoveredData, errorCode: 0 }));
          ws.discoveredData = discoveredData;
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.', errorCode: 1 }));
        }
      } else if (message === 'changeConfig') {
        await changeConfig(ws, parsedData);
      } else if (message === 'openHMP') {
        try {
          const response = await openHMP(parsedData.IP, ['C', 'B']);
          console.log('HMP open responses:', response.messages);
          const lastMessage = response.messages[response.messages.length - 1];
          if (lastMessage === '\x1BH\r\n\x1BS\r\n' || lastMessage === '\x1BS\r\n') {
            ws.clientHMP = response.client;
            ws.send(JSON.stringify({ type: 'success', message: 'HMP connection opened.', errorCode: 0 }));
          } else {
            response.client.destroy();
            ws.send(JSON.stringify({ type: 'error', message: `Failed to open HMP connection: Invalid response`, errorCode: 1 }));
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: `Failed to open HMP connection: ${err.message}`, errorCode: 1 }));
        }
      } else if (message === 'xpressFunction') {
        console.log('Executing Xpress function:', parsedData.function);
        const response = await commandHMP(ws.clientHMP, parsedData.function);
        if (response.message === 'ACK\n') {
          ws.send(JSON.stringify({ type: 'success', message: 'Xpress function executed.', errorCode: 0 }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to execute Xpress function.', errorCode: 1 }));
        }
      } else if (message === 'changeDefaultConfig') {
        const response = await commandHMP(ws.clientHMP, "CHANGE_CFG Default");
        console.log('Change default config response:', response);
        if (response.message === 'ACK\n') {
          ws.send(JSON.stringify({ type: 'success', message: 'Change default config executed.', errorCode: 0 }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to execute change default config.', errorCode: 1 }));
        }
      } else if (message === 'closeHMP') {
        const response = await closeHMP(ws.clientHMP, parsedData.IP);
        if (response.message == '\x1B[X') {
          ws.send(JSON.stringify({ type: 'success', message: 'HMP connection closed.', errorCode: 0 }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to close HMP connection.', errorCode: 1 }));
        }
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type.', errorCode: 1 }));
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: `Error processing: ${err.message}`, errorCode: 1 }));
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

console.log('WebSocket server is running on ws://10.84.30.91:3000');