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
import {
  listOrganisations,
  getOrganisation,
  listInterlocuteurs
} from '../../services/organisationsClient.js'
import { calculerHistorique, filterOrganisationForRole } from '../../services/organisations.js'
import {
  listInteractions,
  listTaches,
  creerInteraction,
  creerTache,
  majTache,
  majDernierEchange
} from '../../services/interactionsClient.js'
import {
  classerRelances,
  referenceInteraction,
  CANAUX,
  SENS,
  STATUTS_TACHE,
  AUTEURS
} from '../../services/interactions.js'

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

// Contexte CRM chargé UNE fois par requête (même principe que chargerIndexLiens) :
// les rattachements organisation → opportunités → dossiers se font ensuite en
// mémoire, jamais un appel Airtable par organisation.
// `avecInterlocuteurs` vaut true par défaut : un appelant qui oublie l'option
// obtient le contexte complet plutôt qu'une fiche amputée. Seule la route liste,
// qui n'affiche pas les interlocuteurs, s'en dispense explicitement.
// `avecJournal` suit la même convention : true par défaut, seule la route liste
// s'en dispense explicitement. Interactions et tâches sont chargées UNE fois
// par requête, jamais par organisation.
async function chargerContexteCrm({ avecInterlocuteurs = true, avecJournal = true } = {}) {
  // getAllOpportunities absorbe déjà ses propres pannes et renvoie [].
  const opportunites = await getAllOpportunities()
  const oppParId = new Map(opportunites.map(o => [o.id, o]))

  // Une panne sur ces tables ne doit pas faire échouer la route : l'historique
  // se dégrade (compteurs à null, listes vides) mais la fiche s'affiche.
  let dossiers = []
  try {
    dossiers = await listDossiers()
  } catch (err) {
    console.error('❌ CRM (dossiers):', err.message)
  }

  let interlocuteurs = []
  if (avecInterlocuteurs) {
    try {
      interlocuteurs = await listInterlocuteurs()
    } catch (err) {
      console.error('❌ CRM (interlocuteurs):', err.message)
    }
  }

  // Même principe pour le journal : une panne sur ces tables dégrade la fiche
  // (listes vides) plutôt que de la faire échouer en 500.
  let interactions = []
  let taches = []
  if (avecJournal) {
    try {
      interactions = await listInteractions()
    } catch (err) {
      console.error('❌ CRM (interactions):', err.message)
    }
    try {
      taches = await listTaches()
    } catch (err) {
      console.error('❌ CRM (tâches):', err.message)
    }
  }

  return { oppParId, dossiers, interlocuteurs, interactions, taches }
}

// Rattache à une organisation ses opportunités et ses dossiers.
// Un identifiant lié pointant sur une opportunité supprimée est simplement
// ignoré (filter(Boolean)) : le calcul ne doit pas tomber pour autant.
function rattacher(organisation, { oppParId, dossiers }) {
  const opportunites = (organisation.opportuniteIds || [])
    .map(id => oppParId.get(id))
    .filter(Boolean)
  const idsOpp = new Set(opportunites.map(o => o.id))
  const dossiersLies = dossiers.filter(d => (d.opportuniteIds || []).some(id => idsOpp.has(id)))
  return { opportunites, dossiers: dossiersLies }
}

// GET /api/intranet/organisations — réservé à Macao.
router.get('/organisations', requireRole('Macao'), async (req, res) => {
  try {
    const organisations = await listOrganisations()
    // La liste n'affiche ni les interlocuteurs ni le journal : inutile
    // d'appeler ces tables.
    const contexte = await chargerContexteCrm({ avecInterlocuteurs: false, avecJournal: false })

    res.json({
      data: organisations
        .map(org => {
          const { opportunites, dossiers } = rattacher(org, contexte)
          return { ...org, historique: calculerHistorique(opportunites, dossiers) }
        })
        .map(org => filterOrganisationForRole(org, req.user.role))
        .filter(Boolean)
    })
  } catch (err) {
    console.error('❌ organisations:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// GET /api/intranet/organisations/:id — réservé à Macao.
router.get('/organisations/:id', requireRole('Macao'), async (req, res) => {
  try {
    const org = await getOrganisation(req.params.id)
    const contexte = await chargerContexteCrm()
    const { opportunites, dossiers } = rattacher(org, contexte)

    const fiche = {
      ...org,
      historique: calculerHistorique(opportunites, dossiers),
      opportunites: opportunites.map(o => ({
        id: o.id,
        nom: o.name,
        statut: o.status,
        dateLimite: o.deadline
      })),
      dossiers: dossiers.map(d => ({
        id: d.id,
        nom: d.nom,
        statut: d.statut,
        resultat: d.resultat
      })),
      interlocuteurs: contexte.interlocuteurs.filter(i => (i.organisationIds || []).includes(org.id)),
      // Journal de l'organisation, du plus récent au plus ancien. Les dates
      // Airtable sont des chaînes « AAAA-MM-JJ » : à format constant, l'ordre
      // lexicographique est l'ordre chronologique, donc pas de Date à
      // construire. Une interaction sans date part en fin de liste.
      interactions: contexte.interactions
        .filter(i => (i.organisationIds || []).includes(org.id))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .map(i => ({
          id: i.id,
          canal: i.canal,
          sens: i.sens,
          date: i.date,
          compteRendu: i.compteRendu,
          auteur: i.auteur,
          assisteeIA: i.assisteeIA,
          interlocuteurIds: i.interlocuteurIds
        })),
      taches: contexte.taches
        .filter(t => (t.organisationIds || []).includes(org.id))
        .map(t => ({
          id: t.id,
          intitule: t.intitule,
          echeance: t.echeance,
          statut: t.statut,
          responsable: t.responsable
        }))
    }

    res.json({ data: filterOrganisationForRole(fiche, req.user.role) })
  } catch (err) {
    console.error('❌ organisation:', err.message)
    // Airtable signale un identifiant inconnu par un 404 : c'est une erreur
    // d'appel, pas une panne serveur.
    if (/NOT_FOUND|HTTP 404/i.test(err.message)) {
      return res.status(404).json({ error: 'Organisation introuvable' })
    }
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// Journée locale au format Airtable « AAAA-MM-JJ ». toISOString() donnerait la
// journée UTC : le soir à Paris, un échange serait daté du lendemain.
function jourLocal(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Résout le nom de l'auteur depuis la session. Les single selects « Auteur » et
// « Responsable » ne listent que l'équipe Macao : un nom hors liste serait créé
// par typecast au lieu d'être rejeté, on préfère ne rien écrire.
async function auteurDeLaSession(userId) {
  try {
    const cw = await getCoworkerById(userId)
    const nom = cw?.nom || null
    return AUTEURS.includes(nom) ? nom : null
  } catch (err) {
    console.error('❌ auteur (résolution):', err.message)
    return null
  }
}

// POST /api/intranet/interactions — consigner un échange (Macao).
// Principe directeur : une fois le compte rendu saisi, il DOIT être enregistré.
// Les enrichissements qui suivent (date de dernier échange, relance) sont des
// bonus signalés dans `avertissements`, jamais des causes d'échec : perdre un
// compte rendu déjà rédigé est ce qui fait abandonner un journal.
router.post('/interactions', requireRole('Macao'), async (req, res) => {
  const {
    organisationId, canal, sens, date, compteRendu,
    interlocuteurId, opportuniteId, assisteeIA, relance
  } = req.body || {}

  // Validation des valeurs AVANT tout appel réseau : Airtable est appelé avec
  // `typecast: true`, une valeur hors liste créerait une option au lieu d'être
  // rejetée. Même motif que le PATCH /dossiers/:id.
  if (!organisationId) return res.status(400).json({ error: 'organisationId est obligatoire' })
  if (!CANAUX.includes(canal)) return res.status(400).json({ error: `Canal invalide : ${canal}` })
  if (!SENS.includes(sens)) return res.status(400).json({ error: `Sens invalide : ${sens}` })

  const jour = date || jourLocal()
  const avertissements = []

  try {
    // Le nom de l'organisation ne sert qu'au libellé : s'il manque, la
    // référence se contente de la date et du canal.
    let nomOrganisation = null
    try {
      nomOrganisation = (await getOrganisation(organisationId))?.nom || null
    } catch (err) {
      console.error('❌ interaction (nom organisation):', err.message)
    }

    const auteur = await auteurDeLaSession(req.user.id)

    const champs = {
      'Référence': referenceInteraction({ date: jour, canal }, nomOrganisation),
      'Canal': canal,
      'Sens': sens,
      'Date': jour,
      'Organisation': [organisationId],
      'Assistée par IA': assisteeIA === true
    }
    // Un compte rendu vide est légitime : un appel sans suite reste un fait à
    // journaliser. On n'écrit simplement pas la clé.
    if (compteRendu) champs['Compte rendu'] = compteRendu
    if (auteur) champs['Auteur'] = auteur
    if (interlocuteurId) champs['Interlocuteur'] = [interlocuteurId]
    if (opportuniteId) champs['Opportunité'] = [opportuniteId]

    const interaction = await creerInteraction(champs)

    // À partir d'ici, plus rien ne peut faire échouer la requête.
    try {
      await majDernierEchange(organisationId, jour)
    } catch (err) {
      console.error('❌ interaction (dernier échange):', err.message)
      avertissements.push('Le dernier échange de l\'organisation n\'a pas pu être mis à jour.')
    }

    let tache = null
    if (relance?.intitule) {
      try {
        const champsTache = {
          'Intitulé': relance.intitule,
          'Statut': 'À faire',
          'Organisation': [organisationId],
          'Interaction d\'origine': [interaction.id]
        }
        // Une relance sans échéance reste utile : elle est créée quand même et
        // se rangera dans « plus tard » plutôt que d'être perdue.
        if (relance.echeance) champsTache['Échéance'] = relance.echeance
        else avertissements.push('Relance créée sans échéance : elle apparaîtra dans « plus tard ».')
        if (auteur) champsTache['Responsable'] = auteur
        if (interlocuteurId) champsTache['Interlocuteur'] = [interlocuteurId]
        if (opportuniteId) champsTache['Opportunité'] = [opportuniteId]

        tache = await creerTache(champsTache)
      } catch (err) {
        console.error('❌ interaction (relance):', err.message)
        avertissements.push('L\'échange est enregistré, mais la relance n\'a pas pu être créée.')
      }
    }

    res.json({ data: { interaction, tache, avertissements } })
  } catch (err) {
    console.error('❌ interaction (création):', err.message)
    res.status(500).json({ error: 'Impossible d\'enregistrer l\'échange' })
  }
})

// PATCH /api/intranet/taches/:id — faire avancer une relance (Macao).
router.patch('/taches/:id', requireRole('Macao'), async (req, res) => {
  const { statut } = req.body || {}
  // Liste fermée validée avant l'appel réseau, pour la même raison que ci-dessus.
  if (!STATUTS_TACHE.includes(statut)) {
    return res.status(400).json({ error: `Statut invalide : ${statut}` })
  }

  try {
    res.json({ data: await majTache(req.params.id, { 'Statut': statut }) })
  } catch (err) {
    console.error('❌ maj tâche:', err.message)
    if (/NOT_FOUND|HTTP 404/i.test(err.message)) {
      return res.status(404).json({ error: 'Tâche introuvable' })
    }
    res.status(500).json({ error: 'Impossible de mettre à jour la relance' })
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

    // Relances : isolées elles aussi. Une panne sur la table Tâches ne doit pas
    // rendre la page d'accueil blanche — les trois valeurs tombent à null et
    // s'affichent « — ».
    let relances = null
    let relancesEnRetard = null
    let relancesCetteSemaine = null
    try {
      const taches = await listTaches()

      // Le nom de l'organisation est résolu depuis un index chargé une seule
      // fois, jamais un appel Airtable par tâche.
      let nomParOrganisation = new Map()
      try {
        nomParOrganisation = new Map((await listOrganisations()).map(o => [o.id, o.nom]))
      } catch (err) {
        // Sans les noms, la relance reste affichable : seul le libellé manque.
        console.error('❌ relances (organisations):', err.message)
      }

      const avecOrganisation = taches.map(t => ({
        ...t,
        organisation: (t.organisationIds || []).map(id => nomParOrganisation.get(id)).find(Boolean) || null
      }))

      relances = classerRelances(avecOrganisation)
      relancesEnRetard = relances.enRetard.length
      relancesCetteSemaine = relances.cetteSemaine.length
    } catch (err) {
      console.error('❌ relances:', err.message)
    }

    // Seul garde-fou contre la dégradation silencieuse du CRM : une opportunité
    // créée sans organisation rattachée n'apparaît dans aucune fiche et sortirait
    // de l'historique sans que personne ne s'en aperçoive. Contrairement aux
    // indicateurs dossiers, ce calcul n'appelle pas Airtable : il compte en mémoire
    // des opportunités déjà chargées, donc rien à isoler ici.
    const sansOrganisation = opps.filter(o => !(o.organisationIds || []).length).length

    res.json({
      data: {
        ...base,
        aAnalyser: opps.filter(o => o.status === 'À analyser').length,
        sansOrganisation,
        dossiersEnCours,
        aDeposer,
        dossiersBloques,
        relances,
        relancesEnRetard,
        relancesCetteSemaine,
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
