// Install dependencies:
// npm install socket.io-client

import { io } from "socket.io-client"

// Create a WebSocket connection
export const socket = io(process.env.WEBSOCKET_URL || "ws://localhost:3001", {
  autoConnect: false,
})

// Connect to the WebSocket server
export function connectToWebSocket(deviceId: string) {
  if (!socket.connected) {
    socket.connect()

    // Subscribe to device updates
    socket.emit("subscribe", { deviceId })

    // Handle reconnection
    socket.on("reconnect", () => {
      socket.emit("subscribe", { deviceId })
    })
  }
}

// Disconnect from the WebSocket server
export function disconnectFromWebSocket() {
  if (socket.connected) {
    socket.disconnect()
  }
}

