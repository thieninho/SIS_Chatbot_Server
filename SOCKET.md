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
  "type": "discover",
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
- No response from server. Device will wink.

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
```json
{
  "type": "discover",
  "results": [
    { "ipAddress": "10.84.30.91", "devices": [] },
    { "ipAddress": "192.168.3.99", "devices": [ /* device objects */ ] }
  ]
}
```
- After successful IP change, the server automatically performs device discovery and responds with the updated device list.

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
- 

---

### 5. Error Handling

If an error occurs, the server responds with:
```json
{
  "type": "error",
  "message": "Error description"
}
```

---

## Notes

- Always send messages as JSON objects.
- The server responds with JSON objects.
- For actions requiring device identification, you may provide either `serial`, `IP` or both.
- After changing a device's IP, the server will automatically rediscover devices and send an updated list.

---