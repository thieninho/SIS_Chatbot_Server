const sendUdpBroadcastAndListen = require('../sendUdpBroadcastAndListen.js').sendUdpBroadcastAndListen;
const findDeviceByIP = require('../lib/basic.js').findDeviceByIP;
const findDeviceBySerial = require('../lib/basic.js').findDeviceBySerial;
async function wink(ws,foundDevices, dataFromMessage) 
{
    var foundDevice = "";
    if(dataFromMessage.serial != undefined)
    {
        foundDevice = findDeviceBySerial(foundDevices, dataFromMessage.serial);
    }
    else
    {
        foundDevice = findDeviceByIP(foundDevices, dataFromMessage.IP);
    }
    var payload_string = `DLA_DISCOVERY;v1.0;WINK_REQ;DeviceSerial=${foundDevice.device.serial};MAC=${foundDevice.device.mac};Node=0`;
    const responses = await sendUdpBroadcastAndListen(foundDevice.ipAddress, payload_string);
}

module.exports = wink;