# GUIDE.md

## WebSocket Protocol Guide

This document describes how to communicate with the server using WebSocket messages.  
Each message should be sent as a JSON object.

---

### 1. Discover Devices

**Request:**
```json
{
  "message": "discover"
}
```

**Response:**
```json
{
  "type": "success",
  "results": [
    { "ipAddress": "10.84.30.91", "devices": [] },
    { "ipAddress": "192.168.3.99", "devices": [ /* device objects */ ] }
  ],
  "errorCode": 0
}
```
If an error occurs:
```json
{
  "type": "error",
  "message": "Error processing: Error description",
  "errorCode": 1
}
```

---

### 2. Wink Device

> **Note:** You must run `"discover"` first before using `"wink"`.  
> For actions requiring device identification, you may provide either `serial`, `IP`, or both.

**Request:**
```json
{
  "message": "wink",
  "serial": "C18P00945",
  "IP": "192.168.3.100"
}
```

**Response:**
```json
{
  "type": "success",
  "message": "Wink command sent successfully.",
  "errorCode": 0
}
```
If the device is not found or discover was not run:
```json
{
  "type": "error",
  "message": "Device not found for wink command.",
  "errorCode": 1
}
```
or
```json
{
  "type": "error",
  "message": "No discovered data available. Run discover first.",
  "errorCode": 1
}
```

---

### 3. Change Device IP

> **Note:** You must run `"discover"` first before using `"changeIP"`.  
> For actions requiring device identification, you may provide either `serial`, `IP`, or both.

**Request:**
```json
{
  "message": "changeIP",
  "serial": "C18P00945",
  "IP": "192.168.3.100",
  "newIP": "192.168.3.120"
}
```

**Response:**
- After successful IP change, the server automatically performs device discovery and responds with the updated device list.
```json
{
  "type": "success",
  "results": [
    { "ipAddress": "10.84.30.91", "devices": [] },
    { "ipAddress": "192.168.3.99", "devices": [ /* device objects */ ] }
  ],
  "errorCode": 0
}
```
If an error occurs or discover was not run:
```json
{
  "type": "error",
  "message": "No discovered data available. Run discover first.",
  "errorCode": 1
}
```

---

### 4. Change Device Configuration

> **Note:** The server will attempt to open an HMP connection if not already open.

**Request:**
```json
{
  "message": "changeConfig",
  "serial": "C18P00945",
  "IP": "192.168.3.100",
  "configName": "myConfigName",
  "config": {
    "symbology": "QR"
  }
}
```

**Response:**
```json
{
  "type": "success",
  "message": "Configuration updated and reboot command sent successfully. Please wait for device to be ready.",
  "errorCode": 0
}
```
If an error occurs:
```json
{
  "type": "error",
  "message": "Failed to execute change config.",
  "errorCode": 1
}
```
If HMP connection is not ready:
```json
{
  "type": "warning",
  "message": "No HMP client available. Please wait until the connection is established.",
  "errorCode": 0
}
```

---

### 5. Error Handling

If an error occurs, the server responds with:
```json
{
  "type": "error",
  "message": "Error processing: Error description",
  "errorCode": 1
}
```

---

### 6. HMP Connection

**Request:**
```json
{
  "message": "openHMP",
  "IP": "192.168.3.100",
  "port": 1023
}
```

**Response:**
```json
{
  "type": "success",
  "message": "HMP connection opened.",
  "errorCode": 0
}
```
If failed:
```json
{
  "type": "error",
  "message": "Failed to open HMP connection: Invalid response",
  "errorCode": 1
}
```

**To close HMP connection:**

**Request:**
```json
{
  "message": "closeHMP",
  "IP": "192.168.3.100",
  "port": 1023
}
```

**Response:**
```json
{
  "type": "success",
  "message": "HMP connection closed.",
  "errorCode": 0
}
```
If failed:
```json
{
  "type": "error",
  "message": "Failed to close HMP connection.",
  "errorCode": 1
}
```

---

### 7. XPRESS Function

> **Note:** The server always sends `"XPRESS 1"` regardless of the `"function"` field.

**Request:**
```json
{
  "message": "xpressFunction"
}
```

**Response:**
```json
{
  "type": "success",
  "message": "Xpress function executed.",
  "errorCode": 0
}
```
If failed:
```json
{
  "type": "error",
  "message": "Failed to execute Xpress function.",
  "errorCode": 1
}
```

---

### 8. Change Default Config

**Request:**
```json
{
  "message": "changeDefaultConfig"
}
```

**Response:**
```json
{
  "type": "success",
  "message": "Change default config executed.",
  "errorCode": 0
}
```
If failed:
```json
{
  "type": "error",
  "message": "Failed to execute change default config.",
  "errorCode": 1
}
```

---

## Notes

- Always send messages as JSON objects.
- The server responds with JSON objects.
- For actions requiring device identification, you may provide either `serial`, `IP` or both.
- You must run `"discover"` before `"wink"` or `"changeIP"`.
- After changing a device's IP, the server will automatically rediscover devices and send an updated list.
- For `"changeConfig"`, the server will open HMP if needed and may send a warning if not ready.