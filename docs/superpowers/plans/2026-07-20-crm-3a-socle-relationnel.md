# CRM 3a — Socle relationnel : Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** faire de l'organisation une entité à part entière — identité, interlocuteurs, historique calculé, état de la relation — sans toucher au champ texte que lit l'Écran TV.

**Architecture :** deux nouvelles tables Airtable (`Organisations`, `Interlocuteurs`) et un champ de liaison ajouté aux Opportunités. Le backend Express expose `/api/intranet/organisations`, réservé à Macao, et calcule l'historique côté serveur. Le portail React ajoute une page liste et une fiche.

**Stack :** Node 22 + Express, Airtable REST API, React + Vite + Tailwind, tests `node --test`.

**Spec de référence :** `docs/superpowers/specs/2026-07-20-crm-3a-socle-relationnel-design.md`
**Cadre :** `docs/superpowers/specs/2026-07-20-crm-agence-vision.md`

---

## Rappels de contexte

**⚠️ L'Écran TV est affiché en permanence dans les locaux du client.** Le champ `Acheteur / client` (`fldE3qVHBzp7GvYxk`) sur Opportunités est lu par `estAffichable()` dans `server/services/airtableClient.js`, qui refuse toute opportunité sans acheteur. **Ce champ ne doit être ni renommé, ni converti, ni vidé.**

**Convention d'écriture Airtable.** Comme pour la table Dossiers, les nouvelles tables s'écrivent par **nom de champ** (l'API l'accepte), leurs identifiants de colonnes n'étant pas connus à la rédaction. Renommer une colonne cassera l'écriture — c'est documenté dans `REPRISE-PROJET.md`.

**Identifiants existants :** base `appdJ309q39i4Gr8t` · Opportunités `tbl3jvmo4VjUDTkmD` · Dossiers de réponse `tblp59OuT0dDNFuc1` · Coworkers `tbl89xazn0oY4A18o`.

**⚠️ `node --test tests/` échoue sur cette machine.** Utiliser `node --test` seul, ou `node --test tests/fichier.test.js`.

## Structure des fichiers

**Backend** — `ecran-affichage-dynamique/server/`

| Fichier | Responsabilité |
|---|---|
| `services/organisations.js` | **Fonctions pures** : historique, filtrage par rôle |
| `services/organisationsClient.js` | Lecture/écriture Organisations et Interlocuteurs |
| `routes/intranet/data.js` *(modifié)* | Routes `/organisations*`, indicateur du tableau de bord |
| `tests/organisations.test.js` | Tests des fonctions pures |

**Frontend** — `intranet-macao/src/`

| Fichier | Responsabilité |
|---|---|
| `lib/api.js` *(modifié)* | Méthodes organisations |
| `pages/Organisations.jsx` | Liste |
| `pages/OrganisationDetail.jsx` | Fiche : identité, relation, interlocuteurs, historique |
| `App.jsx`, `layout/Shell.jsx` *(modifiés)* | Route et navigation |
| `pages/Opportunities.jsx` *(modifié)* | Lien vers la fiche de l'organisation |
| `pages/Dashboard.jsx` *(modifié)* | Indicateur « sans organisation rattachée » |

---

## Phase A — Données

### Tâche 1 : Créer les deux tables et la liaison

**Base :** `appdJ309q39i4Gr8t`

- [ ] **Étape 1 : Créer la table `Organisations`**

Champs, dans cet ordre. Le premier est le champ principal.

| Champ | Type | Options |
|---|---|---|
| Nom | singleLineText | |
| Nature | singleSelect | `Publique`, `Privée`, `Association` |
| Type | singleSelect | `Commune`, `Communauté d'agglomération`, `Communauté de communes`, `Département`, `Région`, `Bailleur social`, `Établissement public`, `Association`, `Entreprise`, `Autre` |
| Commune | singleLineText | |
| Code postal | singleLineText | texte, jamais number : les codes commençant par 0 |
| Territoire | singleSelect | `Agen`, `Lot-et-Garonne (47)`, `Nouvelle-Aquitaine`, `Occitanie`, `National`, `Autre` |
| SIRET | singleLineText | |
| Site web | url | |
| Niveau de relation | singleSelect | `Jamais contacté`, `Contact pris`, `En discussion`, `Déjà client`, `Client récurrent` |
| Origine | singleSelect | `Appel d'offres`, `Prospection`, `Recommandation`, `Réseau`, `Entrant`, `Autre` |
| Référent Macao | singleSelect | `Daniel`, `Dominique`, `Mathieu` |
| Dernier échange | date | format iso |
| Plateforme de publication | singleSelect | `AWS Marchés publics`, `e-marchespublics.com`, `Achatpublic.com`, `PLACE (État)`, `Marchés Sécurisés`, `Site propre`, `Autre`, `Inconnue` |
| Particularités administratives | multilineText | |
| Notes | multilineText | |

- [ ] **Étape 2 : Créer la table `Interlocuteurs`**

| Champ | Type | Options |
|---|---|---|
| Nom complet | singleLineText | |
| Fonction | singleLineText | |
| Email | email | |
| Téléphone | phoneNumber | |
| Opposition à la prospection | checkbox | icon `check`, color `redBright` |
| Notes | multilineText | |

- [ ] **Étape 3 : Créer les trois liaisons**

Champs `multipleRecordLinks`, à créer après les tables :
- Sur **Interlocuteurs** : `Organisation` → table Organisations
- Sur **Opportunités** (`tbl3jvmo4VjUDTkmD`) : `Organisation` → table Organisations

La liaison réciproque `Opportunités` apparaît automatiquement sur Organisations ; vérifier son nom et le renommer en `Opportunités` s'il diffère. Idem pour `Interlocuteurs`.

⚠️ **Ne toucher à aucun autre champ d'Opportunités.** En particulier, `Acheteur / client` reste tel quel.

- [ ] **Étape 4 : Relever les identifiants**

Noter les `tbl…` des deux nouvelles tables. Ils serviront à la tâche 4 et devront être reportés dans `REPRISE-PROJET.md` à la tâche 10.

- [ ] **Étape 5 : Vérifier que l'Écran TV n'a pas bougé**

```bash
curl -s https://clubcomle10notion-production.up.railway.app/api/opportunities | head -c 200
```
Attendu : du JSON contenant `"client"` renseigné pour les opportunités visibles. Si `client` est vide, **arrêter et alerter** : la table Opportunités a été abîmée.

### Tâche 2 : Reprendre les 7 acheteurs existants

- [ ] **Étape 1 : Lire les valeurs actuelles**

Lister les 7 opportunités avec leurs champs `Acheteur / client` et `Territoire`.

- [ ] **Étape 2 : Créer une organisation par valeur distincte**

Décomposer ce qui est aggloméré. Correspondance à appliquer :

| Texte actuel | Nom | Commune | Code postal | Type | Territoire |
|---|---|---|---|---|---|
| Ville de Campan | Ville de Campan | Campan | *(vide)* | Commune | Occitanie |
| Mairie de Colomiers (31770) | Mairie de Colomiers | Colomiers | 31770 | Commune | Occitanie |
| Communauté d'Agglomération du Grand Villeneuvois (47) | Communauté d'Agglomération du Grand Villeneuvois | Villeneuve-sur-Lot | *(vide)* | Communauté d'agglomération | Lot-et-Garonne (47) |
| HÉRAULT LOGEMENT (Montpellier, 34) | Hérault Logement | Montpellier | *(vide)* | Bailleur social | Occitanie |
| Mairie de La Grande Motte | Mairie de La Grande Motte | La Grande-Motte | *(vide)* | Commune | Occitanie |
| Région Occitanie | Région Occitanie | Toulouse | *(vide)* | Région | Occitanie |
| Communauté d'Agglomération du Pays de l'Or (Mauguio) | Communauté d'Agglomération du Pays de l'Or | Mauguio | *(vide)* | Communauté d'agglomération | Occitanie |

Pour les sept : `Nature = Publique`, `Origine = Appel d'offres`, `Niveau de relation = Jamais contacté`.

- [ ] **Étape 3 : Rattacher chaque opportunité**

Renseigner le champ `Organisation` de chaque opportunité avec l'organisation correspondante. **Ne pas modifier `Acheteur / client`.**

- [ ] **Étape 4 : Vérifier**

Relire les 7 opportunités : chacune doit avoir `Organisation` renseigné **et** `Acheteur / client` inchangé. Relancer le `curl` de la tâche 1 étape 5.

---

## Phase B — Backend

### Tâche 3 : Fonctions pures (TDD strict)

**Fichiers :**
- Créer : `ecran-affichage-dynamique/server/services/organisations.js`
- Test : `ecran-affichage-dynamique/tests/organisations.test.js`

- [ ] **Étape 1 : Écrire le test qui échoue**

```javascript
// ecran-affichage-dynamique/tests/organisations.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculerHistorique, filterOrganisationForRole } from '../server/services/organisations.js'

const opportunites = [
  { id: 'recO1', name: 'Refonte site', status: 'Gagné', deadline: '2026-03-01' },
  { id: 'recO2', name: 'Charte graphique', status: 'Perdu', deadline: '2026-05-01' },
  { id: 'recO3', name: 'Campagne été', status: 'À analyser', deadline: '2026-09-01' }
]

const dossiers = [
  { id: 'recD1', opportuniteIds: ['recO1'], depot: 'Déposé', resultat: 'Gagné' },
  { id: 'recD2', opportuniteIds: ['recO2'], depot: 'Accusé reçu', resultat: 'Perdu' },
  { id: 'recD3', opportuniteIds: ['recO3'], depot: 'Non préparé', resultat: 'En cours' }
]

test('l\'historique compte les opportunités liées', () => {
  const h = calculerHistorique(opportunites, dossiers)
  assert.equal(h.nbOpportunites, 3)
})

test('seuls les dossiers réellement déposés sont comptés', () => {
  const h = calculerHistorique(opportunites, dossiers)
  assert.equal(h.nbDossiersDeposes, 2)
})

test('les gagnés et les perdus sont comptés séparément', () => {
  const h = calculerHistorique(opportunites, dossiers)
  assert.equal(h.nbGagnes, 1)
  assert.equal(h.nbPerdus, 1)
})

test('la dernière opportunité est la plus récente par échéance', () => {
  const h = calculerHistorique(opportunites, dossiers)
  assert.equal(h.derniereOpportunite, '2026-09-01')
})

test('une organisation sans opportunité renvoie des compteurs nuls, pas zéro', () => {
  const h = calculerHistorique([], [])
  assert.equal(h.nbOpportunites, null)
  assert.equal(h.nbDossiersDeposes, null)
  assert.equal(h.nbGagnes, null)
  assert.equal(h.nbPerdus, null)
  assert.equal(h.derniereOpportunite, null)
})

test('des opportunités sans échéance ne cassent pas le calcul', () => {
  const h = calculerHistorique(
    [{ id: 'recO9', name: 'Sans date', status: 'À analyser', deadline: null }],
    []
  )
  assert.equal(h.nbOpportunites, 1)
  assert.equal(h.derniereOpportunite, null)
})

test('Macao reçoit l\'organisation entière', () => {
  const org = { id: 'recA1', nom: 'Mairie de Colomiers', notes: 'Contact via le maire', niveauRelation: 'Contact pris' }
  const r = filterOrganisationForRole(org, 'Macao')
  assert.equal(r.notes, 'Contact via le maire')
  assert.equal(r.niveauRelation, 'Contact pris')
})

test('un Coworker ne reçoit rien du CRM', () => {
  const org = { id: 'recA1', nom: 'Mairie de Colomiers' }
  assert.equal(filterOrganisationForRole(org, 'Coworker'), null)
  assert.equal(filterOrganisationForRole(org, 'Freelance'), null)
})

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterOrganisationForRole({ id: 'recA1' }, 'Inconnu'), null)
})
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --test tests/organisations.test.js
```
Attendu : ÉCHEC — module introuvable.

- [ ] **Étape 3 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/organisations.js
// Fonctions pures du CRM : aucune I/O, donc testables sans réseau.

import { ROLES } from './permissions.js'

// Un dossier n'est « déposé » qu'une fois réellement transmis à l'acheteur.
const DEPOTS_EFFECTUES = ['Déposé', 'Accusé reçu']

// Convention du projet : une valeur absente s'affiche « — », jamais « 0 ».
// On renvoie donc null plutôt que 0 quand il n'y a rien à compter.
function ouNull(n) {
  return n > 0 ? n : null
}

export function calculerHistorique(opportunites = [], dossiers = []) {
  const opps = opportunites || []
  const doss = dossiers || []

  const echeances = opps.map(o => o.deadline).filter(Boolean).sort()

  return {
    nbOpportunites: ouNull(opps.length),
    nbDossiersDeposes: ouNull(doss.filter(d => DEPOTS_EFFECTUES.includes(d.depot)).length),
    nbGagnes: ouNull(opps.filter(o => o.status === 'Gagné').length),
    nbPerdus: ouNull(opps.filter(o => o.status === 'Perdu').length),
    derniereOpportunite: echeances.length ? echeances[echeances.length - 1] : null
  }
}

// Le CRM est réservé à Macao : relation commerciale, notes et coordonnées
// d'interlocuteurs n'ont pas à sortir de l'agence.
export function filterOrganisationForRole(organisation, role) {
  if (!ROLES.includes(role)) return null
  if (role !== 'Macao') return null
  return organisation
}
```

- [ ] **Étape 4 : Vérifier que les tests passent**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --test tests/organisations.test.js
```
Attendu : `# pass 9`

- [ ] **Étape 5 : Vérifier la non-régression**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique && node --test
```
Attendu : `# pass 44` (35 existants + 9 nouveaux), `# fail 0`.
Si un test existant échoue, **arrêter et signaler** — ne pas modifier les tests existants.

- [ ] **Étape 6 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add ecran-affichage-dynamique/server/services/organisations.js ecran-affichage-dynamique/tests/organisations.test.js
git commit -m "feat(crm): pure history calculation and Macao-only role filtering"
```

### Tâche 4 : Client Airtable

**Fichier :** Créer `ecran-affichage-dynamique/server/services/organisationsClient.js`

- [ ] **Étape 1 : Implémenter**

Remplacer les deux constantes de table par les identifiants relevés à la tâche 1 étape 4.

```javascript
// ecran-affichage-dynamique/server/services/organisationsClient.js
// Client Airtable du CRM. Écriture par NOM de champ : ces tables ont été
// créées après le reste du code, leurs identifiants de colonnes ne sont pas
// figés ici. Renommer une colonne cassera l'écriture.

const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
// ⚠️ Remplacer par les identifiants réels relevés à la création des tables.
const TABLE_ORGANISATIONS = process.env.AIRTABLE_TABLE_ORGANISATIONS || 'tblORGANISATIONS_A_REMPLACER'
const TABLE_INTERLOCUTEURS = process.env.AIRTABLE_TABLE_INTERLOCUTEURS || 'tblINTERLOCUTEURS_A_REMPLACER'

async function airtableRequest(chemin, options = {}) {
  if (!TOKEN) throw new Error('AIRTABLE_TOKEN manquant')

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

async function fetchAll(table) {
  let records = []
  let offset
  do {
    const params = new URLSearchParams({ pageSize: '100' })
    if (offset) params.append('offset', offset)
    const data = await airtableRequest(`${table}?${params}`)
    records = records.concat(data.records || [])
    offset = data.offset
  } while (offset)
  return records
}

function mapOrganisation(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom'] || 'Sans nom',
    nature: f['Nature'] || null,
    type: f['Type'] || null,
    commune: f['Commune'] || null,
    codePostal: f['Code postal'] || null,
    territoire: f['Territoire'] || null,
    siret: f['SIRET'] || null,
    siteWeb: f['Site web'] || null,
    niveauRelation: f['Niveau de relation'] || null,
    origine: f['Origine'] || null,
    referent: f['Référent Macao'] || null,
    dernierEchange: f['Dernier échange'] || null,
    plateforme: f['Plateforme de publication'] || null,
    particularites: f['Particularités administratives'] || null,
    notes: f['Notes'] || null,
    opportuniteIds: f['Opportunités'] || [],
    interlocuteurIds: f['Interlocuteurs'] || []
  }
}

function mapInterlocuteur(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom complet'] || 'Sans nom',
    fonction: f['Fonction'] || null,
    email: f['Email'] || null,
    telephone: f['Téléphone'] || null,
    opposition: f['Opposition à la prospection'] === true,
    notes: f['Notes'] || null,
    organisationIds: f['Organisation'] || []
  }
}

export async function listOrganisations() {
  return (await fetchAll(TABLE_ORGANISATIONS)).map(mapOrganisation)
}

export async function getOrganisation(id) {
  return mapOrganisation(await airtableRequest(`${TABLE_ORGANISATIONS}/${id}`))
}

export async function listInterlocuteurs() {
  return (await fetchAll(TABLE_INTERLOCUTEURS)).map(mapInterlocuteur)
}
```

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --check server/services/organisationsClient.js
```
Attendu : aucune sortie.

- [ ] **Étape 3 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add ecran-affichage-dynamique/server/services/organisationsClient.js
git commit -m "feat(crm): Airtable client for organisations and contacts"
```

### Tâche 5 : Routes et indicateur

**Fichier :** Modifier `ecran-affichage-dynamique/server/routes/intranet/data.js`

Lire d'abord le fichier pour retrouver les motifs existants : `requireRole('Macao')`, la forme des réponses `{ data: … }`, et la fonction `chargerIndexLiens()` ajoutée par le module Dossiers.

- [ ] **Étape 1 : Imports**

```javascript
import { listOrganisations, getOrganisation, listInterlocuteurs } from '../../services/organisationsClient.js'
import { calculerHistorique, filterOrganisationForRole } from '../../services/organisations.js'
```

- [ ] **Étape 2 : Routes**

```javascript
// GET /api/intranet/organisations — liste (Macao)
// Le CRM ne sort pas de l'agence : requireRole double le filtre de rôle.
router.get('/organisations', requireRole('Macao'), async (req, res) => {
  try {
    const [orgs, opps, doss] = await Promise.all([
      listOrganisations(),
      getAllOpportunities(),
      listDossiers().catch(() => [])
    ])

    const data = orgs.map(o => {
      const sesOpps = opps.filter(op => (o.opportuniteIds || []).includes(op.id))
      const sesIds = sesOpps.map(op => op.id)
      const sesDoss = doss.filter(d => (d.opportuniteIds || []).some(i => sesIds.includes(i)))
      return filterOrganisationForRole(
        { ...o, historique: calculerHistorique(sesOpps, sesDoss) },
        req.user.role
      )
    }).filter(Boolean)

    res.json({ data })
  } catch (err) {
    console.error('❌ organisations:', err.message)
    res.status(500).json({ error: 'Erreur de chargement' })
  }
})

// GET /api/intranet/organisations/:id — fiche (Macao)
router.get('/organisations/:id', requireRole('Macao'), async (req, res) => {
  try {
    const org = await getOrganisation(req.params.id)

    const [opps, doss, interlocuteurs] = await Promise.all([
      getAllOpportunities(),
      listDossiers().catch(() => []),
      listInterlocuteurs().catch(() => [])
    ])

    const sesOpps = opps.filter(op => (org.opportuniteIds || []).includes(op.id))
    const sesIds = sesOpps.map(op => op.id)
    const sesDoss = doss.filter(d => (d.opportuniteIds || []).some(i => sesIds.includes(i)))

    const complet = {
      ...org,
      historique: calculerHistorique(sesOpps, sesDoss),
      // On renvoie les opportunités allégées : la fiche n'affiche qu'un rappel,
      // le détail vit sur la page Opportunités.
      opportunites: sesOpps.map(o => ({ id: o.id, nom: o.name, statut: o.status, dateLimite: o.deadline })),
      dossiers: sesDoss.map(d => ({ id: d.id, nom: d.nom, statut: d.statut, resultat: d.resultat })),
      interlocuteurs: interlocuteurs.filter(i => (i.organisationIds || []).includes(org.id))
    }

    res.json({ data: filterOrganisationForRole(complet, req.user.role) })
  } catch (err) {
    const introuvable = /NOT_FOUND|HTTP 404/i.test(err.message)
    console.error('❌ organisation:', err.message)
    res.status(introuvable ? 404 : 500).json({
      error: introuvable ? 'Organisation introuvable' : 'Erreur de chargement'
    })
  }
})
```

⚠️ Vérifier que `getAllOpportunities` et `listDossiers` sont bien importés dans ce fichier ; les ajouter à leurs imports existants sinon.

- [ ] **Étape 3 : Indicateur du tableau de bord**

Dans la route `GET /dashboard`, dans le bloc réservé à Macao, à l'intérieur du `try/catch` isolé qui calcule déjà les indicateurs dossiers (ou dans un `try/catch` jumeau, pour qu'une panne n'emporte pas la page) :

```javascript
    // Une opportunité créée sans rattacher son organisation dégrade le CRM
    // en silence. Cet indicateur est le seul garde-fou.
    const sansOrganisation = (await getAllOpportunities())
      .filter(o => !(o.organisationIds || []).length).length
```

Ajouter `sansOrganisation` à l'objet renvoyé pour Macao.

⚠️ Cela suppose que `mapOpportunite` expose le nouveau champ de liaison. Ajouter dans `server/services/airtableClient.js`, à `mapOpportunite`, **sans rien retirer** :

```javascript
    organisationIds: f['Organisation'] || [],
```

- [ ] **Étape 4 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --check server/routes/intranet/data.js
node --check server/services/airtableClient.js
node --test
```
Attendu : `# pass 44`, `# fail 0`.

Puis les gardes d'accès :

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
env -u RESEND_API_KEY JWT_SECRET=test PORT=5273 AIRTABLE_TOKEN=faux node server/server.js &
sleep 3
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:5273/api/health
curl -s -o /dev/null -w "opportunities=%{http_code}\n" http://localhost:5273/api/opportunities
curl -s -o /dev/null -w "organisations_sans_session=%{http_code}\n" http://localhost:5273/api/intranet/organisations
kill %1
```
Attendu : `health=200`, `opportunities=200`, `organisations_sans_session=401`.

- [ ] **Étape 5 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add ecran-affichage-dynamique/server
git commit -m "feat(crm): Macao-only organisation routes with computed history and unlinked indicator"
```

---

## Phase C — Portail

### Tâche 6 : Méthodes API

**Fichier :** Modifier `intranet-macao/src/lib/api.js`

- [ ] **Étape 1 : Ajouter dans l'objet `api`**

```javascript
  // CRM — réservé à Macao, le serveur renvoie 403 aux autres rôles
  organisations: () => appel('/organisations'),
  organisation: (id) => appel(`/organisations/${id}`),
```

- [ ] **Étape 2 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/lib/api.js
git commit -m "feat(crm): API client methods"
```

### Tâche 7 : Page liste

**Fichier :** Créer `intranet-macao/src/pages/Organisations.jsx`

Lire d'abord `intranet-macao/src/pages/Dossiers.jsx` : même structure, mêmes conventions. `useRequete` **déballe déjà** l'enveloppe (`donnees` est directement le tableau), et `erreur` est une chaîne.

- [ ] **Étape 1 : Implémenter**

```jsx
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { ouTiret } from '../lib/format'

export default function Organisations() {
  const { donnees, chargement, erreur } = useRequete(api.organisations)

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (erreur) return <div className="p-10 text-macao-terra">Impossible de charger les organisations : {erreur}</div>

  const organisations = donnees || []

  return (
    <div className="p-10 max-w-6xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-1">Organisations</h1>
      <p className="text-macao-ink/60 mb-8">
        {organisations.length} organisation{organisations.length > 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {organisations.map(o => (
          <Link
            key={o.id}
            to={`/organisations/${o.id}`}
            className="block bg-white rounded-xl p-6 border-l-4 border-macao-teal hover:shadow-md transition-shadow"
          >
            <h2 className="font-serif text-xl text-macao-ink mb-2">{o.nom}</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span><span className="text-macao-ink/50">Nature </span><b>{ouTiret(o.nature)}</b></span>
              <span><span className="text-macao-ink/50">Type </span><b>{ouTiret(o.type)}</b></span>
              <span><span className="text-macao-ink/50">Territoire </span><b>{ouTiret(o.territoire)}</b></span>
              <span><span className="text-macao-ink/50">Relation </span><b>{ouTiret(o.niveauRelation)}</b></span>
              <span>
                <span className="text-macao-ink/50">Opportunités </span>
                <b>{o.historique?.nbOpportunites ?? '—'}</b>
              </span>
            </div>
          </Link>
        ))}

        {!organisations.length && (
          <p className="text-macao-ink/50">
            Aucune organisation enregistrée.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/pages/Organisations.jsx
git commit -m "feat(crm): organisation list page"
```

### Tâche 8 : Fiche organisation

**Fichier :** Créer `intranet-macao/src/pages/OrganisationDetail.jsx`

Lire d'abord `intranet-macao/src/pages/DossierDetail.jsx` : mêmes conventions de chargement et d'affichage.

- [ ] **Étape 1 : Implémenter**

```jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formaterDate, ouTiret } from '../lib/format'

function Ligne({ label, valeur }) {
  return (
    <div className="flex border-b border-macao-ink/10 pb-3 last:border-0">
      <span className="w-52 text-macao-ink/55 text-sm shrink-0">{label}</span>
      <span className="text-macao-ink">{ouTiret(valeur)}</span>
    </div>
  )
}

export default function OrganisationDetail() {
  const { id } = useParams()
  const [o, setO] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let annule = false
    api.organisation(id)
      .then(({ data }) => { if (!annule) setO(data) })
      .catch(e => { if (!annule) setErreur(e.message) })
      .finally(() => { if (!annule) setChargement(false) })
    return () => { annule = true }
  }, [id])

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!o) {
    return (
      <div className="p-10">
        <Link to="/organisations" className="text-sm text-macao-teal mb-4 inline-block">← Toutes les organisations</Link>
        <p className="text-macao-terra">{erreur || 'Organisation indisponible.'}</p>
      </div>
    )
  }

  const h = o.historique || {}
  const interlocuteurs = Array.isArray(o.interlocuteurs) ? o.interlocuteurs : []
  const opportunites = Array.isArray(o.opportunites) ? o.opportunites : []

  return (
    <div className="p-10 max-w-5xl">
      <Link to="/organisations" className="text-sm text-macao-teal mb-4 inline-block">← Toutes les organisations</Link>

      <h1 className="font-serif text-3xl text-macao-ink mb-1">{o.nom}</h1>
      <p className="text-macao-ink/60 mb-8">
        {ouTiret(o.type)} · {ouTiret(o.commune)} · Relation {ouTiret(o.niveauRelation)}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Opportunités', h.nbOpportunites],
          ['Dossiers déposés', h.nbDossiersDeposes],
          ['Gagnés', h.nbGagnes],
          ['Perdus', h.nbPerdus]
        ].map(([label, valeur]) => (
          <div key={label} className="bg-white rounded-xl p-5">
            <p className="text-xs text-macao-ink/60 mb-1">{label}</p>
            <p className="font-serif text-2xl text-macao-ink">{valeur ?? '—'}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Interlocuteurs</h2>
        {interlocuteurs.length ? (
          <ul className="space-y-3">
            {interlocuteurs.map(i => (
              <li key={i.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-macao-ink/10 pb-3 last:border-0">
                <b className="text-macao-ink">{i.nom}</b>
                <span className="text-sm text-macao-ink/60">{ouTiret(i.fonction)}</span>
                <span className="text-sm text-macao-ink/60">{ouTiret(i.email)}</span>
                <span className="text-sm text-macao-ink/60">{ouTiret(i.telephone)}</span>
                {i.opposition && (
                  <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white">
                    Ne pas démarcher
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-macao-ink/50 text-sm">Aucun interlocuteur enregistré.</p>
        )}
      </section>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Opportunités</h2>
        {opportunites.length ? (
          <ul className="space-y-2">
            {opportunites.map(op => (
              <li key={op.id} className="flex flex-wrap items-baseline gap-x-4 text-sm border-b border-macao-ink/10 pb-2 last:border-0">
                <b className="text-macao-ink">{op.nom}</b>
                <span className="text-macao-ink/60">{ouTiret(op.statut)}</span>
                <span className="text-macao-ink/60">{formaterDate(op.dateLimite)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-macao-ink/50 text-sm">Aucune opportunité rattachée.</p>
        )}
      </section>

      <section className="bg-white rounded-xl p-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Informations</h2>
        <div className="space-y-3">
          <Ligne label="Nature" valeur={o.nature} />
          <Ligne label="Code postal" valeur={o.codePostal} />
          <Ligne label="Territoire" valeur={o.territoire} />
          <Ligne label="SIRET" valeur={o.siret} />
          <Ligne label="Site web" valeur={o.siteWeb} />
          <Ligne label="Origine" valeur={o.origine} />
          <Ligne label="Référent Macao" valeur={o.referent} />
          <Ligne label="Dernier échange" valeur={o.dernierEchange ? formaterDate(o.dernierEchange) : null} />
          <Ligne label="Plateforme" valeur={o.plateforme} />
          <Ligne label="Particularités" valeur={o.particularites} />
          <Ligne label="Notes" valeur={o.notes} />
        </div>
        <p className="text-sm text-macao-ink/50 mt-4">
          Ces informations se saisissent dans Airtable.
        </p>
      </section>
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/pages/OrganisationDetail.jsx
git commit -m "feat(crm): organisation detail page with contacts and history"
```

### Tâche 9 : Câblage

**Fichiers :** `intranet-macao/src/App.jsx`, `layout/Shell.jsx`, `pages/Opportunities.jsx`, `pages/Dashboard.jsx`

- [ ] **Étape 1 : Routes**

Dans `App.jsx`, importer les deux pages et ajouter dans le bloc protégé :

```jsx
<Route path="/organisations" element={<Organisations />} />
<Route path="/organisations/:id" element={<OrganisationDetail />} />
```

- [ ] **Étape 2 : Navigation**

Dans `Shell.jsx`, ajouter dans `LIENS`, après `Dossiers` :

```javascript
  { to: '/organisations', libelle: 'Organisations' },
```

⚠️ Cette entrée ne doit apparaître que pour **Macao** — le serveur renvoie 403 aux autres, une entrée visible menant à une erreur serait un défaut d'interface. Regarder si `LIENS` supporte déjà une condition de rôle ; l'ajouter sinon, sur ce seul lien.

- [ ] **Étape 3 : Lien depuis une opportunité**

Dans `Opportunities.jsx`, pour Macao, afficher un lien vers `/organisations/{id}` quand l'opportunité porte une organisation rattachée.

⚠️ Le champ exposé par l'API est `organisationIds` (tableau). Vérifier que la route `/opportunities` le renvoie bien ; si `filterOpportunityForRole` ou le mapping l'écarte, l'ajouter.

Si l'opportunité n'a **pas** d'organisation, afficher une mention discrète « Aucune organisation rattachée » plutôt que rien : c'est le signal qui déclenche le rattachement.

- [ ] **Étape 4 : Indicateur du tableau de bord**

Dans `Dashboard.jsx`, ajouter à la bande d'indicateurs Macao :

```javascript
  { label: 'Sans organisation', valeur: donnees.sansOrganisation || null, couleur: 'terra' }
```

⚠️ `StatBand` attend un **nom** de couleur (`terra`, `gold`, `teal`, `ink`), pas un hexadécimal. Vérifier le composant avant d'écrire.

- [ ] **Étape 5 : Vérifier le build**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
```
Attendu : `✓ built in …`. C'est le premier build qui compile réellement les deux nouvelles pages.

- [ ] **Étape 6 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src
git commit -m "feat(crm): routing, Macao-only navigation, opportunity link, dashboard indicator"
```

---

## Phase D — Mise en service

### Tâche 10 : Vérifier, déployer, documenter

- [ ] **Étape 1 : Vérification complète avant fusion**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique && node --test
cd ../intranet-macao && npm run build
```
Attendu : `# pass 44`, `# fail 0`, puis `✓ built`.

- [ ] **Étape 2 : Vérifier le cloisonnement par rôle**

Avec une session **Coworker** : `GET /api/intranet/organisations` doit répondre **403**, et l'entrée « Organisations » ne doit pas apparaître dans la navigation. C'est le test qui valide la promesse : le CRM ne sort pas de l'agence.

- [ ] **Étape 3 : Fusionner** — **demander l'accord avant**, la fusion déclenche la mise en production.

- [ ] **Étape 4 : Vérifier la production**

```bash
curl -s -o /dev/null -w "tv_health=%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/health
curl -s -o /dev/null -w "tv_opportunites=%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/opportunities
curl -s -o /dev/null -w "portail=%{http_code}\n" https://intranet-macao.vercel.app
curl -s -o /dev/null -w "organisations_401=%{http_code}\n" https://intranet-macao.vercel.app/api/intranet/organisations
```
Attendu : `200`, `200`, `200`, `401`.

- [ ] **Étape 5 : Vérifier l'Écran TV visuellement**

Ouvrir l'affichage TV et confirmer que les acheteurs s'affichent toujours. C'est la seule vérification qui prouve que la modification d'Opportunités n'a rien cassé.

- [ ] **Étape 6 : Documenter**

Dans `REPRISE-PROJET.md` : ajouter `Organisations` et `Interlocuteurs` au tableau des tables avec leurs identifiants, signaler que ces tables s'écrivent par nom de champ, et mettre à jour la feuille de route (§12) — le module 3 devient quatre livraisons, 3a est faite.

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add REPRISE-PROJET.md
git commit -m "docs: record CRM tables and the four-delivery roadmap"
```

---

## Auto-revue (couverture de la spec)

| Exigence de la spec | Tâche |
|---|---|
| §3 Table Organisations, 17 champs | 1 |
| §3 Table Interlocuteurs, dont opposition à la prospection | 1, 8 |
| §3 Liaison `Organisation` sur Opportunités, texte intact | 1 (étape 3 + garde), 2 |
| §4 Reprise des 7 acheteurs, décomposition nom/commune/CP | 2 |
| §5 Historique calculé côté serveur, `—` et non `0` | 3 (`calculerHistorique`), 5 |
| §6 Page liste | 7 |
| §6 Fiche : identité, relation, interlocuteurs, historique | 8 |
| §6 Lien depuis une opportunité | 9 étape 3 |
| §7 Indicateur « sans organisation rattachée » | 5 étape 3, 9 étape 4 |
| §1 Réservé à Macao | 3 (`filterOrganisationForRole`), 5 (`requireRole`), 9 étape 2 |

**Placeholders :** deux, explicites et incontournables — `TABLE_ORGANISATIONS` et `TABLE_INTERLOCUTEURS` à la tâche 4, dont les valeurs n'existent qu'après la tâche 1. L'étape 4 de la tâche 1 impose de les relever.

**Cohérence des noms :** `calculerHistorique`, `filterOrganisationForRole`, `listOrganisations`, `getOrganisation`, `listInterlocuteurs` — identiques entre définition et usage. Les propriétés (`nom`, `nature`, `type`, `niveauRelation`, `origine`, `referent`, `dernierEchange`, `plateforme`, `particularites`, `historique`, `interlocuteurs`, `opportunites`, `opposition`) sont identiques du mappeur Airtable aux composants React. `organisationIds` est le nom du champ exposé côté Opportunités, utilisé à la tâche 5 et à la tâche 9.
