function findDeviceBySerial(devicesByIpArray, serial) 
{
  for (const entry of devicesByIpArray) {
    if (Array.isArray(entry.devices)) {
      const found = entry.devices.find(device => device.serial === serial);
      if (found) { return { device: found, ipAddress: entry.ipAddress }; }
    }
  }
  return null;
}

function findDeviceByIP(devicesByIpArray, IP) 
{
  for (const entry of devicesByIpArray) {
    if (Array.isArray(entry.devices)) {
      const found = entry.devices.find(device => device.address === IP);
      if (found) { return { device: found, ipAddress: entry.ipAddress }; }
    }
  }
  return null;
}

module.exports = {
  findDeviceBySerial,
  findDeviceByIP
};