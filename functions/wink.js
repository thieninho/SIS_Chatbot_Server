const sendUdpBroadcastAndListen = require('./sendUdpBroadcastAndListen.js').sendUdpBroadcastAndListen;
const findDeviceByIP = require('../lib/basic.js').findDeviceByIP;
const findDeviceBySerial = require('../lib/basic.js').findDeviceBySerial;

function wink(foundDevices, dataFromMessage) {
    return new Promise((resolve, reject) => {
        let foundDevice = "";
        if (dataFromMessage.IP !== undefined) 
        {
            foundDevice = findDeviceByIP(foundDevices, dataFromMessage.IP);
        } 
        else 
        {
            foundDevice = findDeviceBySerial(foundDevices, dataFromMessage.serial);
        }
        if (foundDevice != undefined) 
        {
            const payload_string = `DLA_DISCOVERY;v1.0;WINK_REQ;DeviceSerial=${foundDevice.device.serial};MAC=${foundDevice.device.mac};Node=${foundDevice.device.netAddress};AnswerPort=4089;Version=2.0`;
            sendUdpBroadcastAndListen(foundDevice.ipAddress, payload_string)
                .then(responses => {
                    console.log(`Wink response from ${foundDevice.ipAddress}:`, responses);
                    resolve(responses);
                })
                .catch(err => {
                    reject(err);
                });
        } 
        else 
        {
            // No device found, resolve with null or reject
            resolve(null);
        }
    });
}

module.exports = wink;