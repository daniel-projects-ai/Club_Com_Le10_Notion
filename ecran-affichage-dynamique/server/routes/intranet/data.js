import express from 'express'
import {
  getOpportunities,
  getAllOpportunities,
  updateOpportunityStatus
} from '../../services/airtableClient.js'
import { listActiveCoworkers, getCoworkerById } from '../../services/coworkersClient.js'
import { filterOpportunityForRole } from '../../services/permissions.js'
import { requireRole } from '../../middleware/requireAuth.js'
import {
  listPositionnementsPourCoworker,
  listPositionnementsPourOpportunite,
  creerPositionnement,
  supprimerPositionnement
} from '../../services/positionnementsClient.js'
import { listDossiers, getDossier, creerDossier, majDossier } from '../../services/dossiersClient.js'
import {
  piecesManquantes,
  estBloque,
  filterDossierForRole,
  joursAvantEcheance,
  validerChampsDossier
} from '../../services/dossiers.js'

const router = express.Router()

// Enrichit chaque dossier de ce que le front recalculerait sinon :
// les pièces manquantes et l'alerte de blocage.
function enrichir(d) {
  return { ...d, piecesManquantes: piecesManquantes(d), bloque: estBloque(d) }
}

// Index acheteurs / coworkers chargés UNE fois par requête : la résolution des
// liens se fait ensuite en mémoire, jamais un appel Airtable par dossier.
async function chargerIndexLiens() {
  let acheteurParOpportunite = new Map()
  let nomParCoworker = new Map()

  try {
    const opps = await getAllOpportunities()
    acheteurParOpportunite = new Map(opps.map(o => [o.id, o.client || null]))
  } catch (err) {
    console.error('❌ acheteurs (résolution):', err.message)
  }

  try {
    const cw = await listActiveCoworkers()
    nomParCoworker = new Map(cw.map(c => [c.id, c.nom]))
  } catch (err) {
    console.error('❌ équipe (résolution):', err.message)
  }

  return { acheteurParOpportunite, nomParCoworker }
}

// Résout les identifiants bruts en noms affichables. Un lien non résolu vaut
// null / [] : la fiche s'affiche quand même.
function resoudreLiens(d, { acheteurParOpportunite, nomParCoworker }) {
  const acheteur = (d.opportuniteIds || [])
    .map(id => acheteurParOpportunite.get(id))
    .find(Boolean) || null
  const equipe = (d.equipeIds || []).map(id => nomParCoworker.get(id)).filter(Boolean)
  return { ...d, acheteur, equipe }
}

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

// PATCH /api/intranet/opportunities/:id/status — réservé à Macao.
router.patch('/opportunities/:id/status', requireRole('Macao'), async (req, res) => {
  const { statut } = req.body || {}
  try {
    const opp = await updateOpportunityStatus(req.params.id, statut)
    res.json({ data: opp })
  } catch (err) {
    console.error('❌ status:', err.message)
    // Un statut hors liste est une erreur d'appel, pas une panne serveur.
    if (/Statut invalide/.test(err.message)) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Impossible de mettre à jour le statut' })
  }
})

// GET /api/intranet/opportunities/:id/positionnements — réservé à Macao.
router.get('/opportunities/:id/positionnements', requireRole('Macao'), async (req, res) => {
  try {
    res.json({ data: await listPositionnementsPourOpportunite(req.params.id) })
  } catch (err) {
    console.error('❌ positionnements:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// POST /api/intranet/opportunities/:id/dossier — créer le dossier (Macao)
router.post('/opportunities/:id/dossier', requireRole('Macao'), async (req, res) => {
  try {
    const existants = await listDossiers()
    const deja = existants.find(d => (d.opportuniteIds || []).includes(req.params.id))
    // Défense en profondeur : la route est réservée à Macao, mais aucune
    // réponse du module ne sort sans passer par le filtre de rôle. Le jour où
    // l'accès s'élargit, rien ici ne fuitera montants ni notes internes.
    if (deja) {
      return res.status(409).json({
        error: 'Un dossier existe déjà',
        data: filterDossierForRole(enrichir(deja), req.user.role)
      })
    }

    const opps = await getAllOpportunities()
    const opp = opps.find(o => o.id === req.params.id)
    if (!opp) return res.status(404).json({ error: 'Opportunité introuvable' })

    const champs = {
      'Nom du dossier': opp.name,
      'Opportunité liée': [opp.id],
      'Statut dossier': 'En préparation',
      'Résultat': 'En cours'
    }
    // Une opportunité sans date limite ne doit pas envoyer la clé du tout :
    // Airtable rejette une valeur nulle sur un champ date.
    if (opp.deadline) champs['Date limite'] = opp.deadline

    const cree = await creerDossier(champs)
    res.json({ data: enrichir(cree) })
  } catch (err) {
    console.error('❌ création dossier:', err.message)
    res.status(500).json({ error: 'Impossible de créer le dossier' })
  }
})

// GET /api/intranet/dossiers
// Macao voit tout ; un coworker ne voit que les dossiers où il est mobilisé.
router.get('/dossiers', async (req, res) => {
  try {
    const tous = await listDossiers()
    const visibles = req.user.role === 'Macao'
      ? tous
      : tous.filter(d => (d.equipeIds || []).includes(req.user.id))

    const index = await chargerIndexLiens()

    res.json({
      data: visibles
        .map(d => filterDossierForRole(resoudreLiens(enrichir(d), index), req.user.role))
        .filter(Boolean)
    })
  } catch (err) {
    console.error('❌ dossiers:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// GET /api/intranet/dossiers/:id
router.get('/dossiers/:id', async (req, res) => {
  try {
    const d = await getDossier(req.params.id)

    // Un coworker non mobilisé se voit refuser l'accès côté serveur.
    if (req.user.role !== 'Macao' && !(d.equipeIds || []).includes(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const index = await chargerIndexLiens()
    res.json({ data: filterDossierForRole(resoudreLiens(enrichir(d), index), req.user.role) })
  } catch (err) {
    console.error('❌ dossier:', err.message)
    // Airtable signale un identifiant inconnu par un 404 : c'est une erreur
    // d'appel, pas une panne serveur.
    if (/NOT_FOUND|HTTP 404/i.test(err.message)) {
      return res.status(404).json({ error: 'Dossier introuvable' })
    }
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// PATCH /api/intranet/dossiers/:id — faire avancer un chantier (Macao)
router.patch('/dossiers/:id', requireRole('Macao'), async (req, res) => {
  // Liste blanche : le client ne peut modifier que ces champs, jamais les
  // montants ou les notes, qui se saisissent dans Airtable.
  const AUTORISES = {
    memoire: 'Mémoire technique',
    offre: 'Offre financière',
    depot: 'Dépôt',
    statut: 'Statut dossier',
    piecesFournies: 'Pièces fournies'
  }

  // La liste blanche ne contrôle que les NOMS de champs. Airtable étant appelé
  // avec `typecast: true`, une valeur inconnue créerait une option au lieu
  // d'être rejetée : on valide donc les valeurs avant tout appel réseau.
  const erreur = validerChampsDossier(req.body || {})
  if (erreur) return res.status(400).json({ error: erreur })

  const champs = {}
  for (const [cle, colonne] of Object.entries(AUTORISES)) {
    // On teste `undefined` et non la véracité : `piecesFournies: []` (tout
    // décocher) est une modification légitime.
    if (req.body?.[cle] !== undefined) champs[colonne] = req.body[cle]
  }
  if (!Object.keys(champs).length) {
    return res.status(400).json({ error: 'Aucun champ modifiable fourni' })
  }

  try {
    const maj = await majDossier(req.params.id, champs)
    res.json({ data: enrichir(maj) })
  } catch (err) {
    console.error('❌ maj dossier:', err.message)
    res.status(500).json({ error: 'Impossible de mettre à jour le dossier' })
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

    // Indicateurs dossiers : uniquement pour Macao. Isolés du reste du tableau
    // de bord — une panne sur cette table (droits, 5xx) ne doit pas vider la
    // page d'accueil : les compteurs valent null et s'affichent « — ».
    let dossiersEnCours = null
    let aDeposer = null
    let dossiersBloques = null
    try {
      const dossiers = (await listDossiers()).map(enrichir)
      dossiersEnCours = dossiers.filter(d => d.resultat === 'En cours').length
      aDeposer = dossiers.filter(d => {
        // Comparaison en journées : une échéance du jour reste « à déposer ».
        const jours = joursAvantEcheance(d.dateLimite)
        return jours !== null && jours >= 0 && jours <= 7 &&
               !['Déposé', 'Accusé reçu'].includes(d.depot)
      }).length
      dossiersBloques = dossiers.filter(d => d.bloque).length
    } catch (err) {
      console.error('❌ indicateurs dossiers:', err.message)
    }

    res.json({
      data: {
        ...base,
        aAnalyser: opps.filter(o => o.status === 'À analyser').length,
        dossiersEnCours,
        aDeposer,
        dossiersBloques,
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
