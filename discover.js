const getIPv4Addresses = require('./network.js').getIPv4Addresses;
const getAllDevices = require('./network.js').getAllDevices;
function processData(ws) 
{
  var allIPAddresses = getIPv4Addresses();
  if(allIPAddresses.length > 0) 
  {
    for (const ipAddress of allIPAddresses)
    {
      getAllDevices(ipAddress)
        .then(devices => 
        {
          if (devices.length > 0) 
          {
            ws.send(JSON.stringify({devices: devices }));
          } 
          else 
          {
            // ws.send(JSON.stringify({ type: 'noDevices', ipAddress: ipAddress }));
          }
        })
        .catch(err => 
        {
          console.error(`Error getting devices for ${ipAddress}:`, err);
          ws.send(JSON.stringify({ type: 'error', message: `Error getting devices for ${ipAddress}` }));
        });
    }
  }
  else 
  {
    ws.send(JSON.stringify({ type: 'error', message: 'No IPv4 addresses found' }));
  }
}

module.exports = processData;