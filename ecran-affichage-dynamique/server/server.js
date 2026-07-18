import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import opportunitiesRoutes from './routes/opportunities.js'
import moderationRoutes from './routes/moderation.js'
import cookieParser from 'cookie-parser'
import intranetAuthRoutes from './routes/intranet/auth.js'
import intranetDataRoutes from './routes/intranet/data.js'
import { requireAuth } from './middleware/requireAuth.js'

// Charger les variables d'environnement
dotenv.config()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// L'Écran TV est public ; l'intranet a besoin de cookies, donc d'une
// origine explicite : le joker "*" est interdit avec credentials.
const ORIGINES_INTRANET = [
  process.env.INTRANET_URL || 'http://localhost:3001',
  'http://localhost:3001'
]

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (req.path.startsWith('/api/intranet')) {
    if (origin && ORIGINES_INTRANET.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Credentials', 'true')
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(cookieParser())

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

// Routes intranet : l'auth est publique (demande de lien, vérification),
// le reste passe obligatoirement par une session.
// Sans JWT_SECRET, aucun jeton ne peut être signé : on refuse explicitement
// plutôt que d'échouer en silence (l'utilisateur croirait avoir reçu un mail).
// On ne fait surtout pas planter le process : ce serveur héberge aussi l'Écran TV.
if (process.env.JWT_SECRET) {
  app.use('/api/intranet/auth', intranetAuthRoutes)
  app.use('/api/intranet', requireAuth, intranetDataRoutes)
} else {
  console.error('❌ JWT_SECRET manquant : les routes /api/intranet sont désactivées.')
  app.use('/api/intranet', (req, res) => {
    res.status(503).json({ error: 'Intranet non configuré' })
  })
}

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
