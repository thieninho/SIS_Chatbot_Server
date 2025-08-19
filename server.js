const WebSocket = require('ws');
const discover = require('./functions/discover');
const wink = require('./functions/wink');
const changeIP = require('./functions/changeIP');
const { connectXpress, disconnectXpress, xpressFunction } = require('./functions/xpress');
const wss = new WebSocket.Server({ port: 3000 });
wss.on('connection', ws => 
{
  console.log('WebSocket client connected');
  ws.send('Welcome to WebSocket server!');

  ws.on('message', async data => 
  {
    var data = JSON.parse(data);
    var message = data.message;
    ws.send('ACK');
    if (message == 'discover') 
    {
      try 
      {
        const discoveredData = await discover();
        ws.send(JSON.stringify({ type: 'discover', results: discoveredData, errorCode: 0 }));
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
        const response = await wink(ws, ws.discoveredData, data);
        console.log('Wink response:', response);
        if (response) 
        {
          ws.send(JSON.stringify({ type: 'wink', message: 'Wink command sent successfully.', errorCode: 0 }));
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
        await changeIP(ws, ws.discoveredData, data);
        try 
        {
          const discoveredData = await discover();
          ws.send(JSON.stringify({ type: 'discover', results: discoveredData, errorCode: 0 }));
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
      if(ws.discoveredData)
      {

      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.', errorCode: 1 }));
      }
    }
    else if(message == 'xpressOpen')
    {
      const response = await connectXpress();
      if(response.message == '\x1BH\r\n\x1BS\r\n')
      {
        ws.client = response.client;
        ws.send(JSON.stringify({ type: 'xpressOpen', message: 'Xpress connection opened.', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'xpressOpen', message: 'Failed to open Xpress connection.', errorCode: 1 }));
      }
    }
    else if(message == 'xpressFunction')
    {
      const response = await xpressFunction(ws.client, data.function);
      console.log('Xpress function response:', response);
      if(response.message == 'ACK\n')
      {
        ws.send(JSON.stringify({ type: 'xpressFunction', message: 'Xpress function executed.', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'xpressFunction', message: 'Failed to execute Xpress function.', errorCode: 1 }));
      }
    }
    else if(message == 'xpressClose')
    {
      const response = await disconnectXpress(ws.client);
      if(response.message == 'ACK\n')
      {
        ws.send(JSON.stringify({ type: 'xpressClose', message: 'Xpress connection closed. ', errorCode: 0 }));
      }
      else
      {
        ws.send(JSON.stringify({ type: 'xpressClose', message: 'Failed to close Xpress connection.', errorCode: 1 }));
      }
    }
  });
});

console.log('WebSocket server is running on ws://localhost:3000');