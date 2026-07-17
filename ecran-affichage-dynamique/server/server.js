import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import opportunitiesRoutes from './routes/opportunities.js'
import moderationRoutes from './routes/moderation.js'

// Charger les variables d'environnement
dotenv.config()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Middleware CORS manuel - autoriser toutes les origines (affichage public)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

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
app.use('/api/opportunities', opportunitiesRoutes)
// Alias legacy : évite que la TV affiche les données de secours pendant que
// Vercel et Railway se redéploient. Supprimable une fois le front à jour.
app.use('/api/notion/opportunities', opportunitiesRoutes)
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
