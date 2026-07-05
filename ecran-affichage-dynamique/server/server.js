import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import notionRoutes from './routes/notion.js'
import moderationRoutes from './routes/moderation.js'

// Charger les variables d'environnement
dotenv.config()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Middleware CORS
const allowedOrigins = [
  'https://club-com-le10-notion.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false,
  optionsSuccessStatus: 200
}))
app.use(express.json())

// Store de modération (en mémoire pour commencer)
let moderationState = {
  opportunities: {},
  displayOrder: [1, 2, 3],
  durations: { 1: 20, 2: 15, 3: 20 },
  paused: false,
  lastUpdate: new Date()
}

// WebSocket - Gérer les clients connectés
const clients = new Set()

wss.on('connection', (ws) => {
  console.log('🔗 Client WebSocket connecté')
  clients.add(ws)

  // Envoyer l'état initial
  ws.send(JSON.stringify({
    type: 'state',
    data: moderationState
  }))

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      console.log('📨 Message WebSocket reçu:', data.type)

      // Traiter le message et mettre à jour l'état
      if (data.type === 'updateModeration') {
        moderationState = { ...moderationState, ...data.payload }
        moderationState.lastUpdate = new Date()

        // Broadcast à tous les clients
        broadcastUpdate({
          type: 'state',
          data: moderationState
        })
      }
    } catch (err) {
      console.error('❌ Erreur WebSocket:', err)
    }
  })

  ws.on('close', () => {
    console.log('❌ Client WebSocket déconnecté')
    clients.delete(ws)
  })
})

// Helper pour broadcaster les mises à jour
function broadcastUpdate(message) {
  const jsonMessage = JSON.stringify(message)
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(jsonMessage)
    }
  })
}

// Routes
app.use('/api/notion', notionRoutes)
app.use('/api/moderation', moderationRoutes(moderationState, broadcastUpdate))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// Gestion globale de la modération
app.get('/api/state', (req, res) => {
  res.json(moderationState)
})

// Démarrer le serveur
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  🚀 Backend Club Com' Le 10 lancé !                   ║
║                                                        ║
║  ✅ API Express     http://localhost:${PORT}          ║
║  ✅ WebSocket       ws://localhost:${PORT}            ║
║  ✅ Dashboard       http://localhost:3000/dashboard   ║
║  ✅ Écran TV        http://localhost:3000             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `)
})
