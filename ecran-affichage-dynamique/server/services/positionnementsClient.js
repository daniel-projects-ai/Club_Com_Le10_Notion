// Client Airtable pour la table « Positionnements » : le lien entre un
// coworker et une opportunité sur laquelle il s'est déclaré intéressé.
// Écriture (POST / PATCH / DELETE) en plus de la lecture — c'est la première
// table de la plateforme que l'intranet modifie.

import { getCoworkerById } from './coworkersClient.js'

const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_POSITIONNEMENTS = process.env.AIRTABLE_TABLE_POSITIONNEMENTS || 'tbllJ1W7jxuTcODwe'

// Identifiants de champs : on écrit par ID plutôt que par nom, pour que le
// code survive à un renommage de colonne côté Airtable.
// « Référence » (fld2yJL4ELuAS2ka8) est le champ primaire : on le laisse à
// Airtable, qui le calcule à partir des liens.
const CHAMP_COWORKER = 'fldXtuPm5uEUybKhR'
const CHAMP_OPPORTUNITE = 'fld86VS10pTChIe6A'
const CHAMP_STATUT = 'fld6LyBF7ywt9M5Tt'
const CHAMP_DATE = 'fldYCMAEoCheS5Xre'

const STATUT_PAR_DEFAUT = 'Intéressé'

const urlTable = () => `https://api.airtable.com/v0/${BASE}/${TABLE_POSITIONNEMENTS}`

async function airtableRequete(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  // DELETE renvoie du JSON lui aussi ; on lit systématiquement le corps.
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error?.type || `HTTP ${res.status}`)
  }
  return data
}

// Lecture paginée de toute la table. Les positionnements se comptent en
// dizaines : un filtrage en mémoire est plus sûr qu'une formule Airtable sur
// des champs de lien, dont la sérialisation dépend du champ primaire.
async function listerTousLesPositionnements() {
  let records = []
  let offset

  do {
    const url = new URL(urlTable())
    url.searchParams.set('pageSize', '100')
    if (offset) url.searchParams.set('offset', offset)
    const data = await airtableRequete(url)
    records = records.concat(data.records || [])
    offset = data.offset
  } while (offset)

  return records.map(mapPositionnement)
}

function mapPositionnement(record) {
  const f = record.fields || {}
  return {
    id: record.id,
    reference: f['Référence'] || null,
    // Les champs de lien Airtable sont toujours des tableaux d'IDs.
    coworkerId: (f['Coworker'] || [])[0] || null,
    opportuniteId: (f['Opportunité'] || [])[0] || null,
    statut: f['Statut'] || null,
    date: f['Date'] || null,
    noteMacao: f['Note Macao'] || null
  }
}

// Date du jour au format attendu par Airtable (YYYY-MM-DD).
function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

// Positionnements d'un coworker donné : permet de savoir sur quelles
// opportunités il s'est déjà déclaré intéressé.
export async function listPositionnementsPourCoworker(coworkerId) {
  if (!coworkerId) return []
  const tous = await listerTousLesPositionnements()
  return tous.filter(p => p.coworkerId === coworkerId)
}

// Positionnements sur une opportunité, enrichis du profil coworker
// (nom, métiers, photo) — vue réservée à Macao.
export async function listPositionnementsPourOpportunite(opportuniteId) {
  if (!opportuniteId) return []
  const tous = await listerTousLesPositionnements()
  const concernes = tous.filter(p => p.opportuniteId === opportuniteId)

  return Promise.all(concernes.map(async (p) => {
    const cw = p.coworkerId ? await getCoworkerById(p.coworkerId) : null
    return {
      id: p.id,
      coworkerId: p.coworkerId,
      nom: cw?.nom || 'Coworker inconnu',
      metiers: cw?.metiers || [],
      photo: cw?.photo || null,
      statut: p.statut,
      date: p.date
    }
  }))
}

// Crée un positionnement « Intéressé » daté d'aujourd'hui.
// Si le couple (coworker, opportunité) existe déjà, on renvoie l'existant
// sans rien écrire : pas de doublon, et l'appel reste idempotent.
export async function creerPositionnement(coworkerId, opportuniteId) {
  if (!coworkerId || !opportuniteId) {
    throw new Error('Coworker et opportunité sont requis')
  }

  const existants = await listPositionnementsPourCoworker(coworkerId)
  const deja = existants.find(p => p.opportuniteId === opportuniteId)
  if (deja) return deja

  const data = await airtableRequete(urlTable(), {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        [CHAMP_COWORKER]: [coworkerId],
        [CHAMP_OPPORTUNITE]: [opportuniteId],
        [CHAMP_STATUT]: STATUT_PAR_DEFAUT,
        [CHAMP_DATE]: aujourdhuiISO()
      },
      typecast: true
    })
  })

  return mapPositionnement(data)
}

export async function supprimerPositionnement(positionnementId) {
  if (!positionnementId) throw new Error('Identifiant de positionnement requis')
  await airtableRequete(`${urlTable()}/${positionnementId}`, { method: 'DELETE' })
  return true
}

export default {
  listPositionnementsPourCoworker,
  listPositionnementsPourOpportunite,
  creerPositionnement,
  supprimerPositionnement
}
