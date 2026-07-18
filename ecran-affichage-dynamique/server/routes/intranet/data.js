import express from 'express'
import { getOpportunities, getAllOpportunities } from '../../services/airtableClient.js'
import { listActiveCoworkers, getCoworkerById } from '../../services/coworkersClient.js'
import { filterOpportunityForRole } from '../../services/permissions.js'
import {
  listPositionnementsPourCoworker,
  creerPositionnement,
  supprimerPositionnement
} from '../../services/positionnementsClient.js'

const router = express.Router()

// Toutes les routes de ce fichier exigent déjà une session (montées derrière requireAuth).

// Opportunités visibles par un rôle, enrichies de l'état de positionnement
// de l'utilisateur courant : le front a besoin de `estPositionne` et
// `positionnementId` pour afficher le bon état du bouton « Ça m'intéresse ».
async function opportunitesPourRole(role, coworkerId) {
  // Macao pilote : il lui faut le portefeuille complet, y compris les
  // opportunités pas (encore) cochées « Visible sur écran » — sinon le
  // compteur « À analyser » et la liste des prioritaires restent vides.
  // Les autres rôles ne voient que ce qui est publiable sur l'Écran TV.
  const brutes = role === 'Macao' ? await getAllOpportunities() : await getOpportunities()
  const filtrees = brutes.map(o => filterOpportunityForRole(o, role)).filter(Boolean)

  // Un seul appel Airtable pour tous les positionnements de l'utilisateur,
  // puis un index en mémoire : évite un aller-retour par opportunité.
  let parOpportunite = new Map()
  try {
    const miens = await listPositionnementsPourCoworker(coworkerId)
    parOpportunite = new Map(miens.map(p => [p.opportuniteId, p.id]))
  } catch (err) {
    // Un incident sur les positionnements ne doit pas priver l'utilisateur
    // de la liste des opportunités : on dégrade en « non positionné ».
    console.error('❌ positionnements (lecture):', err.message)
  }

  return filtrees.map(o => ({
    ...o,
    estPositionne: parOpportunite.has(o.id),
    positionnementId: parOpportunite.get(o.id) || null
  }))
}

// GET /api/intranet/opportunities
router.get('/opportunities', async (req, res) => {
  try {
    res.json({ data: await opportunitesPourRole(req.user.role, req.user.id) })
  } catch (err) {
    console.error('❌ opportunities:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// POST /api/intranet/opportunities/:id/interest
// Le coworker se déclare intéressé. Idempotent : un second appel renvoie
// le positionnement existant plutôt que d'en créer un doublon.
router.post('/opportunities/:id/interest', async (req, res) => {
  try {
    const positionnement = await creerPositionnement(req.user.id, req.params.id)
    res.json({ data: positionnement })
  } catch (err) {
    console.error('❌ interest (création):', err.message)
    res.status(500).json({ error: 'Impossible d\'enregistrer votre positionnement' })
  }
})

// DELETE /api/intranet/opportunities/:id/interest
// Retire le positionnement de l'utilisateur courant. On retrouve l'ID côté
// serveur : le client ne peut donc pas supprimer celui d'un autre coworker.
router.delete('/opportunities/:id/interest', async (req, res) => {
  try {
    const miens = await listPositionnementsPourCoworker(req.user.id)
    const cible = miens.find(p => p.opportuniteId === req.params.id)
    if (cible) await supprimerPositionnement(cible.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('❌ interest (suppression):', err.message)
    res.status(500).json({ error: 'Impossible de retirer votre positionnement' })
  }
})

// GET /api/intranet/directory
router.get('/directory', async (req, res) => {
  try {
    const cw = await listActiveCoworkers()
    // On ne diffuse jamais l'email dans l'annuaire : donnée personnelle,
    // inutile à la consultation.
    res.json({ data: cw.map(({ email, ...reste }) => reste) })
  } catch (err) {
    console.error('❌ directory:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// GET /api/intranet/profile
router.get('/profile', async (req, res) => {
  try {
    const cw = await getCoworkerById(req.user.id)
    if (!cw) return res.status(404).json({ error: 'Profil introuvable' })
    res.json({ data: cw })
  } catch (err) {
    console.error('❌ profile:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// GET /api/intranet/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const role = req.user.role
    const opps = await opportunitesPourRole(role, req.user.id)

    const aujourdhui = new Date().setHours(0, 0, 0, 0)
    const dansTrenteJours = aujourdhui + 30 * 24 * 3600 * 1000
    const echeancesProches = opps.filter(o => {
      if (!o.deadline) return false
      const d = new Date(o.deadline).getTime()
      return d >= aujourdhui && d <= dansTrenteJours
    }).length

    const base = {
      role,
      totalOpportunites: opps.length,
      echeancesProches,
      opportunites: opps
    }

    if (role !== 'Macao') return res.json({ data: base })

    // Vue Macao : on ajoute le pilotage.
    const parStatut = {}
    opps.forEach(o => {
      const s = o.status || 'Sans statut'
      parStatut[s] = (parStatut[s] || 0) + 1
    })

    res.json({
      data: {
        ...base,
        aAnalyser: opps.filter(o => o.status === 'À analyser').length,
        parStatut,
        // Les mieux notées d'abord : c'est ce qui mérite l'attention.
        prioritaires: [...opps]
          .filter(o => typeof o.score === 'number')
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
      }
    })
  } catch (err) {
    console.error('❌ dashboard:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

export default router
