import express from 'express'

export default function createModerationRoutes(moderationState, broadcastUpdate) {
  const router = express.Router()

  // GET /api/moderation/state
  router.get('/state', (req, res) => {
    res.json(moderationState)
  })

  // POST /api/moderation/toggle-opportunity
  router.post('/toggle-opportunity', (req, res) => {
    const { id } = req.body

    if (!moderationState.opportunities[id]) {
      moderationState.opportunities[id] = { visible: true }
    } else {
      moderationState.opportunities[id].visible = !moderationState.opportunities[id].visible
    }

    moderationState.lastUpdate = new Date()

    broadcastUpdate({
      type: 'opportunityToggled',
      data: { id, visible: moderationState.opportunities[id].visible }
    })

    res.json({ success: true, state: moderationState })
  })

  // POST /api/moderation/set-order
  router.post('/set-order', (req, res) => {
    const { order } = req.body

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order doit être un tableau' })
    }

    moderationState.displayOrder = order
    moderationState.lastUpdate = new Date()

    broadcastUpdate({
      type: 'orderChanged',
      data: { displayOrder: order }
    })

    res.json({ success: true, displayOrder: order })
  })

  // POST /api/moderation/set-durations
  router.post('/set-durations', (req, res) => {
    const { durations } = req.body

    if (typeof durations !== 'object') {
      return res.status(400).json({ error: 'Durations doit être un objet' })
    }

    moderationState.durations = { ...moderationState.durations, ...durations }
    moderationState.lastUpdate = new Date()

    broadcastUpdate({
      type: 'durationsChanged',
      data: { durations: moderationState.durations }
    })

    res.json({ success: true, durations: moderationState.durations })
  })

  // POST /api/moderation/pause
  router.post('/pause', (req, res) => {
    moderationState.paused = !moderationState.paused
    moderationState.lastUpdate = new Date()

    broadcastUpdate({
      type: 'pauseToggled',
      data: { paused: moderationState.paused }
    })

    res.json({ success: true, paused: moderationState.paused })
  })

  // POST /api/moderation/reset
  router.post('/reset', (req, res) => {
    moderationState.opportunities = {}
    moderationState.displayOrder = [1, 2, 3]
    moderationState.durations = { 1: 20, 2: 15, 3: 20 }
    moderationState.paused = false
    moderationState.lastUpdate = new Date()

    broadcastUpdate({
      type: 'reset',
      data: moderationState
    })

    res.json({ success: true, state: moderationState })
  })

  return router
}
