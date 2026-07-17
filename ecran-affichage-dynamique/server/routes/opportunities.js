import express from 'express'
import { getOpportunities, getStats } from '../services/airtableClient.js'

const router = express.Router()

// Cache court : la case « Visible sur écran » d'Airtable doit se refléter
// rapidement sur la TV, tout en évitant de marteler l'API.
let cache = {
  opportunities: null,
  stats: null,
  lastUpdate: null
}

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

function isCacheValid() {
  return cache.lastUpdate && Date.now() - cache.lastUpdate < CACHE_DURATION
}

// GET /api/opportunities
router.get('/', async (req, res) => {
  try {
    if (isCacheValid() && cache.opportunities) {
      return res.json({ data: cache.opportunities, source: 'cache' })
    }

    const opportunities = await getOpportunities()
    cache.opportunities = opportunities
    cache.lastUpdate = Date.now()

    res.json({ data: opportunities, source: 'airtable' })
  } catch (err) {
    console.error('❌ Erreur route opportunités:', err)
    res.status(500).json({ error: 'Erreur lors de la récupération des opportunités' })
  }
})

// GET /api/opportunities/stats
router.get('/stats', async (req, res) => {
  try {
    if (isCacheValid() && cache.stats) {
      return res.json({ data: cache.stats, source: 'cache' })
    }

    const stats = await getStats()
    cache.stats = stats
    cache.lastUpdate = Date.now()

    res.json({ data: stats, source: 'airtable' })
  } catch (err) {
    console.error('❌ Erreur route stats:', err)
    res.status(500).json({ error: 'Erreur lors du calcul des stats' })
  }
})

// GET /api/opportunities/refresh — force le rechargement depuis Airtable
router.get('/refresh', async (req, res) => {
  try {
    cache.lastUpdate = 0
    const opportunities = await getOpportunities()
    const stats = await getStats()

    cache.opportunities = opportunities
    cache.stats = stats
    cache.lastUpdate = Date.now()

    res.json({
      message: 'Données Airtable rafraîchies',
      data: { opportunities, stats }
    })
  } catch (err) {
    console.error('❌ Erreur refresh:', err)
    res.status(500).json({ error: 'Erreur lors du rafraîchissement' })
  }
})

export default router
