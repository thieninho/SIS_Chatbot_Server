const WebSocket = require('ws');
const discover = require('./functions/discover');
const wink = require('./functions/wink');
const changeIP = require('./functions/changeIP');
const { openHMP, closeHMP, commandHMP } = require('./functions/HMP.js');
const { changeConfig } = require('./functions/changeConfig.js');
const wss = new WebSocket.Server({ port: 3000 });
wss.on('connection', ws => 
{
  console.log('WebSocket client connected');
  ws.send('Welcome to WebSocket server!');

  ws.on('message', async data => 
  {
    var data = JSON.parse(data);
    console.log('Received:', data);
    var message = data.message;
    ws.send('ACK');
    if (message == 'discover') 
    {
      try 
      {
        const discoveredData = await discover();
        ws.send(JSON.stringify({ type: 'success', results: discoveredData, errorCode: 0 }));
        ws.discoveredData = discoveredData;
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message, errorCode: 1 }));
      }
    }
    else if (message == 'wink') 
    {
      if (ws.discoveredData) 
      {
        console.log('Winking device with serial:', data);
        const response = await wink(ws.discoveredData, data);
        console.log('Wink response:', response);
        if (response) 
        {
          ws.send(JSON.stringify({ type: 'success', message: 'Wink command sent successfully.', errorCode: 0 }));
        } 
        else 
        {
          ws.send(JSON.stringify({ type: 'error', message: 'Device not found for wink command.', errorCode: 1 }));
        }
      } 
      else 
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.', errorCode: 1 }));
      }
    }
    else if(message == 'changeIP')
    {
      if(ws.discoveredData)
      {
        await changeIP(ws.discoveredData, data);
        try 
        {
          const discoveredData = await discover();
          ws.send(JSON.stringify({ type: 'success', results: discoveredData, errorCode: 0 }));
          ws.discoveredData = discovseredData;
        } 
        catch (err) 
        {
          ws.send(JSON.stringify({ type: 'error', message: err.message, errorCode: 1 }));
        }
      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.', errorCode: 1 }));
      }
    }
    else if(message == 'changeConfig')
    {
      const response = await changeConfig(ws, data);
    }
    else if(message == 'openHMP')
    {
      const response = await openHMP(data.IP);
      console.log('HMP open response:', response);
      if(response.message == '\x1BH\r\n\x1BS\r\n' || response.message == '\x1BH\r\n')
      {
        ws.clientHMP = response.client;
        ws.send(JSON.stringify({ type: 'success', message: 'HMP connection opened.', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to open HMP connection.', errorCode: 1 }));
      }
    }
    else if(message == 'xpressFunction')
    {
      const response = await commandHMP(ws.clientHMP, data.function);
      if(response.message == 'ACK\n')
      {
        ws.send(JSON.stringify({ type: 'success', message: 'Xpress function executed.', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to execute Xpress function.', errorCode: 1 }));
      }
    }
    else if(message == 'changeDefaultConfig')
    {
      const response = await commandHMP(ws.clientHMP, "CHANGE_CFG Default");
      console.log('Change default config response:', response);
      if(response.message == 'ACK\n')
      {
        ws.send(JSON.stringify({ type: 'success', message: 'Change default config executed.', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to execute change default config.', errorCode: 1 }));
      }
    }
    else if(message == 'closeHMP')
    {
      const response = await closeHMP(ws.clientHMP);
      if(response.message == 'ACK\n')
      {
        ws.send(JSON.stringify({ type: 'success', message: 'HMP connection closed. ', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to close HMP connection.', errorCode: 1 }));
      }
    }
  });
});

console.log('WebSocket server is running on ws://localhost:3000');