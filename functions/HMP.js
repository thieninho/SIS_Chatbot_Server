const net = require('net');

function openHMP(IP, commands) {
  if (!Array.isArray(commands) || !commands.every(cmd => ['C', 'B'].includes(cmd))) {
    return Promise.reject(new Error(`Invalid commands: ${commands}`));
  }

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeoutMs = 5000; // 5-second timeout per command
    const responses = [];
    let currentCommandIndex = 0;

    const sendNextCommand = () => {
      if (currentCommandIndex >= commands.length) {
        clearTimeout(timeout);
        client.removeListener('data', onData);
        client.removeListener('error', onError);
        resolve({ client, messages: responses });
        return;
      }

      const command = commands[currentCommandIndex];
      const sequence = command === 'C' ? `\x1B[C\r\n` : `\x1B[B\r\n`;
      client.write(sequence);
      console.log(`Sent command ${command} to ${IP}:1023`);
      timeout = setTimeout(onTimeout, timeoutMs);
    };

    const onData = (data) => {
      clearTimeout(timeout); // Clear timeout for current command
      responses.push(data.toString());
      currentCommandIndex++;
      sendNextCommand();
    };

    const onError = (err) => {
      clearTimeout(timeout);
      client.removeListener('data', onData);
      client.destroy();
      reject(err);
    };

    const onTimeout = () => {
      client.removeListener('data', onData);
      client.removeListener('error', onError);
      reject(new Error(`No response from ${IP}:1023 for command ${commands[currentCommandIndex]} after ${timeoutMs / 1000}s`));
    };

    let timeout = setTimeout(onTimeout, timeoutMs);

    client.connect(1023, IP, () => {
      console.log(`Connected to ${IP}:1023`);
      sendNextCommand();
    });

    client.once('error', onError);
    client.on('data', onData);
  });
}

function closeHMP(client, IP) 
{  
  return new Promise((resolve, reject) => {
    let targetClient = client;

    // Check if client is valid and not destroyed
    if (!targetClient || !(targetClient instanceof net.Socket) || targetClient.destroyed) {
      if (!IP) {
        reject(new Error('No valid client provided and no IP address specified for new connection'));
        return;
      }
      console.log(`No valid client provided, creating new connection to ${IP}:1023`);
      targetClient = new net.Socket();

      // Connect to the specified IP and port
      targetClient.connect(1023, IP, () => {
        console.log(`Connected to ${IP}:1023 for closeHMP`);
      });

      // Handle connection errors
      targetClient.once('error', (err) => {
        targetClient.removeListener('data', onData);
        targetClient.destroy();
        reject(new Error(`Failed to connect to ${IP}:1023: ${err.message}`));
      });
    }

    // Proceed with sending the close command
    targetClient.write('\x1B[A\r\n');

    const onData = (data) => {
      targetClient.removeListener('error', onError);
      resolve({ client: targetClient, message: data.toString() });
    };

    const onError = (err) => {
      targetClient.removeListener('data', onData);
      targetClient.destroy();
      reject(err);
    };

    targetClient.once('data', onData);
    targetClient.once('error', onError);
  });
}

function commandHMP(client, command) {
  return new Promise((resolve, reject) => {
    client.write(`${command}\r\n`);
    const onData = (data) => {
      client.removeListener('error', onError);
      resolve({message: data.toString()});
    };
    const onError = (err) => {
      client.removeListener('data', onData);
      reject(err);
    };
    client.once('data', onData);
    client.once('error', onError);
  });
}

module.exports = 
{
  openHMP,
  closeHMP,
  commandHMP
}
