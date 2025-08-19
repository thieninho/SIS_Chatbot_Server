const getIPv4Addresses = require('./network.js').getIPv4Addresses;
const getAllDevices = require('./network.js').getAllDevices;
function discover(ws) 
{
  const allIPAddresses = getIPv4Addresses();
  if (allIPAddresses.length > 0) 
  {
    const devicePromises = allIPAddresses.map(ipAddress =>
      getAllDevices(ipAddress)
        .then(devices => ({ ipAddress, devices }))
        .catch(err => ({ ipAddress, error: err.message }))
    );

    Promise.all(devicePromises)
      .then(results => {
        ws.send(JSON.stringify({ results }));
      })
      .catch(err => {
        ws.send(JSON.stringify({ type: 'error', message: 'Error processing devices', error: err.message }));
      });
  }
  else 
  {
    ws.send(JSON.stringify({ type: 'error', message: 'No IPv4 addresses found' }));
  }
}

module.exports = discover;