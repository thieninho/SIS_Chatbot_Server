const { get } = require('http');
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
  const payload_string = 'DLA_DISCOVERY;v1.0;FIND_REQ;AnswerPort=4089;Version=2.0';
  let responses = [];
  
  // Validate IP address
  const validIPs = getIPv4Addresses();
  if (!validIPs.includes(ipAddress)) {
    console.error(`Invalid IP address: ${ipAddress}. Valid IPs: ${validIPs.join(', ')}`);
    return [];
  }

  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      responses = await sendUdpBroadcastAndListen(ipAddress, payload_string);
      break; // Success, exit retry loop
    } catch (error) {
      if (error.code === 'EADDRINUSE' && attempt < maxRetries) {
        console.warn(`Port 4089 in use on ${ipAddress}, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempt++;
      } else {
        console.error(`Error during UDP broadcast on ${ipAddress}: ${error.message}`);
        return [];
      }
    }
  }

  if (responses.length === 0) 
  {
    console.warn(`No devices found on ${ipAddress}`);
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
    device.netAddress = getDeviceNetAddress(response.response);
    device.isSimulator = getDeviceSimulator(response.response);
    device.modelName = getDeviceModelName(response.response);
    // Check if a device with identical properties already exists
    const isDuplicate = allFoundDevices.some(existingDevice => 
      existingDevice.address === device.address &&
      existingDevice.family === device.family &&
      existingDevice.mac === device.mac &&
      existingDevice.serial === device.serial &&
      existingDevice.netAddress === device.netAddress &&
      existingDevice.isSimulator === device.isSimulator &&
      existingDevice.modelName === device.modelName
    );
    if (!isDuplicate) {
      allFoundDevices.push(device);
    }
  }
  return allFoundDevices;
}

function getDeviceModelName(response)
{
    const match = response.match(/DeviceModelName=([^;]*)/);
    return match ? match[1] : null;
}

function getDeviceSimulator(response)
{
    const match = response.match(/IsSimulator=([^;]*)/);
    return match ? match[1] : null;
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

function getDeviceNetAddress(response) 
{
    const match = response.match(/NetAddress=([^;]*)/);
    return match ? match[1] : null;
}

module.exports.getIPv4Addresses = getIPv4Addresses;
module.exports.getAllDevices = getAllDevices;