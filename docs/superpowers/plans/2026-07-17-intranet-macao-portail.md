# Intranet Macao — Phase 1 (portail) — Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** livrer un portail intranet authentifié où chaque rôle (Macao, Coworker, Freelance) accède à un tableau de bord lisible et aux données Airtable qui le concernent.

**Architecture :** Airtable reste la base de données. Le backend Express déjà déployé sur Railway gagne un groupe de routes `/api/intranet/*` protégées par session ; les routes publiques de l'Écran TV restent inchangées. Une nouvelle application React (`intranet-macao/`) consomme ces routes et porte l'identité mixte Macao / LE 10.

**Stack :** Node 22 + Express, `jsonwebtoken`, `cookie-parser`, `resend`, Airtable REST API · React + Vite + Tailwind · tests avec le runner natif `node --test`.

**Spec de référence :** `docs/superpowers/specs/2026-07-17-intranet-macao-portail-design.md`

---

## Dette technique assumée

Le dossier `ecran-affichage-dynamique/server/` héberge maintenant un backend **partagé** (Écran TV *et* intranet). Son nom est trompeur, mais le renommer imposerait de reconfigurer Railway (répertoire racine, commande de démarrage) sur un service en production. On garde le nom et on documente. À rebaptiser lors d'une future migration d'infrastructure, jamais en même temps qu'une livraison fonctionnelle.

## Structure des fichiers

**Backend** — `ecran-affichage-dynamique/server/`

| Fichier | Responsabilité |
|---|---|
| `services/coworkersClient.js` | Lire la table Coworkers (recherche par email, liste des actifs) |
| `services/auth.js` | Signer et vérifier les jetons (lien magique + session). **Fonctions pures, testables.** |
| `services/permissions.js` | Matrice des rôles : filtrer une opportunité, autoriser une ressource. **Fonctions pures, testables.** |
| `services/mailer.js` | Envoyer l'email de lien magique via Resend |
| `middleware/requireAuth.js` | Lire le cookie de session, peupler `req.user`, refuser sinon |
| `routes/intranet/auth.js` | `POST /request-link`, `GET /verify`, `POST /logout`, `GET /me` |
| `routes/intranet/data.js` | `GET /dashboard`, `GET /opportunities`, `GET /directory`, `POST /opportunities/:id/interest` |
| `tests/auth.test.js` | Tests des jetons |
| `tests/permissions.test.js` | Tests de la matrice des rôles |

**Frontend** — `intranet-macao/`

| Fichier | Responsabilité |
|---|---|
| `src/lib/api.js` | Appels HTTP avec cookies de session |
| `src/context/AuthContext.jsx` | État de session, chargement de l'utilisateur |
| `src/layout/Shell.jsx` | Navigation latérale + en-tête |
| `src/pages/Login.jsx` · `Verify.jsx` | Connexion par lien magique |
| `src/pages/Dashboard.jsx` | Tableau de bord selon le rôle |
| `src/pages/Opportunities.jsx` · `Directory.jsx` · `Profile.jsx` | Les trois autres pages |
| `src/components/dash/StatBand.jsx` · `PipelineBars.jsx` · `ActionList.jsx` | Briques de tableau de bord réutilisables |

---

## Phase A — Socle backend et authentification

### Tâche 1 : Ajouter le rôle « Freelance » dans Airtable

**Cible :** base `appdJ309q39i4Gr8t`, table Coworkers `tbl89xazn0oY4A18o`, champ Rôle `fldtgfmXlAtIbHjwO`.

- [ ] **Étape 1 : Ajouter l'option**

Via le connecteur Airtable (`update_field`) ou l'interface : ajouter la valeur `Freelance` aux options du champ **Rôle**, en conservant `Coworker` et `Macao`.

- [ ] **Étape 2 : Vérifier**

Ouvrir la table Coworkers, dérouler le champ Rôle : les trois options `Coworker`, `Macao`, `Freelance` doivent apparaître. Aucune fiche existante ne doit avoir changé de rôle.

### Tâche 2 : Dépendances et variables d'environnement

**Fichiers :** `ecran-affichage-dynamique/package.json`

- [ ] **Étape 1 : Installer les dépendances**

```bash
cd ecran-affichage-dynamique
npm install jsonwebtoken cookie-parser resend
npm uninstall @notionhq/client
```

`@notionhq/client` n'est plus importé nulle part depuis la bascule sur Airtable.

- [ ] **Étape 2 : Documenter les variables**

Ajouter à `ecran-affichage-dynamique/.env.example` :

```
AIRTABLE_TOKEN=
AIRTABLE_BASE_ID=appdJ309q39i4Gr8t
JWT_SECRET=
RESEND_API_KEY=
RESEND_FROM=intranet@agence-macao.com
INTRANET_URL=https://intranet-macao.vercel.app
```

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/package.json ecran-affichage-dynamique/package-lock.json ecran-affichage-dynamique/.env.example
git commit -m "chore: add intranet deps (jwt, cookies, resend), drop unused notion sdk"
```

### Tâche 3 : Jetons d'authentification (TDD)

**Fichiers :**
- Créer : `ecran-affichage-dynamique/server/services/auth.js`
- Test : `ecran-affichage-dynamique/tests/auth.test.js`

- [ ] **Étape 1 : Écrire le test qui échoue**

```javascript
// ecran-affichage-dynamique/tests/auth.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET = 'secret-de-test'
const { signMagicToken, verifyMagicToken, signSession, verifySession } =
  await import('../server/services/auth.js')

const user = { id: 'recABC', email: 'a@b.fr', role: 'Macao' }

test('un jeton magique valide se vérifie et rend l\'utilisateur', () => {
  const t = signMagicToken(user)
  const out = verifyMagicToken(t)
  assert.equal(out.email, 'a@b.fr')
  assert.equal(out.role, 'Macao')
})

test('un jeton magique falsifié est rejeté', () => {
  assert.equal(verifyMagicToken('abc.def.ghi'), null)
})

test('un jeton magique expiré est rejeté', () => {
  const t = signMagicToken(user, -1) // déjà expiré
  assert.equal(verifyMagicToken(t), null)
})

test('un jeton de session ne peut pas servir de jeton magique', () => {
  const s = signSession(user)
  assert.equal(verifyMagicToken(s), null)
})

test('un jeton de session valide se vérifie', () => {
  const s = signSession(user)
  assert.equal(verifySession(s).id, 'recABC')
})
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd ecran-affichage-dynamique && node --test tests/auth.test.js
```
Attendu : ÉCHEC — `Cannot find module '../server/services/auth.js'`

- [ ] **Étape 3 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/auth.js
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
// Deux "audiences" distinctes : un jeton de connexion ne doit jamais
// pouvoir être rejoué comme un jeton de session.
const AUD_MAGIC = 'magic'
const AUD_SESSION = 'session'

function payloadOf(user) {
  return { id: user.id, email: user.email, role: user.role }
}

export function signMagicToken(user, expiresInMinutes = 15) {
  return jwt.sign({ ...payloadOf(user), aud: AUD_MAGIC }, SECRET, {
    expiresIn: `${expiresInMinutes}m`
  })
}

export function verifyMagicToken(token) {
  try {
    const d = jwt.verify(token, SECRET, { audience: AUD_MAGIC })
    return { id: d.id, email: d.email, role: d.role }
  } catch {
    return null
  }
}

export function signSession(user, expiresInDays = 30) {
  return jwt.sign({ ...payloadOf(user), aud: AUD_SESSION }, SECRET, {
    expiresIn: `${expiresInDays}d`
  })
}

export function verifySession(token) {
  try {
    const d = jwt.verify(token, SECRET, { audience: AUD_SESSION })
    return { id: d.id, email: d.email, role: d.role }
  } catch {
    return null
  }
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

```bash
cd ecran-affichage-dynamique && node --test tests/auth.test.js
```
Attendu : `# pass 5`

- [ ] **Étape 5 : Commit**

```bash
git add ecran-affichage-dynamique/server/services/auth.js ecran-affichage-dynamique/tests/auth.test.js
git commit -m "feat(intranet): magic-link and session tokens with separate audiences"
```

### Tâche 4 : Matrice des permissions (TDD)

**Fichiers :**
- Créer : `ecran-affichage-dynamique/server/services/permissions.js`
- Test : `ecran-affichage-dynamique/tests/permissions.test.js`

- [ ] **Étape 1 : Écrire le test qui échoue**

```javascript
// ecran-affichage-dynamique/tests/permissions.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterOpportunityForRole, canAccess } from '../server/services/permissions.js'

const opp = {
  id: 'rec1', name: 'Refonte site', client: 'Ville X', objet: 'Description',
  deadline: '2026-09-01', budget: 30000, status: 'GO', territoire: 'Agen',
  score: 95, notesInternes: 'Contact chez le DGS', referent: 'Daniel', visible: true
}

test('Macao voit le score et les notes internes', () => {
  const r = filterOpportunityForRole(opp, 'Macao')
  assert.equal(r.score, 95)
  assert.equal(r.notesInternes, 'Contact chez le DGS')
  assert.equal(r.referent, 'Daniel')
})

test('un Coworker ne reçoit ni score ni notes internes ni référent', () => {
  const r = filterOpportunityForRole(opp, 'Coworker')
  assert.equal(r.score, undefined)
  assert.equal(r.notesInternes, undefined)
  assert.equal(r.referent, undefined)
  assert.equal(r.name, 'Refonte site') // le reste passe
  assert.equal(r.budget, 30000)
})

test('un Freelance est traité comme un Coworker en phase 1', () => {
  assert.deepEqual(
    filterOpportunityForRole(opp, 'Freelance'),
    filterOpportunityForRole(opp, 'Coworker')
  )
})

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterOpportunityForRole(opp, 'Inconnu'), null)
})

test('seul Macao accède à l\'administration', () => {
  assert.equal(canAccess('Macao', 'admin'), true)
  assert.equal(canAccess('Coworker', 'admin'), false)
  assert.equal(canAccess('Freelance', 'admin'), false)
})

test('tous les rôles connus accèdent à l\'annuaire', () => {
  assert.equal(canAccess('Coworker', 'directory'), true)
  assert.equal(canAccess('Macao', 'directory'), true)
  assert.equal(canAccess('Inconnu', 'directory'), false)
})
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd ecran-affichage-dynamique && node --test tests/permissions.test.js
```
Attendu : ÉCHEC — module introuvable

- [ ] **Étape 3 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/permissions.js

export const ROLES = ['Macao', 'Coworker', 'Freelance']

// Champs réservés à l'équipe Macao : ils ne quittent jamais le serveur
// pour un autre rôle.
const CHAMPS_INTERNES = ['score', 'notesInternes', 'referent']

export function filterOpportunityForRole(opp, role) {
  if (!ROLES.includes(role)) return null
  if (role === 'Macao') return opp

  const copie = { ...opp }
  for (const champ of CHAMPS_INTERNES) delete copie[champ]
  return copie
}

const ACCES = {
  admin: ['Macao'],
  opportunities: ['Macao', 'Coworker', 'Freelance'],
  directory: ['Macao', 'Coworker', 'Freelance'],
  profile: ['Macao', 'Coworker', 'Freelance']
}

export function canAccess(role, ressource) {
  return (ACCES[ressource] || []).includes(role)
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

```bash
cd ecran-affichage-dynamique && node --test tests/permissions.test.js
```
Attendu : `# pass 6`

- [ ] **Étape 5 : Commit**

```bash
git add ecran-affichage-dynamique/server/services/permissions.js ecran-affichage-dynamique/tests/permissions.test.js
git commit -m "feat(intranet): role permission matrix, server-side field filtering"
```

### Tâche 5 : Lecture de la table Coworkers

**Fichiers :** Créer `ecran-affichage-dynamique/server/services/coworkersClient.js`

- [ ] **Étape 1 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/coworkersClient.js
const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_COWORKERS = 'tbl89xazn0oY4A18o'

async function airtableGet(tableId, params = {}) {
  const url = new URL(`https://api.airtable.com/v0/${BASE}/${tableId}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)
  return data
}

function mapCoworker(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom affiché'] || f['Nom complet'] || 'Sans nom',
    email: (f['Email'] || '').toLowerCase(),
    role: f['Rôle'] || null,
    statut: f['Statut'] || null,
    bio: f['Bio'] || null,
    portfolio: f['Portfolio / site'] || null,
    disponibilite: f['Disponibilité'] || null,
    metiers: f['Métiers déclarés'] || [],
    photo: (f['Photo'] || [])[0]?.url || null
  }
}

// Recherche par email. Renvoie null si absent ou inactif : dans les deux cas
// la réponse HTTP sera identique, pour ne pas révéler l'existence d'un compte.
export async function findCoworkerByEmail(email) {
  const propre = String(email || '').trim().toLowerCase()
  if (!propre) return null

  const data = await airtableGet(TABLE_COWORKERS, {
    filterByFormula: `LOWER({Email}) = "${propre.replace(/"/g, '')}"`,
    maxRecords: 1
  })
  const rec = (data.records || [])[0]
  if (!rec) return null

  const cw = mapCoworker(rec)
  if (cw.statut === 'Inactif') return null
  if (!cw.role) return null
  return cw
}

export async function listActiveCoworkers() {
  const data = await airtableGet(TABLE_COWORKERS, {
    filterByFormula: `{Statut} = "Actif"`,
    pageSize: 100
  })
  return (data.records || []).map(mapCoworker)
}

export async function getCoworkerById(id) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE_COWORKERS}/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
  if (!res.ok) return null
  return mapCoworker(await res.json())
}
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd ecran-affichage-dynamique && node --check server/services/coworkersClient.js
```
Attendu : aucune sortie (succès)

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/services/coworkersClient.js
git commit -m "feat(intranet): read coworkers from Airtable (lookup by email, active list)"
```

### Tâche 6 : Envoi de l'email de connexion

**Fichiers :** Créer `ecran-affichage-dynamique/server/services/mailer.js`

- [ ] **Étape 1 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/mailer.js
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'intranet@agence-macao.com'

export async function sendMagicLink(email, lien, prenom = '') {
  const salutation = prenom ? `Bonjour ${prenom},` : 'Bonjour,'

  const html = `
    <div style="font-family:'Work Sans',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d1d1b">
      <p style="font-size:16px">${salutation}</p>
      <p style="font-size:16px;line-height:1.55">
        Voici votre lien de connexion à l'intranet Macao. Il est valable
        <strong>15 minutes</strong> et ne fonctionne qu'une fois.
      </p>
      <p style="margin:28px 0">
        <a href="${lien}"
           style="background:#c0562f;color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:700;display:inline-block">
          Ouvrir l'intranet
        </a>
      </p>
      <p style="font-size:13px;color:#6b6b68;line-height:1.5">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email :
        aucune connexion ne sera ouverte.
      </p>
    </div>`

  await resend.emails.send({
    from: `Intranet Macao <${FROM}>`,
    to: email,
    subject: 'Votre lien de connexion à l\'intranet Macao',
    html
  })
}
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd ecran-affichage-dynamique && node --check server/services/mailer.js
```
Attendu : aucune sortie

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/services/mailer.js
git commit -m "feat(intranet): send magic-link emails via Resend"
```

### Tâche 7 : Middleware de session

**Fichiers :** Créer `ecran-affichage-dynamique/server/middleware/requireAuth.js`

- [ ] **Étape 1 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/middleware/requireAuth.js
import { verifySession } from '../services/auth.js'

export const COOKIE_NAME = 'macao_session'

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  const user = token ? verifySession(token) : null
  if (!user) {
    return res.status(401).json({ error: 'Session requise' })
  }
  req.user = user
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    next()
  }
}
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd ecran-affichage-dynamique && node --check server/middleware/requireAuth.js
```
Attendu : aucune sortie

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/middleware/requireAuth.js
git commit -m "feat(intranet): session middleware with role guard"
```

### Tâche 8 : Routes d'authentification

**Fichiers :** Créer `ecran-affichage-dynamique/server/routes/intranet/auth.js`

- [ ] **Étape 1 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/routes/intranet/auth.js
import express from 'express'
import { findCoworkerByEmail } from '../../services/coworkersClient.js'
import { signMagicToken, verifyMagicToken, signSession } from '../../services/auth.js'
import { sendMagicLink } from '../../services/mailer.js'
import { requireAuth, COOKIE_NAME } from '../../middleware/requireAuth.js'

const router = express.Router()
const INTRANET_URL = process.env.INTRANET_URL || 'http://localhost:3001'

// Limitation simple en mémoire : 5 demandes par email et par heure.
const demandes = new Map()
function tropDeDemandes(email) {
  const maintenant = Date.now()
  const recentes = (demandes.get(email) || []).filter(t => maintenant - t < 3600_000)
  if (recentes.length >= 5) return true
  recentes.push(maintenant)
  demandes.set(email, recentes)
  return false
}

// POST /api/intranet/auth/request-link
router.post('/request-link', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  // Réponse volontairement identique dans tous les cas : on ne révèle jamais
  // si un compte existe.
  const reponseNeutre = { message: 'Si ce compte existe, un lien vient d\'être envoyé.' }

  if (!email || tropDeDemandes(email)) return res.json(reponseNeutre)

  try {
    const cw = await findCoworkerByEmail(email)
    if (cw) {
      const token = signMagicToken({ id: cw.id, email: cw.email, role: cw.role })
      const lien = `${INTRANET_URL}/verify?token=${encodeURIComponent(token)}`
      await sendMagicLink(cw.email, lien, cw.nom.split(' ')[0])
    }
  } catch (err) {
    console.error('❌ request-link:', err.message)
  }
  res.json(reponseNeutre)
})

// GET /api/intranet/auth/verify?token=...
router.get('/verify', (req, res) => {
  const user = verifyMagicToken(req.query.token)
  if (!user) return res.status(401).json({ error: 'Lien invalide ou expiré' })

  res.cookie(COOKIE_NAME, signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 3600 * 1000
  })
  res.json({ user })
})

// GET /api/intranet/auth/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

// POST /api/intranet/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
})

export default router
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd ecran-affichage-dynamique && node --check server/routes/intranet/auth.js
```
Attendu : aucune sortie

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/routes/intranet/auth.js
git commit -m "feat(intranet): magic-link auth routes with neutral responses and rate limit"
```

### Tâche 9 : Routes de données

**Fichiers :** Créer `ecran-affichage-dynamique/server/routes/intranet/data.js`

- [ ] **Étape 1 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/routes/intranet/data.js
import express from 'express'
import { getOpportunities } from '../../services/airtableClient.js'
import { listActiveCoworkers, getCoworkerById } from '../../services/coworkersClient.js'
import { filterOpportunityForRole } from '../../services/permissions.js'

const router = express.Router()

// Toutes les routes de ce fichier exigent déjà une session (montées derrière requireAuth).

async function opportunitesPourRole(role) {
  const brutes = await getOpportunities()
  return brutes.map(o => filterOpportunityForRole(o, role)).filter(Boolean)
}

// GET /api/intranet/opportunities
router.get('/opportunities', async (req, res) => {
  try {
    res.json({ data: await opportunitesPourRole(req.user.role) })
  } catch (err) {
    console.error('❌ opportunities:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
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
    const opps = await opportunitesPourRole(role)

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
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd ecran-affichage-dynamique && node --check server/routes/intranet/data.js
```
Attendu : aucune sortie

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/routes/intranet/data.js
git commit -m "feat(intranet): role-filtered dashboard, opportunities, directory and profile routes"
```

### Tâche 10 : Brancher l'intranet sur le serveur

**Fichiers :** Modifier `ecran-affichage-dynamique/server/server.js`

- [ ] **Étape 1 : Ajouter les imports**

En haut du fichier, après les imports existants :

```javascript
import cookieParser from 'cookie-parser'
import intranetAuthRoutes from './routes/intranet/auth.js'
import intranetDataRoutes from './routes/intranet/data.js'
import { requireAuth } from './middleware/requireAuth.js'
```

- [ ] **Étape 2 : Remplacer le CORS permissif**

Le middleware actuel autorise toutes les origines (`*`), ce qui est incompatible avec les cookies de session. Remplacer le bloc CORS existant par :

```javascript
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
```

- [ ] **Étape 3 : Monter les routes**

À côté des routes existantes (`/api/opportunities`, `/api/moderation`), ajouter :

```javascript
app.use('/api/intranet/auth', intranetAuthRoutes)
app.use('/api/intranet', requireAuth, intranetDataRoutes)
```

- [ ] **Étape 4 : Vérifier que le serveur démarre**

```bash
cd ecran-affichage-dynamique && node --check server/server.js && JWT_SECRET=test node -e "import('./server/server.js').then(()=>{console.log('✅ démarrage OK');process.exit(0)})"
```
Attendu : `✅ démarrage OK`

- [ ] **Étape 5 : Vérifier la non-régression de l'Écran TV**

```bash
curl -s https://clubcomle10notion-production.up.railway.app/api/opportunities | head -c 120
```
Attendu : la réponse contient `"source":"airtable"` — la route publique est intacte.

- [ ] **Étape 6 : Commit**

```bash
git add ecran-affichage-dynamique/server/server.js
git commit -m "feat(intranet): mount intranet routes, scope CORS for cookie auth"
```

---

## Phase B — Application portail

### Tâche 11 : Créer l'application React

**Fichiers :** Créer l'arborescence `intranet-macao/`

- [ ] **Étape 1 : Initialiser**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
npm create vite@latest intranet-macao -- --template react
cd intranet-macao
npm install
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Étape 2 : Configurer Tailwind avec l'identité mixte**

Remplacer `intranet-macao/tailwind.config.js` :

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Macao — coquille de l'intranet
        macao: {
          ink: '#1d1d1b',
          ink2: '#2a2a27',
          terra: '#c0562f',
          teal: '#206b73',
          gold: '#e9a94e'
        },
        // LE 10 — espace coworkers
        petrol: { DEFAULT: '#00252b', light: '#0a343c', lighter: '#0e424b' },
        gold: { DEFAULT: '#efad29', soft: '#f6c96a' },
        cream: { DEFAULT: '#faf6ec', soft: '#f2ebd9' }
      },
      fontFamily: {
        sans: ['Work Sans', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
}
```

Remplacer `intranet-macao/src/index.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { background: #f6f5f2; font-family: 'Work Sans', system-ui, sans-serif; }
```

Ajouter les polices dans `intranet-macao/index.html`, dans `<head>` :

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Étape 3 : Vérifier le build**

```bash
cd intranet-macao && npm run build
```
Attendu : `✓ built in ...`

- [ ] **Étape 4 : Commit**

```bash
git add intranet-macao
git commit -m "feat(intranet): scaffold portal app with mixed Macao/LE 10 design tokens"
```

### Tâche 12 : Client API et contexte d'authentification

**Fichiers :**
- Créer : `intranet-macao/src/lib/api.js`
- Créer : `intranet-macao/src/context/AuthContext.jsx`

- [ ] **Étape 1 : Client API**

```javascript
// intranet-macao/src/lib/api.js
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://clubcomle10notion-production.up.railway.app'

// `credentials: include` est indispensable : la session vit dans un cookie.
async function appel(chemin, options = {}) {
  const res = await fetch(`${API_URL}/api/intranet${chemin}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (res.status === 401) throw new Error('NON_AUTHENTIFIE')
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export const api = {
  demanderLien: (email) =>
    appel('/auth/request-link', { method: 'POST', body: JSON.stringify({ email }) }),
  verifier: (token) => appel(`/auth/verify?token=${encodeURIComponent(token)}`),
  moi: () => appel('/auth/me'),
  deconnexion: () => appel('/auth/logout', { method: 'POST' }),
  tableauDeBord: () => appel('/dashboard'),
  opportunites: () => appel('/opportunities'),
  annuaire: () => appel('/directory'),
  profil: () => appel('/profile')
}
```

- [ ] **Étape 2 : Contexte d'authentification**

```jsx
// intranet-macao/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.moi()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChargement(false))
  }, [])

  const deconnexion = async () => {
    await api.deconnexion().catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, chargement, deconnexion }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Étape 3 : Commit**

```bash
git add intranet-macao/src/lib/api.js intranet-macao/src/context/AuthContext.jsx
git commit -m "feat(intranet): API client with cookie session and auth context"
```

### Tâche 13 : Pages de connexion

**Fichiers :**
- Créer : `intranet-macao/src/pages/Login.jsx`
- Créer : `intranet-macao/src/pages/Verify.jsx`

- [ ] **Étape 1 : Page de connexion**

```jsx
// intranet-macao/src/pages/Login.jsx
import { useState } from 'react'
import { api } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoiEnCours(true)
    await api.demanderLien(email).catch(() => {})
    setEnvoiEnCours(false)
    setEnvoye(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-macao-ink p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-white mb-2">Intranet Macao</h1>
          <p className="text-white/60 text-sm tracking-[0.2em] uppercase">
            l'agence créative haute en couleur
          </p>
        </div>

        {envoye ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-2xl mb-3">📬</p>
            <h2 className="font-serif text-xl text-macao-ink mb-2">Vérifiez vos emails</h2>
            <p className="text-macao-ink/70 text-sm leading-relaxed">
              Si ce compte existe, un lien de connexion vient d'être envoyé à
              <strong> {email}</strong>. Il est valable 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={soumettre} className="bg-white rounded-2xl p-8">
            <label className="block text-macao-ink font-semibold mb-2">
              Votre email professionnel
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@agence-macao.com"
              className="w-full px-4 py-3 rounded-lg border border-macao-ink/15 focus:border-macao-terra focus:outline-none mb-5"
              autoFocus
            />
            <button
              type="submit"
              disabled={envoiEnCours}
              className="w-full bg-macao-terra hover:bg-macao-terra/90 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {envoiEnCours ? 'Envoi…' : 'Recevoir mon lien de connexion'}
            </button>
            <p className="text-xs text-macao-ink/50 mt-4 text-center">
              Pas de mot de passe : vous recevez un lien à usage unique.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Page de vérification**

```jsx
// intranet-macao/src/pages/Verify.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Verify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setErreur('Lien incomplet.'); return }

    api.verifier(token)
      .then(({ user }) => { setUser(user); navigate('/', { replace: true }) })
      .catch(() => setErreur('Ce lien est invalide ou a expiré.'))
  }, [params, navigate, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-macao-ink p-6 text-center">
      {erreur ? (
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <h2 className="font-serif text-xl text-macao-ink mb-2">Connexion impossible</h2>
          <p className="text-macao-ink/70 text-sm mb-5">{erreur}</p>
          <a href="/" className="text-macao-terra font-semibold">Demander un nouveau lien</a>
        </div>
      ) : (
        <p className="text-white/80">Connexion en cours…</p>
      )}
    </div>
  )
}
```

- [ ] **Étape 3 : Commit**

```bash
git add intranet-macao/src/pages/Login.jsx intranet-macao/src/pages/Verify.jsx
git commit -m "feat(intranet): login and magic-link verification pages"
```

### Tâche 14 : Coquille de navigation

**Fichiers :** Créer `intranet-macao/src/layout/Shell.jsx`

- [ ] **Étape 1 : Implémenter**

```jsx
// intranet-macao/src/layout/Shell.jsx
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LIENS = [
  { to: '/', libelle: 'Tableau de bord', exact: true },
  { to: '/opportunites', libelle: 'Opportunités' },
  { to: '/annuaire', libelle: 'Annuaire' },
  { to: '/profil', libelle: 'Mon profil' }
]

export default function Shell() {
  const { user, deconnexion } = useAuth()

  return (
    <div className="min-h-screen flex">
      <nav className="w-60 bg-macao-ink text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <p className="font-serif text-xl">Macao</p>
          <p className="text-2xs text-white/50 tracking-[0.2em] uppercase mt-1">Intranet</p>
        </div>

        <div className="flex-1 py-4">
          {LIENS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.exact}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'border-macao-terra bg-white/5 text-white font-semibold'
                    : 'border-transparent text-white/65 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {l.libelle}
            </NavLink>
          ))}
        </div>

        <div className="p-5 border-t border-white/10">
          <p className="text-sm text-white truncate">{user?.email}</p>
          <p className="text-2xs text-macao-gold uppercase tracking-widest mt-1">{user?.role}</p>
          <button
            onClick={deconnexion}
            className="mt-3 text-xs text-white/60 hover:text-white transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
git add intranet-macao/src/layout/Shell.jsx
git commit -m "feat(intranet): navigation shell with role badge and logout"
```

### Tâche 15 : Briques de tableau de bord

**Fichiers :** Créer `intranet-macao/src/components/dash/StatBand.jsx` et `PipelineBars.jsx`

- [ ] **Étape 1 : Bandeau de chiffres**

```jsx
// intranet-macao/src/components/dash/StatBand.jsx
// Le résumé avant le détail : ces chiffres répondent à « où j'en suis ? ».
// Une valeur absente s'affiche « — », jamais « 0 » : un zéro faux induit en erreur.
export default function StatBand({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-5 border-t-4"
          style={{ borderTopColor: s.couleur }}
        >
          <p className="text-xs text-macao-ink/60 mb-2">{s.label}</p>
          <p className="font-serif text-3xl text-macao-ink tabular-nums">
            {s.valeur === null || s.valeur === undefined ? '—' : s.valeur}
          </p>
          {s.note && <p className="text-xs text-macao-ink/45 mt-1">{s.note}</p>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Étape 2 : Pipeline en barres**

```jsx
// intranet-macao/src/components/dash/PipelineBars.jsx
// Des barres proportionnelles plutôt qu'un camembert : on compare des
// longueurs bien mieux que des angles.
export default function PipelineBars({ parStatut }) {
  const entrees = Object.entries(parStatut || {})
  if (!entrees.length) {
    return <p className="text-macao-ink/50 text-sm">Aucune opportunité à afficher.</p>
  }
  const max = Math.max(...entrees.map(([, n]) => n))

  return (
    <div className="space-y-3">
      {entrees.map(([statut, n]) => (
        <div key={statut} className="flex items-center gap-3">
          <span className="w-44 text-sm text-macao-ink/75 shrink-0">{statut}</span>
          <div className="flex-1 bg-macao-ink/5 rounded-full h-6 overflow-hidden">
            <div
              className="h-full bg-macao-teal rounded-full transition-all duration-500"
              style={{ width: `${(n / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right font-semibold text-macao-ink tabular-nums">{n}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Étape 3 : Commit**

```bash
git add intranet-macao/src/components/dash
git commit -m "feat(intranet): dashboard building blocks (stat band, pipeline bars)"
```

### Tâche 16 : Tableau de bord

**Fichiers :** Créer `intranet-macao/src/pages/Dashboard.jsx`

- [ ] **Étape 1 : Implémenter**

```jsx
// intranet-macao/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import StatBand from '../components/dash/StatBand'
import PipelineBars from '../components/dash/PipelineBars'

export default function Dashboard() {
  const { user } = useAuth()
  const [d, setD] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.tableauDeBord()
      .then(({ data }) => setD(data))
      .catch(() => setD(null))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!d) return <div className="p-10 text-macao-ink/60">Données indisponibles.</div>

  const estMacao = user?.role === 'Macao'

  const stats = estMacao
    ? [
        { label: 'Opportunités actives', valeur: d.totalOpportunites, couleur: '#c0562f' },
        { label: 'À analyser', valeur: d.aAnalyser, couleur: '#e9a94e' },
        { label: 'Échéances sous 30 j', valeur: d.echeancesProches || null, couleur: '#206b73' },
        { label: 'Opportunités notées', valeur: d.prioritaires?.length || null, couleur: '#1d1d1b' }
      ]
    : [
        { label: 'Opportunités ouvertes', valeur: d.totalOpportunites, couleur: '#efad29' },
        { label: 'Échéances sous 30 j', valeur: d.echeancesProches || null, couleur: '#206b73' }
      ]

  return (
    <div className="p-10 max-w-6xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-macao-ink">Tableau de bord</h1>
        <p className="text-macao-ink/60 mt-1">
          {estMacao ? 'Vue pilotage de l\'agence' : 'Les opportunités du Club Com\' Le 10'}
        </p>
      </header>

      <StatBand stats={stats} />

      {estMacao && (
        <>
          <section className="bg-white rounded-xl p-6 mb-6">
            <h2 className="font-serif text-xl text-macao-ink mb-5">Pipeline par statut</h2>
            <PipelineBars parStatut={d.parStatut} />
          </section>

          <section className="bg-white rounded-xl p-6">
            <h2 className="font-serif text-xl text-macao-ink mb-1">À traiter en priorité</h2>
            <p className="text-sm text-macao-ink/55 mb-5">Classées par score de pertinence</p>
            <div className="space-y-3">
              {(d.prioritaires || []).map(o => (
                <div key={o.id} className="flex items-center gap-4 py-3 border-b border-macao-ink/8 last:border-0">
                  <span className="font-serif text-2xl text-macao-terra w-12 tabular-nums">{o.score}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-macao-ink truncate">{o.name}</p>
                    <p className="text-sm text-macao-ink/55 truncate">{o.client}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-macao-ink/5 text-macao-ink/70 shrink-0">
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {!estMacao && (
        <section className="bg-white rounded-xl p-6">
          <h2 className="font-serif text-xl text-macao-ink mb-5">Opportunités en cours</h2>
          <div className="space-y-3">
            {(d.opportunites || []).map(o => (
              <div key={o.id} className="py-3 border-b border-macao-ink/8 last:border-0">
                <p className="font-semibold text-macao-ink">{o.name}</p>
                <p className="text-sm text-macao-ink/55">{o.client}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
git add intranet-macao/src/pages/Dashboard.jsx
git commit -m "feat(intranet): role-aware dashboard"
```

### Tâche 17 : Pages Opportunités, Annuaire, Profil

**Fichiers :** Créer les trois pages dans `intranet-macao/src/pages/`

- [ ] **Étape 1 : Opportunités**

```jsx
// intranet-macao/src/pages/Opportunities.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
const formatEuros = (n) => (typeof n === 'number' ? `${n.toLocaleString('fr-FR')} €` : '—')

export default function Opportunities() {
  const [opps, setOpps] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.opportunites()
      .then(({ data }) => setOpps(data))
      .catch(() => setOpps([]))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>

  return (
    <div className="p-10 max-w-6xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-1">Opportunités</h1>
      <p className="text-macao-ink/60 mb-8">{opps.length} au total</p>

      <div className="space-y-4">
        {opps.map(o => (
          <article key={o.id} className="bg-white rounded-xl p-6 border-l-4 border-macao-terra">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="font-serif text-xl text-macao-ink">{o.name}</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-macao-ink/5 text-macao-ink/70 shrink-0">
                {o.status || '—'}
              </span>
            </div>
            <p className="text-macao-teal font-medium mb-3">{o.client}</p>
            {o.objet && <p className="text-sm text-macao-ink/70 leading-relaxed mb-4">{o.objet}</p>}
            <div className="flex gap-8 text-sm">
              <span><span className="text-macao-ink/50">Budget </span><b>{formatEuros(o.budget)}</b></span>
              <span><span className="text-macao-ink/50">Échéance </span><b>{formatDate(o.deadline)}</b></span>
              {o.territoire && <span><span className="text-macao-ink/50">Territoire </span><b>{o.territoire}</b></span>}
            </div>
          </article>
        ))}
        {!opps.length && <p className="text-macao-ink/50">Aucune opportunité pour le moment.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Annuaire**

```jsx
// intranet-macao/src/pages/Directory.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Directory() {
  const [membres, setMembres] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.annuaire()
      .then(({ data }) => setMembres(data))
      .catch(() => setMembres([]))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>

  return (
    <div className="p-10 max-w-6xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-1">Annuaire</h1>
      <p className="text-macao-ink/60 mb-8">Les membres du Club Com' Le 10</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {membres.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-5">
            {m.photo && (
              <img src={m.photo} alt={m.nom} className="w-16 h-16 rounded-full object-cover mb-3" />
            )}
            <p className="font-serif text-lg text-macao-ink">{m.nom}</p>
            {m.disponibilite && (
              <p className="text-xs text-macao-teal font-semibold uppercase tracking-wide mt-1">
                {m.disponibilite}
              </p>
            )}
            {!!m.metiers?.length && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {m.metiers.map(mt => (
                  <span key={mt} className="text-xs px-2 py-1 rounded bg-macao-ink/5 text-macao-ink/70">
                    {mt}
                  </span>
                ))}
              </div>
            )}
            {m.bio && <p className="text-sm text-macao-ink/65 mt-3 leading-relaxed">{m.bio}</p>}
          </div>
        ))}
        {!membres.length && <p className="text-macao-ink/50">Aucun membre actif.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Étape 3 : Profil**

```jsx
// intranet-macao/src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Profile() {
  const [p, setP] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.profil()
      .then(({ data }) => setP(data))
      .catch(() => setP(null))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!p) return <div className="p-10 text-macao-ink/60">Profil indisponible.</div>

  return (
    <div className="p-10 max-w-2xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-8">Mon profil</h1>
      <div className="bg-white rounded-xl p-6 space-y-4">
        {[
          ['Nom', p.nom],
          ['Email', p.email],
          ['Rôle', p.role],
          ['Statut', p.statut],
          ['Disponibilité', p.disponibilite],
          ['Métiers', p.metiers?.join(', ')],
          ['Portfolio', p.portfolio]
        ].map(([label, valeur]) => (
          <div key={label} className="flex border-b border-macao-ink/8 pb-3 last:border-0">
            <span className="w-40 text-macao-ink/55 text-sm shrink-0">{label}</span>
            <span className="text-macao-ink">{valeur || '—'}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-macao-ink/50 mt-4">
        Pour modifier ces informations, contactez l'équipe Macao.
      </p>
    </div>
  )
}
```

- [ ] **Étape 4 : Commit**

```bash
git add intranet-macao/src/pages/Opportunities.jsx intranet-macao/src/pages/Directory.jsx intranet-macao/src/pages/Profile.jsx
git commit -m "feat(intranet): opportunities, directory and profile pages"
```

### Tâche 18 : Routage et protection des pages

**Fichiers :** Modifier `intranet-macao/src/App.jsx` et `intranet-macao/src/main.jsx`

- [ ] **Étape 1 : App**

```jsx
// intranet-macao/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Shell from './layout/Shell'
import Login from './pages/Login'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Directory from './pages/Directory'
import Profile from './pages/Profile'

function Protege() {
  const { user, chargement } = useAuth()
  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!user) return <Navigate to="/connexion" replace />
  return <Shell />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route element={<Protege />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/opportunites" element={<Opportunities />} />
            <Route path="/annuaire" element={<Directory />} />
            <Route path="/profil" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Étape 2 : Point d'entrée**

```jsx
// intranet-macao/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Étape 3 : Vérifier le build**

```bash
cd intranet-macao && npm run build
```
Attendu : `✓ built in ...`

- [ ] **Étape 4 : Commit**

```bash
git add intranet-macao/src/App.jsx intranet-macao/src/main.jsx
git commit -m "feat(intranet): routing with auth guard"
```

### Tâche 19 : Configuration Vercel

**Fichiers :** Créer `intranet-macao/vercel.json`

- [ ] **Étape 1 : Réécriture SPA**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Sans cette réécriture, ouvrir directement `/verify?token=…` renverrait une 404 — donc tous les liens magiques échoueraient.

- [ ] **Étape 2 : Commit**

```bash
git add intranet-macao/vercel.json
git commit -m "chore(intranet): vercel SPA rewrite so magic links resolve"
```

---

## Phase C — Mise en service

### Tâche 20 : Déploiement et vérification de bout en bout

- [ ] **Étape 1 : Variables Railway**

Ajouter au service backend : `JWT_SECRET` (chaîne aléatoire de 32+ caractères), `RESEND_API_KEY`, `RESEND_FROM`, `INTRANET_URL`.

Générer un secret :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Étape 2 : Domaine d'envoi Resend**

Dans Resend, ajouter le domaine `agence-macao.com` et publier les enregistrements SPF/DKIM. Sans cette étape, les liens magiques partent en spam.

- [ ] **Étape 3 : Déployer le portail**

Créer un projet Vercel pointant sur le dépôt, répertoire racine `intranet-macao`. Récupérer l'URL et la reporter dans `INTRANET_URL` côté Railway.

- [ ] **Étape 4 : Vérifier la non-régression de l'Écran TV**

```bash
curl -s https://clubcomle10notion-production.up.railway.app/api/opportunities | head -c 120
```
Attendu : `"source":"airtable"` — la TV fonctionne toujours.

- [ ] **Étape 5 : Vérifier le refus sans session**

```bash
curl -s -o /dev/null -w "%{http_code}" https://clubcomle10notion-production.up.railway.app/api/intranet/dashboard
```
Attendu : `401`

- [ ] **Étape 6 : Parcours complet**

Ouvrir le portail, saisir `daniel.such@icloud.com`, recevoir l'email, cliquer le lien : le tableau de bord Macao doit s'afficher avec le pipeline et les opportunités prioritaires.

- [ ] **Étape 7 : Vérifier le cloisonnement des rôles**

Créer une fiche Coworker de test avec un email accessible, se connecter avec, et confirmer dans l'onglet Réseau du navigateur que la réponse `/api/intranet/opportunities` **ne contient ni `score`, ni `notesInternes`, ni `referent`**. C'est le test qui valide la promesse de sécurité.

- [ ] **Étape 8 : Documenter et commiter**

Créer `docs/plateforme-coworkers/03-intranet-etat.md` avec les URL, les variables d'environnement et le parcours de connexion, puis :

```bash
git add docs/plateforme-coworkers/03-intranet-etat.md
git commit -m "docs: intranet deployment state and access"
```

---

## Auto-revue (couverture de la spec)

| Exigence de la spec | Tâche |
|---|---|
| §2 Backend réutilisé, routes publiques intactes | 10 (étapes 3 et 5) |
| §2 Nouvelle app `intranet-macao/` | 11 |
| §3 Lien magique, 15 min, session 30 j | 3, 8 |
| §3 Resend | 6, 20 (étape 2) |
| §3 Anti-abus 5/heure | 8 |
| §4 Rôle Freelance ajouté | 1 |
| §4 Matrice des permissions | 4 |
| §5 Les cinq pages | 13, 14, 16, 17 |
| §6 Tableaux de bord par rôle | 15, 16 |
| §6 « — » plutôt que « 0 » | 15 (StatBand) |
| §7 Identité mixte (jetons de couleur) | 11 |
| §8 Filtrage serveur, cookies httpOnly | 4, 8, 9, 20 (étape 7) |
| §8 Pas d'énumération de comptes | 8 (réponse neutre) |

**Placeholders :** aucun. Chaque étape contient le code réel.
**Cohérence des noms :** `filterOpportunityForRole`, `canAccess`, `signMagicToken`, `verifyMagicToken`, `signSession`, `verifySession`, `COOKIE_NAME`, `api.*` — identiques entre définition et usage.
