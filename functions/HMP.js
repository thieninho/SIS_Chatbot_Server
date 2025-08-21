const net = require('net');

function openHMP(data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.connect(1023, data.IP, () => {
      console.log(`Connected to ${data.IP}:1023`);
      client.write('\x1B[C\x1B[B\r\n');
    });

    const onData = (data) => {
      client.removeListener('error', onError);
      resolve({ client, message: data.toString() }); // Return the connected client after first response
    };
    const onError = (err) => {
      client.removeListener('data', onData);
      reject(err);
    };
    client.once('data', onData);
    client.once('error', onError);
  });
}

function closeHMP(client) 
{  
    return new Promise((resolve, reject) => {
        // const client = new net.Socket();
        // client.connect(1023, '192.168.3.120', () => {
        //     console.log('Connected to 192.168.3.120:1023');
        //     client.write('\x1B[A\r\n');
        // });
        client.write('\x1B[A\r\n');
          
        const onData = (data) => {
            client.removeListener('error', onError);
            resolve({ client, message: data.toString() }); // Return the connected client after first response
        };
        const onError = (err) => {
            client.removeListener('data', onData);
            reject(err);
        };
        client.once('data', onData);
        client.once('error', onError);
    });
}

function xpressFunction(client, command) {
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

function changeConfigHMP(client, configName) {
  return new Promise((resolve, reject) => {
    client.write(`CHANGE_CFG ${configName}\r\n`);
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
  xpressFunction,
  changeConfigHMP
}
