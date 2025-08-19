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
        ws.send(JSON.stringify({ type: 'discover', results: discoveredData }));
        ws.discoveredData = discoveredData;
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    }
    else if (message == 'wink') 
    {
      if (ws.discoveredData) 
      {
        console.log('Winking device with serial:', data);
        wink(ws, ws.discoveredData, data);
      } 
      else 
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.' }));
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
          ws.send(JSON.stringify({ type: 'discover', results: discoveredData }));
          ws.discoveredData = discovseredData;
        } 
        catch (err) 
        {
          ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.' }));
      }
    }
    else if(message == 'changeConfig')
    {
      if(ws.discoveredData)
      {

      }
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.' }));
      }
    }
    else if(message == 'xpressOpen')
    {
      if(ws.discoveredData)
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
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.' }));
      }
    }
    else if(message == 'xpressFunction')
    {
      if(ws.discoveredData)
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
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.' }));
      }
    }
    else if(message == 'xpressClose')
    {
      if(ws.discoveredData)
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
      else
      {
        ws.send(JSON.stringify({ type: 'error', message: 'No discovered data available. Run discover first.' }));
      }
    }
  });
});

// console.log('WebSocket server is running on ws://localhost:4000');
console.log('WebSocket server is running on ws://10.84.30.91:3000');