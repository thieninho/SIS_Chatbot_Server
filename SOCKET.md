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
  ]
}
```

---

### 2. Wink Device

> **Note:** For actions requiring device identification, you may provide either `serial`, `IP`, or both.

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
If the device is not found:
```json
{
  "type": "error",
  "message": "Device not found for wink command.",
  "errorCode": 1
}
```

---

### 3. Change Device IP

> **Note:** For actions requiring device identification, you may provide either `serial`, `IP`, or both.

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
If an error occurs:
```json
{
  "type": "error",
  "message": "Failed to change device IP",
  "errorCode": 1
}
```

---

### 4. Change Device Configuration

> **Note:** For actions requiring device identification, you may provide either `serial`, `IP`, or both.

**Request:**
```json
{
  "message": "changeConfig",
  "serial": "C18P00945",
  "IP": "192.168.3.100",
  "config": {
    "symbology": "QR"
  }
}
```

**Response:**
```json
{
  "type": "success",
  "message": "Function still not implemented, assume that device configuration was changed successfully",
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

---

### 5. Error Handling

If an error occurs, the server responds with:
```json
{
  "type": "error",
  "message": "Error description",
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
  "message": "Failed to open HMP connection.",
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

**Request:**
```json
{
  "message": "xpressFunction",
  "function": "XPRESS 1"
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
- After changing a device's IP, the server will automatically rediscover devices and send an updated list.

---