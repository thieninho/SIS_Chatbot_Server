const sendUdpBroadcastAndListen = require('../sendUdpBroadcastAndListen.js').sendUdpBroadcastAndListen;
const findDeviceByIP = require('../lib/basic.js').findDeviceByIP;
const findDeviceBySerial = require('../lib/basic.js').findDeviceBySerial;
async function changeIP(ws,foundDevices, dataFromMessage) 
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
    var payload_string = `DLA_DISCOVERY;v1.0;CONFIG_REQ;DeviceSerial=${foundDevice.device.serial};MAC=${foundDevice.device.mac};UseDhcp=False;IP=${dataFromMessage.newIP};SubnetMask=255.255.255.0;AnswerPort=4089;GatewayAddress=0.0.0.0;Dns1Address=0.0.0.0;Dns2Address=0.0.0.0`;
    const responses = await sendUdpBroadcastAndListen(foundDevice.ipAddress, payload_string);
}

module.exports = changeIP;