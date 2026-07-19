# Module « Dossiers de réponse » — Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** piloter la constitution des dossiers de réponse aux appels d'offres — pièces administratives, mémoire technique, offre financière, dépôt — et rendre visible d'un coup d'œil ce qui manque.

**Architecture :** une nouvelle table Airtable `Dossiers de réponse` reprenant le modèle Notion éprouvé de Macao. Le backend Express expose des routes `/api/intranet/dossiers` filtrées par rôle. Le portail React ajoute trois pages. Aucune route publique n'est touchée.

**Stack :** Node 22 + Express, Airtable REST API, React + Vite + Tailwind, tests `node --test`.

**Spec de référence :** `docs/superpowers/specs/2026-07-19-dossiers-de-reponse-design.md`

---

## Convention d'écriture Airtable — écart assumé

Le code existant écrit **par ID de champ** pour survivre à un renommage. Ici, la table n'existe pas encore : ses IDs sont donc inconnus au moment d'écrire ce plan. Les fonctions d'écriture utiliseront donc les **noms de champs** (l'API Airtable les accepte), avec `typecast: true`.

Conséquence à connaître : renommer une colonne dans Airtable cassera l'écriture. Si cela devient un risque, une passe ultérieure pourra basculer sur les IDs une fois la table créée.

## Structure des fichiers

**Backend** — `ecran-affichage-dynamique/server/`

| Fichier | Responsabilité |
|---|---|
| `services/dossiersClient.js` | Lecture/écriture de la table Dossiers |
| `services/dossiers.js` | **Fonctions pures, testables** : pièces manquantes, dossier bloqué, filtrage par rôle |
| `routes/intranet/data.js` *(modifié)* | Routes `/dossiers*` |
| `tests/dossiers.test.js` | Tests des fonctions pures |

**Frontend** — `intranet-macao/src/`

| Fichier | Responsabilité |
|---|---|
| `lib/api.js` *(modifié)* | Méthodes dossiers |
| `pages/Dossiers.jsx` | Liste (Macao) et « Mes dossiers » (coworker) — une seule page, contenu selon le rôle |
| `pages/DossierDetail.jsx` | Fiche avec les trois chantiers et la check-list |
| `components/ChantierCarte.jsx` | Un chantier avec son état modifiable |
| `components/PiecesChecklist.jsx` | Demandées vs fournies, manquantes en évidence |
| `App.jsx`, `layout/Shell.jsx` *(modifiés)* | Route et entrée de navigation |
| `pages/Opportunities.jsx` *(modifié)* | Bouton « Créer le dossier de réponse » |
| `pages/Dashboard.jsx` *(modifié)* | Trois indicateurs de plus |

---

## Phase A — Données

### Tâche 1 : Créer la table `Dossiers de réponse` dans Airtable

**Base :** `appdJ309q39i4Gr8t`

- [ ] **Étape 1 : Créer la table**

Via le connecteur Airtable (`create_table`) ou l'interface, créer la table **`Dossiers de réponse`** avec ces champs, dans cet ordre. Le premier est le champ principal.

| Champ | Type | Options |
|---|---|---|
| Nom du dossier | singleLineText | |
| Statut dossier | singleSelect | `À créer`, `En préparation`, `Pièces admin en cours`, `Mémoire en cours`, `Offre financière en cours`, `Relecture finale`, `Prêt à déposer`, `Déposé`, `Gagné`, `Perdu`, `Abandonné` |
| Responsable | singleSelect | `Daniel`, `Dominique`, `Mathieu` |
| Mode de réponse | singleSelect | `Macao seul`, `Macao mandataire`, `Macao sous-traitant`, `Cotraitance`, `Groupement Club Com'`, `Prescription simple`, `Accompagnement freelance` |
| Niveau de risque | singleSelect | `Faible`, `Moyen`, `Élevé` |
| Pièces demandées | multipleSelects | `Kbis`, `RIB`, `Attestation URSSAF`, `Attestation fiscale`, `Assurance RC Pro`, `DC1`, `DC2`, `Acte d'engagement`, `Mémoire technique`, `Offre financière` |
| Pièces fournies | multipleSelects | mêmes options que ci-dessus |
| Mémoire technique | singleSelect | `Non commencé`, `Plan créé`, `V1 rédigée`, `En relecture`, `Finalisé`, `Non demandé` |
| Offre financière | singleSelect | `Non commencée`, `En cours`, `À valider`, `Validée`, `Non demandée` |
| Montant proposé | currency | precision 0, symbole `€` |
| Date limite | date | format iso |
| Dépôt | singleSelect | `Non préparé`, `Plateforme identifiée`, `Compte à vérifier`, `En cours`, `Déposé`, `Accusé reçu` |
| Date de dépôt | date | format iso |
| Dossier Drive | url | |
| Check-list finale | multilineText | |
| Questions à poser | multilineText | |
| Réponses reçues | multilineText | |
| Retours acheteur | multilineText | |
| Éléments à réutiliser | multilineText | |
| Références utilisées | multilineText | provisoire — module 3 |
| Notes internes | multilineText | |
| Résultat | singleSelect | `En cours`, `Gagné`, `Perdu`, `Sans suite`, `Abandonné` |

- [ ] **Étape 2 : Ajouter les deux liaisons**

Champs de type `multipleRecordLinks` (à créer après la table, car ils référencent d'autres tables) :
- **Opportunité liée** → table Opportunités `tbl3jvmo4VjUDTkmD`
- **Équipe mobilisée** → table Coworkers `tbl89xazn0oY4A18o`

- [ ] **Étape 3 : Noter l'identifiant de la table**

Relever le `tblXXXXXXXXXXXXXX` retourné et le reporter dans `REPRISE-PROJET.md` (§5, tableau des tables) ainsi que dans la constante `TABLE_DOSSIERS` de la tâche 3.

- [ ] **Étape 4 : Vérifier**

Lister les champs de la table : les 22 champs simples plus les 2 liaisons doivent être présents, et les liaisons réciproques doivent apparaître dans Opportunités et Coworkers.

---

## Phase B — Backend

### Tâche 2 : Fonctions pures (TDD strict)

**Fichiers :**
- Créer : `ecran-affichage-dynamique/server/services/dossiers.js`
- Test : `ecran-affichage-dynamique/tests/dossiers.test.js`

- [ ] **Étape 1 : Écrire le test qui échoue**

```javascript
// ecran-affichage-dynamique/tests/dossiers.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { piecesManquantes, estBloque, filterDossierForRole } from '../server/services/dossiers.js'

const base = {
  id: 'recD1',
  nom: 'Refonte site — Grand Villeneuvois',
  statut: 'En préparation',
  piecesDemandees: ['Kbis', 'RIB', 'DC1'],
  piecesFournies: ['Kbis'],
  memoire: 'V1 rédigée',
  offre: 'En cours',
  dateLimite: '2026-08-01',
  depot: 'Non préparé',
  montantPropose: 30000,
  notesInternes: 'Contact au service achats',
  retoursAcheteur: 'Ils veulent plus de références',
  niveauRisque: 'Moyen'
}

test('les pièces manquantes sont les demandées non fournies', () => {
  assert.deepEqual(piecesManquantes(base), ['RIB', 'DC1'])
})

test('aucune pièce manquante quand tout est fourni', () => {
  assert.deepEqual(
    piecesManquantes({ piecesDemandees: ['Kbis'], piecesFournies: ['Kbis', 'RIB'] }),
    []
  )
})

test('aucune pièce demandée donne une liste vide', () => {
  assert.deepEqual(piecesManquantes({}), [])
})

test('un dossier dont l\'échéance est lointaine n\'est jamais bloqué', () => {
  assert.equal(estBloque({ ...base, dateLimite: '2026-12-31' }, new Date('2026-07-19')), false)
})

test('échéance proche et pièce manquante bloque', () => {
  assert.equal(estBloque({ ...base, dateLimite: '2026-07-22' }, new Date('2026-07-19')), true)
})

test('échéance proche mais tout est prêt ne bloque pas', () => {
  const pret = {
    ...base,
    dateLimite: '2026-07-22',
    piecesFournies: ['Kbis', 'RIB', 'DC1'],
    memoire: 'Finalisé',
    offre: 'Validée'
  }
  assert.equal(estBloque(pret, new Date('2026-07-19')), false)
})

test('un mémoire non demandé ne bloque pas', () => {
  const pret = {
    ...base,
    dateLimite: '2026-07-22',
    piecesFournies: ['Kbis', 'RIB', 'DC1'],
    memoire: 'Non demandé',
    offre: 'Non demandée'
  }
  assert.equal(estBloque(pret, new Date('2026-07-19')), false)
})

test('un dossier sans date limite n\'est pas bloqué', () => {
  assert.equal(estBloque({ ...base, dateLimite: null }, new Date('2026-07-19')), false)
})

test('Macao voit les données commerciales', () => {
  const r = filterDossierForRole(base, 'Macao')
  assert.equal(r.montantPropose, 30000)
  assert.equal(r.notesInternes, 'Contact au service achats')
  assert.equal(r.retoursAcheteur, 'Ils veulent plus de références')
  assert.equal(r.niveauRisque, 'Moyen')
})

test('un Coworker ne reçoit ni montant, ni notes, ni retours, ni risque', () => {
  const r = filterDossierForRole(base, 'Coworker')
  assert.equal(r.montantPropose, undefined)
  assert.equal(r.notesInternes, undefined)
  assert.equal(r.retoursAcheteur, undefined)
  assert.equal(r.niveauRisque, undefined)
  assert.equal(r.nom, 'Refonte site — Grand Villeneuvois')
  assert.deepEqual(r.piecesDemandees, ['Kbis', 'RIB', 'DC1'])
})

test('un Freelance est traité comme un Coworker', () => {
  assert.deepEqual(
    filterDossierForRole(base, 'Freelance'),
    filterDossierForRole(base, 'Coworker')
  )
})

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterDossierForRole(base, 'Inconnu'), null)
})
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd ecran-affichage-dynamique && node --test tests/dossiers.test.js
```
Attendu : ÉCHEC — `Cannot find module '../server/services/dossiers.js'`

⚠️ Utiliser `node --test tests/dossiers.test.js` ou `node --test` seul. `node --test tests/` échoue sur macOS (Node tente de charger le répertoire comme module).

- [ ] **Étape 3 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/dossiers.js
// Fonctions pures du module Dossiers de réponse : aucune I/O, donc testables
// sans réseau. C'est ici que vivent les règles métier.

import { ROLES } from './permissions.js'

// Données commerciales réservées à Macao : elles ne quittent jamais le serveur
// pour un coworker mobilisé sur le dossier.
const CHAMPS_INTERNES = ['montantPropose', 'notesInternes', 'retoursAcheteur', 'niveauRisque']

// Un chantier « non demandé » par l'acheteur est considéré comme réglé.
const MEMOIRE_OK = ['Finalisé', 'Non demandé']
const OFFRE_OK = ['Validée', 'Non demandée']

const JOURS_ALERTE = 7

export function piecesManquantes(dossier) {
  const demandees = dossier?.piecesDemandees || []
  const fournies = dossier?.piecesFournies || []
  return demandees.filter(p => !fournies.includes(p))
}

// Un dossier est « bloqué » si l'échéance approche ET qu'un chantier n'est pas
// prêt. C'est le seul indicateur qui justifie d'ouvrir l'intranet le matin.
export function estBloque(dossier, maintenant = new Date()) {
  if (!dossier?.dateLimite) return false

  const limite = new Date(dossier.dateLimite)
  if (Number.isNaN(limite.getTime())) return false

  const joursRestants = (limite - maintenant) / 86400000
  if (joursRestants < 0 || joursRestants > JOURS_ALERTE) return false

  if (piecesManquantes(dossier).length > 0) return true
  if (!MEMOIRE_OK.includes(dossier.memoire)) return true
  if (!OFFRE_OK.includes(dossier.offre)) return true
  return false
}

export function filterDossierForRole(dossier, role) {
  if (!ROLES.includes(role)) return null
  if (role === 'Macao') return dossier

  const copie = { ...dossier }
  for (const champ of CHAMPS_INTERNES) delete copie[champ]
  return copie
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

```bash
cd ecran-affichage-dynamique && node --test tests/dossiers.test.js
```
Attendu : `# pass 12`

- [ ] **Étape 5 : Vérifier la non-régression**

```bash
cd ecran-affichage-dynamique && node --test
```
Attendu : `pass 23` (11 existants + 12 nouveaux), `fail 0`

- [ ] **Étape 6 : Commit**

```bash
git add ecran-affichage-dynamique/server/services/dossiers.js ecran-affichage-dynamique/tests/dossiers.test.js
git commit -m "feat(dossiers): pure business rules — missing pieces, blocked detection, role filtering"
```

### Tâche 3 : Client Airtable des dossiers

**Fichier :** Créer `ecran-affichage-dynamique/server/services/dossiersClient.js`

- [ ] **Étape 1 : Implémenter**

Remplacer `TABLE_DOSSIERS` par l'identifiant relevé à la tâche 1, étape 3.

```javascript
// ecran-affichage-dynamique/server/services/dossiersClient.js
const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
// ⚠️ Remplacer par l'identifiant réel relevé à la création de la table.
const TABLE_DOSSIERS = process.env.AIRTABLE_TABLE_DOSSIERS || 'tblDOSSIERS_A_REMPLACER'

async function airtableRequest(chemin, options = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${chemin}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || data?.error?.type || `HTTP ${res.status}`)
  return data
}

function mapDossier(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom du dossier'] || 'Sans titre',
    statut: f['Statut dossier'] || null,
    responsable: f['Responsable'] || null,
    modeReponse: f['Mode de réponse'] || null,
    niveauRisque: f['Niveau de risque'] || null,
    piecesDemandees: f['Pièces demandées'] || [],
    piecesFournies: f['Pièces fournies'] || [],
    memoire: f['Mémoire technique'] || 'Non commencé',
    offre: f['Offre financière'] || 'Non commencée',
    montantPropose: typeof f['Montant proposé'] === 'number' ? f['Montant proposé'] : null,
    dateLimite: f['Date limite'] || null,
    depot: f['Dépôt'] || 'Non préparé',
    dateDepot: f['Date de dépôt'] || null,
    drive: f['Dossier Drive'] || null,
    checklist: f['Check-list finale'] || null,
    questions: f['Questions à poser'] || null,
    reponsesRecues: f['Réponses reçues'] || null,
    retoursAcheteur: f['Retours acheteur'] || null,
    elementsAReutiliser: f['Éléments à réutiliser'] || null,
    referencesUtilisees: f['Références utilisées'] || null,
    notesInternes: f['Notes internes'] || null,
    resultat: f['Résultat'] || null,
    opportuniteIds: f['Opportunité liée'] || [],
    equipeIds: f['Équipe mobilisée'] || []
  }
}

export async function listDossiers() {
  let records = []
  let offset
  do {
    const params = new URLSearchParams({ pageSize: '100' })
    if (offset) params.append('offset', offset)
    const data = await airtableRequest(`${TABLE_DOSSIERS}?${params}`)
    records = records.concat(data.records || [])
    offset = data.offset
  } while (offset)
  return records.map(mapDossier)
}

export async function getDossier(id) {
  return mapDossier(await airtableRequest(`${TABLE_DOSSIERS}/${id}`))
}

// Écriture par NOM de champ (l'API Airtable l'accepte) : voir la note
// « Convention d'écriture Airtable » du plan.
export async function creerDossier(champs) {
  const data = await airtableRequest(TABLE_DOSSIERS, {
    method: 'POST',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapDossier(data)
}

export async function majDossier(id, champs) {
  const data = await airtableRequest(`${TABLE_DOSSIERS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapDossier(data)
}
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd ecran-affichage-dynamique && node --check server/services/dossiersClient.js
```
Attendu : aucune sortie

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/services/dossiersClient.js
git commit -m "feat(dossiers): Airtable client for response dossiers"
```

### Tâche 4 : Routes intranet

**Fichier :** Modifier `ecran-affichage-dynamique/server/routes/intranet/data.js`

- [ ] **Étape 1 : Ajouter les imports**

En haut du fichier, après les imports existants :

```javascript
import { listDossiers, getDossier, creerDossier, majDossier } from '../../services/dossiersClient.js'
import { piecesManquantes, estBloque, filterDossierForRole } from '../../services/dossiers.js'
```

`requireRole` est déjà importé depuis `../../middleware/requireAuth.js` (utilisé par les routes de statut d'opportunité). Vérifier sa présence dans les imports ; l'ajouter sinon.

- [ ] **Étape 2 : Ajouter les routes**

```javascript
// Enrichit chaque dossier de ce que le front afficherait sinon en recalculant :
// les pièces manquantes et l'alerte de blocage.
function enrichir(d) {
  return { ...d, piecesManquantes: piecesManquantes(d), bloque: estBloque(d) }
}

// GET /api/intranet/dossiers
// Macao voit tout ; un coworker ne voit que les dossiers où il est mobilisé.
router.get('/dossiers', async (req, res) => {
  try {
    const tous = await listDossiers()
    const visibles = req.user.role === 'Macao'
      ? tous
      : tous.filter(d => (d.equipeIds || []).includes(req.user.id))

    res.json({
      data: visibles
        .map(d => filterDossierForRole(enrichir(d), req.user.role))
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
    if (!d) return res.status(404).json({ error: 'Dossier introuvable' })

    // Un coworker non mobilisé se voit refuser l'accès côté serveur.
    if (req.user.role !== 'Macao' && !(d.equipeIds || []).includes(req.user.id)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    res.json({ data: filterDossierForRole(enrichir(d), req.user.role) })
  } catch (err) {
    console.error('❌ dossier:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// POST /api/intranet/opportunities/:id/dossier — créer le dossier (Macao)
router.post('/opportunities/:id/dossier', requireRole('Macao'), async (req, res) => {
  try {
    const existants = await listDossiers()
    const deja = existants.find(d => (d.opportuniteIds || []).includes(req.params.id))
    if (deja) return res.status(409).json({ error: 'Un dossier existe déjà', data: deja })

    const opps = await getAllOpportunities()
    const opp = opps.find(o => o.id === req.params.id)
    if (!opp) return res.status(404).json({ error: 'Opportunité introuvable' })

    const cree = await creerDossier({
      'Nom du dossier': opp.name,
      'Opportunité liée': [opp.id],
      'Date limite': opp.deadline || undefined,
      'Statut dossier': 'En préparation',
      'Résultat': 'En cours'
    })
    res.json({ data: enrichir(cree) })
  } catch (err) {
    console.error('❌ création dossier:', err.message)
    res.status(500).json({ error: 'Impossible de créer le dossier' })
  }
})

// PATCH /api/intranet/dossiers/:id — mettre à jour un chantier (Macao)
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

  const champs = {}
  for (const [cle, colonne] of Object.entries(AUTORISES)) {
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
```

`getAllOpportunities` doit être présent dans les imports du fichier — l'ajouter à l'import existant de `../../services/airtableClient.js` s'il manque.

- [ ] **Étape 3 : Vérifier la syntaxe et les tests**

```bash
cd ecran-affichage-dynamique && node --check server/routes/intranet/data.js && node --test
```
Attendu : aucune sortie du `--check`, puis `pass 23, fail 0`

- [ ] **Étape 4 : Vérifier que le serveur démarre et que l'Écran TV répond**

```bash
cd ecran-affichage-dynamique && env -u RESEND_API_KEY JWT_SECRET=test PORT=5271 AIRTABLE_TOKEN=faux node server/server.js &
# attendre le démarrage, puis :
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5271/api/health          # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5271/api/intranet/dossiers # 401
# puis tuer le process
```

- [ ] **Étape 5 : Commit**

```bash
git add ecran-affichage-dynamique/server/routes/intranet/data.js
git commit -m "feat(dossiers): role-filtered dossier routes, creation from opportunity, chantier updates"
```

### Tâche 5 : Indicateurs du tableau de bord

**Fichier :** Modifier `ecran-affichage-dynamique/server/routes/intranet/data.js`, route `GET /dashboard`

- [ ] **Étape 1 : Enrichir la réponse Macao**

Dans le bloc réservé au rôle Macao (celui qui calcule `aAnalyser`, `parStatut` et `prioritaires`), ajouter avant la réponse :

```javascript
    // Indicateurs dossiers : uniquement pour Macao.
    const dossiers = (await listDossiers()).map(enrichir)
    const dansSeptJours = Date.now() + 7 * 86400000
    const dossiersEnCours = dossiers.filter(d => d.resultat === 'En cours').length
    const aDeposer = dossiers.filter(d => {
      if (!d.dateLimite) return false
      const t = new Date(d.dateLimite).getTime()
      return t >= Date.now() && t <= dansSeptJours &&
             !['Déposé', 'Accusé reçu'].includes(d.depot)
    }).length
    const dossiersBloques = dossiers.filter(d => d.bloque).length
```

Puis ajouter `dossiersEnCours`, `aDeposer` et `dossiersBloques` à l'objet renvoyé pour le rôle Macao.

- [ ] **Étape 2 : Vérifier**

```bash
cd ecran-affichage-dynamique && node --check server/routes/intranet/data.js && node --test
```
Attendu : `pass 23, fail 0`

- [ ] **Étape 3 : Commit**

```bash
git add ecran-affichage-dynamique/server/routes/intranet/data.js
git commit -m "feat(dossiers): dashboard indicators for in-progress, due and blocked dossiers"
```

---

## Phase C — Portail

### Tâche 6 : Méthodes API

**Fichier :** Modifier `intranet-macao/src/lib/api.js`

- [ ] **Étape 1 : Ajouter les méthodes**

Dans l'objet `api`, après les méthodes existantes :

```javascript
  // Dossiers de réponse
  dossiers: () => appel('/dossiers'),
  dossier: (id) => appel(`/dossiers/${id}`),
  creerDossier: (opportuniteId) =>
    appel(`/opportunities/${opportuniteId}/dossier`, { method: 'POST' }),
  majDossier: (id, champs) =>
    appel(`/dossiers/${id}`, { method: 'PATCH', body: JSON.stringify(champs) })
```

- [ ] **Étape 2 : Commit**

```bash
git add intranet-macao/src/lib/api.js
git commit -m "feat(dossiers): API client methods"
```

### Tâche 7 : Composants réutilisables

**Fichiers :**
- Créer : `intranet-macao/src/components/PiecesChecklist.jsx`
- Créer : `intranet-macao/src/components/ChantierCarte.jsx`

- [ ] **Étape 1 : Check-list des pièces**

```jsx
// intranet-macao/src/components/PiecesChecklist.jsx
// Demandées vs fournies. Ce qui manque est mis en évidence : c'est
// l'information qui fait rater un dépôt.
export default function PiecesChecklist({ demandees = [], fournies = [], onBasculer }) {
  if (!demandees.length) {
    return <p className="text-macao-ink/50 text-sm">Aucune pièce demandée renseignée.</p>
  }

  return (
    <ul className="space-y-2">
      {demandees.map(piece => {
        const fournie = fournies.includes(piece)
        return (
          <li key={piece} className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBasculer ? () => onBasculer(piece) : undefined}
              disabled={!onBasculer}
              className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 ${
                fournie
                  ? 'bg-macao-teal border-macao-teal text-white'
                  : 'border-macao-terra bg-white'
              } ${onBasculer ? 'cursor-pointer' : 'cursor-default'}`}
              aria-label={fournie ? `${piece} fournie` : `${piece} manquante`}
            >
              {fournie ? '✓' : ''}
            </button>
            <span className={fournie ? 'text-macao-ink/70' : 'text-macao-terra font-semibold'}>
              {piece}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Étape 2 : Carte de chantier**

```jsx
// intranet-macao/src/components/ChantierCarte.jsx
// Un des trois chantiers d'un dossier, avec son état modifiable.
export default function ChantierCarte({ titre, valeur, options, couleur, onChanger, enCours }) {
  return (
    <div className="bg-white rounded-xl p-5 border-t-4" style={{ borderTopColor: couleur }}>
      <p className="text-xs text-macao-ink/60 mb-2">{titre}</p>
      {onChanger ? (
        <select
          value={valeur || ''}
          disabled={enCours}
          onChange={(e) => onChanger(e.target.value)}
          className="w-full bg-transparent font-serif text-lg text-macao-ink border border-macao-ink/15 rounded-lg px-3 py-2 disabled:opacity-50"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <p className="font-serif text-lg text-macao-ink">{valeur || '—'}</p>
      )}
    </div>
  )
}
```

- [ ] **Étape 3 : Commit**

```bash
git add intranet-macao/src/components/PiecesChecklist.jsx intranet-macao/src/components/ChantierCarte.jsx
git commit -m "feat(dossiers): pieces checklist and chantier card components"
```

### Tâche 8 : Page liste des dossiers

**Fichier :** Créer `intranet-macao/src/pages/Dossiers.jsx`

Une seule page sert les deux rôles : le serveur a déjà filtré ce que l'utilisateur peut voir.

- [ ] **Étape 1 : Implémenter**

```jsx
// intranet-macao/src/pages/Dossiers.jsx
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { useAuth } from '../context/AuthContext'
import { formaterDate } from '../lib/format'

export default function Dossiers() {
  const { user } = useAuth()
  const { donnees, chargement, erreur } = useRequete(api.dossiers)

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (erreur) return <div className="p-10 text-macao-ink/60">Impossible de charger les dossiers.</div>

  const dossiers = donnees || []
  const estMacao = user?.role === 'Macao'

  return (
    <div className="p-10 max-w-6xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-1">
        {estMacao ? 'Dossiers de réponse' : 'Mes dossiers'}
      </h1>
      <p className="text-macao-ink/60 mb-8">
        {estMacao
          ? `${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''}`
          : 'Les dossiers sur lesquels vous êtes mobilisé'}
      </p>

      <div className="space-y-4">
        {dossiers.map(d => (
          <Link
            key={d.id}
            to={`/dossiers/${d.id}`}
            className={`block bg-white rounded-xl p-6 border-l-4 hover:shadow-md transition-shadow ${
              d.bloque ? 'border-macao-terra' : 'border-macao-teal'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="font-serif text-xl text-macao-ink">{d.nom}</h2>
              {d.bloque && (
                <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white shrink-0">
                  À traiter
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span><span className="text-macao-ink/50">Statut </span><b>{d.statut || '—'}</b></span>
              <span><span className="text-macao-ink/50">Échéance </span><b>{formaterDate(d.dateLimite)}</b></span>
              <span>
                <span className="text-macao-ink/50">Pièces </span>
                <b className={d.piecesManquantes?.length ? 'text-macao-terra' : ''}>
                  {d.piecesManquantes?.length
                    ? `${d.piecesManquantes.length} manquante${d.piecesManquantes.length > 1 ? 's' : ''}`
                    : 'complètes'}
                </b>
              </span>
              <span><span className="text-macao-ink/50">Mémoire </span><b>{d.memoire}</b></span>
              <span><span className="text-macao-ink/50">Offre </span><b>{d.offre}</b></span>
            </div>
          </Link>
        ))}

        {!dossiers.length && (
          <p className="text-macao-ink/50">
            {estMacao
              ? 'Aucun dossier. Créez-en un depuis une opportunité passée en GO.'
              : 'Vous n\'êtes mobilisé sur aucun dossier pour le moment.'}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
git add intranet-macao/src/pages/Dossiers.jsx
git commit -m "feat(dossiers): dossier list page for both roles"
```

### Tâche 9 : Fiche dossier

**Fichier :** Créer `intranet-macao/src/pages/DossierDetail.jsx`

- [ ] **Étape 1 : Implémenter**

```jsx
// intranet-macao/src/pages/DossierDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formaterDate, formaterBudget, ouTiret } from '../lib/format'
import ChantierCarte from '../components/ChantierCarte'
import PiecesChecklist from '../components/PiecesChecklist'

const ETATS_MEMOIRE = ['Non commencé', 'Plan créé', 'V1 rédigée', 'En relecture', 'Finalisé', 'Non demandé']
const ETATS_OFFRE = ['Non commencée', 'En cours', 'À valider', 'Validée', 'Non demandée']
const ETATS_DEPOT = ['Non préparé', 'Plateforme identifiée', 'Compte à vérifier', 'En cours', 'Déposé', 'Accusé reçu']

export default function DossierDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [d, setD] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)

  const estMacao = user?.role === 'Macao'

  useEffect(() => {
    api.dossier(id)
      .then(({ data }) => setD(data))
      .catch(() => setD(null))
      .finally(() => setChargement(false))
  }, [id])

  const modifier = async (champs) => {
    setEnCours(true)
    setErreur(null)
    try {
      const { data } = await api.majDossier(id, champs)
      setD(data)
    } catch {
      setErreur('La modification n\'a pas pu être enregistrée.')
    } finally {
      setEnCours(false)
    }
  }

  const basculerPiece = (piece) => {
    const actuelles = d.piecesFournies || []
    const nouvelles = actuelles.includes(piece)
      ? actuelles.filter(p => p !== piece)
      : [...actuelles, piece]
    modifier({ piecesFournies: nouvelles })
  }

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!d) return <div className="p-10 text-macao-ink/60">Dossier indisponible.</div>

  return (
    <div className="p-10 max-w-5xl">
      <Link to="/dossiers" className="text-sm text-macao-teal mb-4 inline-block">← Tous les dossiers</Link>

      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-3xl text-macao-ink">{d.nom}</h1>
        {d.bloque && (
          <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white shrink-0">
            À traiter
          </span>
        )}
      </div>
      <p className="text-macao-ink/60 mb-8">
        Échéance {formaterDate(d.dateLimite)} · Statut {ouTiret(d.statut)}
      </p>

      {erreur && <p className="text-macao-terra text-sm mb-4">{erreur}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ChantierCarte
          titre="Mémoire technique" valeur={d.memoire} options={ETATS_MEMOIRE}
          couleur="#c0562f" enCours={enCours}
          onChanger={estMacao ? (v) => modifier({ memoire: v }) : null}
        />
        <ChantierCarte
          titre="Offre financière" valeur={d.offre} options={ETATS_OFFRE}
          couleur="#e9a94e" enCours={enCours}
          onChanger={estMacao ? (v) => modifier({ offre: v }) : null}
        />
        <ChantierCarte
          titre="Dépôt" valeur={d.depot} options={ETATS_DEPOT}
          couleur="#206b73" enCours={enCours}
          onChanger={estMacao ? (v) => modifier({ depot: v }) : null}
        />
      </div>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-1">Pièces administratives</h2>
        <p className="text-sm text-macao-ink/55 mb-4">
          {d.piecesManquantes?.length
            ? `${d.piecesManquantes.length} pièce(s) manquante(s)`
            : 'Toutes les pièces demandées sont fournies'}
        </p>
        <PiecesChecklist
          demandees={d.piecesDemandees}
          fournies={d.piecesFournies}
          onBasculer={estMacao ? basculerPiece : null}
        />
      </section>

      <section className="bg-white rounded-xl p-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Informations</h2>
        <div className="space-y-3">
          {[
            ['Responsable', d.responsable],
            ['Mode de réponse', d.modeReponse],
            ['Date de dépôt', d.dateDepot ? formaterDate(d.dateDepot) : null],
            ['Dossier Drive', d.drive],
            ...(estMacao ? [
              ['Montant proposé', d.montantPropose != null ? formaterBudget(d.montantPropose) : null],
              ['Niveau de risque', d.niveauRisque],
              ['Retours acheteur', d.retoursAcheteur],
              ['Notes internes', d.notesInternes]
            ] : [])
          ].map(([label, valeur]) => (
            <div key={label} className="flex border-b border-macao-ink/8 pb-3 last:border-0">
              <span className="w-44 text-macao-ink/55 text-sm shrink-0">{label}</span>
              <span className="text-macao-ink">{ouTiret(valeur)}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-macao-ink/50 mt-4">
          Les textes longs (questions, éléments à réutiliser) se saisissent dans Airtable.
        </p>
      </section>
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
git add intranet-macao/src/pages/DossierDetail.jsx
git commit -m "feat(dossiers): dossier detail page with three chantiers and pieces checklist"
```

### Tâche 10 : Navigation et routage

**Fichiers :** Modifier `intranet-macao/src/App.jsx` et `intranet-macao/src/layout/Shell.jsx`

- [ ] **Étape 1 : Routes**

Dans `App.jsx`, importer les deux pages et ajouter, à l'intérieur du bloc protégé :

```jsx
<Route path="/dossiers" element={<Dossiers />} />
<Route path="/dossiers/:id" element={<DossierDetail />} />
```

Imports à ajouter en haut :

```jsx
import Dossiers from './pages/Dossiers'
import DossierDetail from './pages/DossierDetail'
```

- [ ] **Étape 2 : Entrée de navigation**

Dans `Shell.jsx`, ajouter dans le tableau `LIENS`, entre « Opportunités » et « Annuaire » :

```javascript
  { to: '/dossiers', libelle: 'Dossiers' },
```

- [ ] **Étape 3 : Vérifier le build**

```bash
cd intranet-macao && npm run build
```
Attendu : `✓ built in ...`

- [ ] **Étape 4 : Commit**

```bash
git add intranet-macao/src/App.jsx intranet-macao/src/layout/Shell.jsx
git commit -m "feat(dossiers): routing and navigation entry"
```

### Tâche 11 : Bouton de création depuis une opportunité

**Fichier :** Modifier `intranet-macao/src/pages/Opportunities.jsx`

- [ ] **Étape 1 : Ajouter le bouton**

Sur chaque carte d'opportunité, **uniquement si `user.role === 'Macao'`**, ajouter un bouton « Créer le dossier de réponse ». Au clic, appeler `api.creerDossier(opp.id)` puis rediriger vers `/dossiers/{id du dossier créé}` avec `useNavigate`.

Gérer les trois cas :
- succès → redirection vers la fiche du dossier
- réponse **409** (« Un dossier existe déjà ») → afficher « Un dossier existe déjà pour cette opportunité » sous le bouton
- autre erreur → afficher « La création a échoué »

Pendant l'appel, désactiver le bouton et afficher « Création… ».

Le style suit celui du bouton « Ça m'intéresse » existant sur cette page.

- [ ] **Étape 2 : Vérifier le build**

```bash
cd intranet-macao && npm run build
```
Attendu : `✓ built in ...`

- [ ] **Étape 3 : Commit**

```bash
git add intranet-macao/src/pages/Opportunities.jsx
git commit -m "feat(dossiers): create dossier from an opportunity"
```

### Tâche 12 : Indicateurs du tableau de bord (portail)

**Fichier :** Modifier `intranet-macao/src/pages/Dashboard.jsx`

- [ ] **Étape 1 : Ajouter une seconde bande d'indicateurs**

Pour le rôle Macao uniquement, sous la bande existante, ajouter un `StatBand` avec :

```javascript
const statsDossiers = [
  { label: 'Dossiers en cours', valeur: d.dossiersEnCours ?? null, couleur: '#206b73' },
  { label: 'À déposer sous 7 j', valeur: d.aDeposer || null, couleur: '#e9a94e' },
  { label: 'Dossiers bloqués', valeur: d.dossiersBloques || null, couleur: '#c0562f' }
]
```

Précéder la bande d'un intertitre « Dossiers de réponse » pour distinguer les deux séries.

Rappel de la règle d'affichage : `null` produit « — », jamais « 0 ».

- [ ] **Étape 2 : Vérifier le build**

```bash
cd intranet-macao && npm run build
```
Attendu : `✓ built in ...`

- [ ] **Étape 3 : Commit**

```bash
git add intranet-macao/src/pages/Dashboard.jsx
git commit -m "feat(dossiers): dashboard indicators on the portal"
```

---

## Phase D — Mise en service

### Tâche 13 : Déployer et vérifier

- [ ] **Étape 1 : Vérifier l'ensemble avant fusion**

```bash
cd ecran-affichage-dynamique && node --test          # pass 23, fail 0
cd ../intranet-macao && npm run build                 # ✓ built
```

- [ ] **Étape 2 : Fusionner et pousser**

Si le travail a été fait sur une branche, la fusionner dans `main`. C'est cette fusion qui déclenche les déploiements Railway et Vercel.

- [ ] **Étape 3 : Vérifier la non-régression de l'Écran TV**

```bash
curl -s https://clubcomle10notion-production.up.railway.app/api/opportunities | head -c 80
```
Attendu : la réponse contient `"source"` — la TV fonctionne toujours.

- [ ] **Étape 4 : Vérifier le refus sans session**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/intranet/dossiers
```
Attendu : `401`

- [ ] **Étape 5 : Parcours complet dans le navigateur**

Se connecter à l'intranet en tant que Macao, ouvrir une opportunité au statut GO, cliquer **« Créer le dossier de réponse »**, vérifier la redirection vers la fiche, changer l'état du mémoire technique, cocher une pièce fournie, et constater dans Airtable que les valeurs sont bien enregistrées.

- [ ] **Étape 6 : Vérifier le cloisonnement des rôles**

Avec un compte Coworker **non mobilisé** sur un dossier : `GET /api/intranet/dossiers` ne doit pas le renvoyer, et `GET /api/intranet/dossiers/{id}` doit répondre **403**. Avec un coworker **mobilisé** : le dossier apparaît, et la réponse ne contient **ni `montantPropose`, ni `notesInternes`, ni `retoursAcheteur`, ni `niveauRisque`**. C'est le test qui valide la promesse de confidentialité.

- [ ] **Étape 7 : Documenter**

Ajouter la table `Dossiers de réponse` et son identifiant au tableau des tables de `REPRISE-PROJET.md` (§5), et cocher le module 2 dans la feuille de route (§12).

```bash
git add REPRISE-PROJET.md
git commit -m "docs: record dossiers table and mark module 2 done"
```

---

## Auto-revue (couverture de la spec)

| Exigence de la spec | Tâche |
|---|---|
| §3 Modèle complet des 24 champs | 1 |
| §3 Pièces demandées vs fournies | 1, 2, 7, 9 |
| §4 Création depuis une opportunité, un seul dossier | 4 (409), 11 |
| §5 Page liste, les deux rôles | 8 |
| §5 Fiche avec les trois chantiers | 9 |
| §5 Check-list, manquantes en évidence | 7, 9 |
| §6 Filtrage serveur des champs commerciaux | 2, 4 |
| §6 Coworker limité à ses dossiers, 403 sinon | 4 |
| §6 Création et modification réservées à Macao | 4 (`requireRole`) |
| §7 Trois indicateurs, règle du « bloqué » | 2 (`estBloque`), 5, 12 |
| §9 Risque de double saisie de la date | documenté dans la spec, recopie à la création (tâche 4) |

**Placeholders :** un seul, explicite et incontournable — `TABLE_DOSSIERS` à la tâche 3, dont la valeur n'existe qu'après la création de la table à la tâche 1. L'étape 3 de la tâche 1 impose de la relever.

**Cohérence des noms :** `piecesManquantes`, `estBloque`, `filterDossierForRole`, `listDossiers`, `getDossier`, `creerDossier`, `majDossier`, `enrichir` — identiques entre définition et usage. Les propriétés du dossier (`memoire`, `offre`, `depot`, `piecesFournies`, `montantPropose`, `notesInternes`, `retoursAcheteur`, `niveauRisque`) sont identiques du mappeur Airtable aux composants React.
