import express from 'express'
import { Client } from '@notionhq/client'
import { getOpportunities, getDossiers, getStats, cleanNotionId } from '../services/notionClient.js'

const router = express.Router()

// GET /api/notion/debug - diagnostic temporaire
router.get('/debug', async (req, res) => {
  const cleanOpp = cleanNotionId(process.env.NOTION_DB_OPPORTUNITIES)
  const cleanDos = cleanNotionId(process.env.NOTION_DB_DOSSIERS)
  const result = { env: {}, opportunities: {}, dossiers: {} }
  result.env.hasApiKey = !!process.env.NOTION_API_KEY
  result.env.dbOpportunities = cleanOpp || '(non défini)'
  result.env.dbDossiers = cleanDos || '(non défini)'

  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  for (const [key, dbId] of [['opportunities', cleanOpp], ['dossiers', cleanDos]]) {
    try {
      const r = await notion.databases.query({ database_id: dbId })
      result[key] = {
        ok: true,
        count: r.results.length,
        propertyNames: r.results[0] ? Object.keys(r.results[0].properties) : [],
        firstRow: r.results[0]
          ? Object.fromEntries(Object.entries(r.results[0].properties).map(([k, v]) => [k, v.type]))
          : null
      }
    } catch (err) {
      result[key] = { ok: false, error: err.message, code: err.code }
    }
  }

  res.json(result)
})

// Cache pour éviter trop d'appels Notion
let cache = {
  opportunities: null,
  dossiers: null,
  stats: null,
  lastUpdate: null
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

function isCacheValid() {
  return cache.lastUpdate && Date.now() - cache.lastUpdate < CACHE_DURATION
}

// GET /api/notion/opportunities
router.get('/opportunities', async (req, res) => {
  try {
    if (isCacheValid()) {
      return res.json({ data: cache.opportunities, source: 'cache' })
    }

    const opportunities = await getOpportunities()
    cache.opportunities = opportunities
    cache.lastUpdate = Date.now()

    res.json({ data: opportunities, source: 'notion' })
  } catch (err) {
    console.error('❌ Erreur route opportunités:', err)
    res.status(500).json({ error: 'Erreur lors de la récupération des opportunités' })
  }
})

// GET /api/notion/dossiers
router.get('/dossiers', async (req, res) => {
  try {
    if (isCacheValid()) {
      return res.json({ data: cache.dossiers, source: 'cache' })
    }

    const dossiers = await getDossiers()
    cache.dossiers = dossiers
    cache.lastUpdate = Date.now()

    res.json({ data: dossiers, source: 'notion' })
  } catch (err) {
    console.error('❌ Erreur route dossiers:', err)
    res.status(500).json({ error: 'Erreur lors de la récupération des dossiers' })
  }
})

// GET /api/notion/stats
router.get('/stats', async (req, res) => {
  try {
    if (isCacheValid()) {
      return res.json({ data: cache.stats, source: 'cache' })
    }

    const stats = await getStats()
    cache.stats = stats
    cache.lastUpdate = Date.now()

    res.json({ data: stats, source: 'notion' })
  } catch (err) {
    console.error('❌ Erreur route stats:', err)
    res.status(500).json({ error: 'Erreur lors du calcul des stats' })
  }
})

// GET /api/notion/refresh
router.get('/refresh', async (req, res) => {
  try {
    cache.lastUpdate = 0 // Forcer un rafraîchissement
    const opportunities = await getOpportunities()
    const dossiers = await getDossiers()
    const stats = await getStats()

    cache.opportunities = opportunities
    cache.dossiers = dossiers
    cache.stats = stats
    cache.lastUpdate = Date.now()

    res.json({
      message: 'Données Notion rafraîchies',
      data: { opportunities, dossiers, stats }
    })
  } catch (err) {
    console.error('❌ Erreur refresh:', err)
    res.status(500).json({ error: 'Erreur lors du rafraîchissement' })
  }
})

export default router
