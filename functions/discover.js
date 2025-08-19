const getIPv4Addresses = require('../network.js').getIPv4Addresses;
const getAllDevices = require('../network.js').getAllDevices;

function discover() {
  return new Promise((resolve, reject) => {
    const allIPAddresses = getIPv4Addresses();
    if (allIPAddresses.length > 0) {
      const devicePromises = allIPAddresses.map(ipAddress =>
        getAllDevices(ipAddress)
          .then(devices => ({ ipAddress, devices }))
          .catch(err => ({ ipAddress, error: err.message }))
      );

      Promise.all(devicePromises)
        .then(results => {
          resolve(results);
        })
        .catch(err => {
          reject(new Error('No devices found'));
        });
    } else {
      reject(new Error('No IPv4 addresses found'));
    }
  });
}

module.exports = discover;