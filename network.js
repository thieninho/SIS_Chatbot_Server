const os = require('os');
const sendUdpBroadcastAndListen = require('./sendUdpBroadcastAndListen.js').sendUdpBroadcastAndListen;
function getIPv4Addresses() 
{
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name in interfaces) 
  {
    for (const iface of interfaces[name]) 
    {
      if (iface.family === 'IPv4' && !iface.internal) 
      {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

async function getAllDevices(ipAddress)
{
  var allFoundDevices = [];
  const responses = await sendUdpBroadcastAndListen(ipAddress);
  if (responses.length === 0) 
  {
    console.warn('No devices found');
    return [];
  }
  for (const response of responses)
  {
    console.log(`Device found at ${response.addr.address}:${response.addr.port} with response: ${response.response}`);
    var device = {};
    device.address = response.addr.address;
    device.family = getDeviceFamily(response.response);
    device.mac = getMAC(response.response);
    device.serial = getDeviceSerial(response.response);
    allFoundDevices.push(device);
  }
  return allFoundDevices;
}

function getDeviceFamily(response) 
{
  const match = response.match(/DeviceFamily=([^;]*)/);
  return match ? match[1] : null;
}

function getMAC(response) 
{
    const match = response.match(/MAC=([^;]*)/);
    return match ? match[1] : null;
}

function getDeviceSerial(response) 
{
    const match = response.match(/DeviceSerial=([^;]*)/);
    return match ? match[1] : null;
}


module.exports.getIPv4Addresses = getIPv4Addresses;
module.exports.getAllDevices = getAllDevices;