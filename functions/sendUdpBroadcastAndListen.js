const dgram = require('dgram');

function sendUdpBroadcastAndListen(sourceIp, payload_string, options = {}) 
{
  const DEST_IP = options.destIp || '255.255.255.255';
  const SOURCE_PORT = options.sourcePort || 4089;
  const DEST_PORT = options.destPort || 4088;
  const PAYLOAD = options.payload || payload_string;
  const LISTEN_TIMEOUT = options.listenTimeout || 5000; // ms
  const MAX_RESPONSES = options.maxResponses || 1000;

  return new Promise((resolve, reject) => 
  {
    const responses = [];
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true });

    socket.on('error', (err) => 
    {
      console.error(`Socket error for ${sourceIp}:`, err);
      socket.close();
      reject(err);
    });

    socket.on('message', (msg, rinfo) => 
    {
      responses.push({ addr: rinfo, response: msg.toString(), length: msg.length });
      console.log(`Received response #${responses.length} from ${rinfo.address}:${rinfo.port}`);
      if (responses.length >= MAX_RESPONSES) 
      {
        socket.close();
        resolve(responses);
      }
    });

    socket.bind(SOURCE_PORT, sourceIp, () => 
    {
      socket.setBroadcast(true);

      const payloadBuffer = Buffer.from(PAYLOAD, 'utf8');
      if (payloadBuffer.length !== 55) 
      {
        console.warn(`Warning: Payload length is ${payloadBuffer.length} bytes, expected 55 bytes`);
      }

      socket.send(payloadBuffer, 0, payloadBuffer.length, DEST_PORT, DEST_IP, (err) => 
      {
        if (err) 
        {
          console.error('Send error:', err);
          socket.close();
          reject(err);
        } 
        else 
        {
          console.log(`Sent UDP broadcast from ${sourceIp}:${SOURCE_PORT} to ${DEST_IP}:${DEST_PORT}`);
          console.log(`Payload: ${PAYLOAD}`);
        }
      });
    });

    // Timeout for listening
    setTimeout(() => 
    {
      socket.close();
      resolve(responses);
    }, LISTEN_TIMEOUT);
  });
}

module.exports.sendUdpBroadcastAndListen = sendUdpBroadcastAndListen;