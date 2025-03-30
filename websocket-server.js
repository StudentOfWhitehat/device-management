// Install dependencies:
// npm install socket.io express

const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Track connected clients
const connectedClients = new Map()

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("subscribe", async ({ deviceId }) => {
    // Store which device this client is monitoring
    connectedClients.set(socket.id, deviceId)

    // Join a room specific to this device
    socket.join(`device:${deviceId}`)

    console.log(`Client ${socket.id} subscribed to device ${deviceId}`)

    // Send initial data
    const metrics = await prisma.performanceMetric.findMany({
      where: { deviceId },
      orderBy: { timestamp: "desc" },
      take: 60,
    })

    socket.emit("initial-data", metrics.reverse())
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
    connectedClients.delete(socket.id)
  })
})

// Simulate device metrics updates
// In a real system, this would come from actual device monitoring agents
function simulateDeviceMetrics() {
  // Get all devices that have clients monitoring them
  const monitoredDevices = new Set([...connectedClients.values()])

  monitoredDevices.forEach(async (deviceId) => {
    try {
      // Generate random metrics
      const metrics = {
        deviceId,
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        timestamp: new Date(),
      }

      // Save to database
      await prisma.performanceMetric.create({
        data: metrics,
      })

      // Broadcast to all clients monitoring this device
      io.to(`device:${deviceId}`).emit("performance-update", metrics)
    } catch (error) {
      console.error(`Error updating metrics for device ${deviceId}:`, error)
    }
  })
}

// Update metrics every 5 seconds
setInterval(simulateDeviceMetrics, 5000)

// Start the server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

