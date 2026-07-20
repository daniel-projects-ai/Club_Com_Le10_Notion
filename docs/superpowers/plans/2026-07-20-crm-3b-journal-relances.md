# CRM 3b — Journal et relances : Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** un journal des échanges qui se remplit en trente secondes, et des relances qu'on revoit vraiment.

**Architecture :** deux tables Airtable (`Interactions`, `Tâches`), trois champs ajoutés à `Interlocuteurs`. Le backend expose la création d'une interaction — qui met à jour `Dernier échange` et peut créer une relance dans le même appel — et classe les relances. Le portail ajoute un journal et un formulaire rapide sur la fiche d'organisation, plus un bloc « Vos relances » au tableau de bord.

**Stack :** Node 22 + Express, Airtable REST API, React + Vite + Tailwind, tests `node --test`.

**Spec :** `docs/superpowers/specs/2026-07-20-crm-3b-journal-relances-design.md`
**Cadre :** `docs/superpowers/specs/2026-07-20-crm-agence-vision.md`

---

## Rappels de contexte

**⚠️ L'Écran TV est affiché en permanence dans les locaux du client.** Cette livraison ne doit toucher **aucun** fichier qu'il utilise : `server/services/airtableClient.js`, `server/routes/opportunities.js`, `/api/health`. Le diff sur `airtableClient.js` doit rester à zéro.

**⚠️ Le piège du fuseau horaire.** `new Date('2026-07-20')` vaut minuit **UTC**. Comparé à `Date.now()`, une échéance du jour paraît dépassée dès 2 h du matin à Paris. Ce défaut a déjà été introduit puis corrigé sur les dossiers de réponse. `server/services/dossiers.js` contient la solution retenue (`debutDeJour`, `joursAvantEcheance`) — **la réutiliser plutôt que d'en réécrire une.**

**Convention d'écriture Airtable.** Comme les tables `Dossiers de réponse`, `Organisations` et `Interlocuteurs`, les nouvelles tables s'écrivent **par nom de champ**. Renommer une colonne cassera l'écriture.

**Identifiants existants :** base `appdJ309q39i4Gr8t` · Opportunités `tbl3jvmo4VjUDTkmD` · Organisations `tblMONv5vnC3Bn0ii` · Interlocuteurs `tblwmhpkzc3lFVeRI` · Dossiers `tblp59OuT0dDNFuc1`.

**⚠️ `node --test tests/` échoue sur cette machine.** Utiliser `node --test` seul.

**⚠️ `npm run build` peut se bloquer sur `transforming…` en environnement sandboxé**, sans rapport avec le code. Relancer hors sandbox.

## Structure des fichiers

**Backend** — `ecran-affichage-dynamique/server/`

| Fichier | Responsabilité |
|---|---|
| `services/interactions.js` | **Fonctions pures** : `peutEtreDemarche`, `classerRelances`, `referenceInteraction` |
| `services/interactionsClient.js` | Lecture/écriture Interactions et Tâches, mise à jour de `Dernier échange` |
| `routes/intranet/data.js` *(modifié)* | Routes `/interactions`, `/taches`, enrichissement de la fiche organisation, indicateurs |
| `tests/interactions.test.js` | Tests des fonctions pures |

**Frontend** — `intranet-macao/src/`

| Fichier | Responsabilité |
|---|---|
| `lib/api.js` *(modifié)* | Méthodes interactions et tâches |
| `components/JournalEchange.jsx` | Le journal chronologique |
| `components/FormulaireEchange.jsx` | Le formulaire rapide, avec la relance facultative |
| `components/dash/BlocRelances.jsx` | « Vos relances » sur le tableau de bord |
| `pages/OrganisationDetail.jsx` *(modifié)* | Journal + bouton de saisie |
| `pages/Dashboard.jsx` *(modifié)* | Bloc relances + deux indicateurs |

---

## Phase A — Données

### Tâche 1 : Créer les tables et les champs

- [ ] **Étape 1 : Table `Interactions`**

| Champ | Type | Options |
|---|---|---|
| Référence | singleLineText | |
| Canal | singleSelect | `Email`, `Appel`, `SMS`, `WhatsApp`, `Visioconférence`, `Rendez-vous`, `LinkedIn`, `Courrier`, `Formulaire du site`, `Autre` |
| Sens | singleSelect | `Sortant`, `Entrant` |
| Date | date | format iso |
| Compte rendu | multilineText | |
| Auteur | singleSelect | `Daniel`, `Dominique`, `Mathieu` |
| Assistée par IA | checkbox | icon `check`, color `purpleBright` |

- [ ] **Étape 2 : Table `Tâches`**

| Champ | Type | Options |
|---|---|---|
| Intitulé | singleLineText | |
| Échéance | date | format iso |
| Responsable | singleSelect | `Daniel`, `Dominique`, `Mathieu` |
| Statut | singleSelect | `À faire`, `Faite`, `Annulée` |
| Notes | multilineText | |

- [ ] **Étape 3 : Liaisons**

Champs `multipleRecordLinks` :
- Sur **Interactions** : `Organisation` → `tblMONv5vnC3Bn0ii`, `Interlocuteur` → `tblwmhpkzc3lFVeRI`, `Opportunité` → `tbl3jvmo4VjUDTkmD`
- Sur **Tâches** : `Organisation` → `tblMONv5vnC3Bn0ii`, `Interlocuteur` → `tblwmhpkzc3lFVeRI`, `Opportunité` → `tbl3jvmo4VjUDTkmD`, `Interaction d'origine` → la table Interactions

⚠️ **Ne toucher à aucun champ existant d'Opportunités.**

- [ ] **Étape 4 : Trois champs sur `Interlocuteurs` (`tblwmhpkzc3lFVeRI`)**

| Champ | Type | Options |
|---|---|---|
| Consentement SMS / WhatsApp | singleSelect | `Non renseigné`, `Accordé`, `Refusé` |
| Date d'opposition | date | format iso |
| Canal de l'opposition | singleSelect | `Email`, `Téléphone`, `Courrier`, `Formulaire`, `De vive voix`, `Autre` |

Ne pas modifier le champ `Opposition à la prospection` existant : il reste le drapeau maître.

- [ ] **Étape 5 : Relever les identifiants et vérifier la TV**

Noter les `tbl…` des deux nouvelles tables (nécessaires à la tâche 3).

```bash
curl -s https://clubcomle10notion-production.up.railway.app/api/opportunities | head -c 200
```
Attendu : du JSON où `client` est renseigné. Sinon, **arrêter et alerter**.

---

## Phase B — Backend

### Tâche 2 : Fonctions pures (TDD strict)

**Fichiers :** Créer `server/services/interactions.js` et `tests/interactions.test.js`

- [ ] **Étape 1 : Écrire le test qui échoue**

```javascript
// ecran-affichage-dynamique/tests/interactions.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { peutEtreDemarche, classerRelances, referenceInteraction } from '../server/services/interactions.js'

const libre = { id: 'recI1', nom: 'Jean Dupont', opposition: false, consentementSmsWhatsapp: 'Non renseigné' }
const oppose = { id: 'recI2', nom: 'Marie Martin', opposition: true, consentementSmsWhatsapp: 'Accordé' }
const consentant = { id: 'recI3', nom: 'Paul Durand', opposition: false, consentementSmsWhatsapp: 'Accordé' }

test('une opposition interdit tous les canaux, consentement compris', () => {
  for (const canal of ['Email', 'Appel', 'SMS', 'WhatsApp', 'Courrier']) {
    assert.equal(peutEtreDemarche(oppose, canal), false, `${canal} devrait être interdit`)
  }
})

test('email, appel et courrier sont permis sans opposition', () => {
  assert.equal(peutEtreDemarche(libre, 'Email'), true)
  assert.equal(peutEtreDemarche(libre, 'Appel'), true)
  assert.equal(peutEtreDemarche(libre, 'Courrier'), true)
})

test('SMS et WhatsApp exigent un consentement explicite', () => {
  assert.equal(peutEtreDemarche(libre, 'SMS'), false)
  assert.equal(peutEtreDemarche(libre, 'WhatsApp'), false)
  assert.equal(peutEtreDemarche(consentant, 'SMS'), true)
  assert.equal(peutEtreDemarche(consentant, 'WhatsApp'), true)
})

test('un consentement refusé vaut interdiction', () => {
  const refus = { ...libre, consentementSmsWhatsapp: 'Refusé' }
  assert.equal(peutEtreDemarche(refus, 'SMS'), false)
})

test('LinkedIn n\'est jamais automatisable', () => {
  assert.equal(peutEtreDemarche(consentant, 'LinkedIn'), false)
})

test('un interlocuteur absent n\'est jamais démarchable', () => {
  assert.equal(peutEtreDemarche(null, 'Email'), false)
  assert.equal(peutEtreDemarche(undefined, 'Email'), false)
})

// --- Classement des relances : comparaison au JOUR, jamais à l'instant ---

const t = (id, echeance, statut = 'À faire') => ({ id, intitule: id, echeance, statut })

test('une relance due aujourd\'hui n\'est pas en retard', () => {
  const r = classerRelances([t('a', '2026-07-20')], new Date(2026, 6, 20, 2, 0, 0))
  assert.deepEqual(r.enRetard.map(x => x.id), [])
  assert.deepEqual(r.cetteSemaine.map(x => x.id), ['a'])
})

test('une relance d\'hier est en retard', () => {
  const r = classerRelances([t('a', '2026-07-19')], new Date(2026, 6, 20, 12, 0, 0))
  assert.deepEqual(r.enRetard.map(x => x.id), ['a'])
})

test('les échéances à plus de sept jours sont classées plus tard', () => {
  const r = classerRelances(
    [t('proche', '2026-07-26'), t('lointaine', '2026-08-15')],
    new Date(2026, 6, 20, 12, 0, 0)
  )
  assert.deepEqual(r.cetteSemaine.map(x => x.id), ['proche'])
  assert.deepEqual(r.plusTard.map(x => x.id), ['lointaine'])
})

test('seules les tâches à faire sont classées', () => {
  const r = classerRelances(
    [t('faite', '2026-07-19', 'Faite'), t('annulee', '2026-07-19', 'Annulée')],
    new Date(2026, 6, 20, 12, 0, 0)
  )
  assert.deepEqual(r.enRetard.map(x => x.id), [])
  assert.deepEqual(r.cetteSemaine.map(x => x.id), [])
  assert.deepEqual(r.plusTard.map(x => x.id), [])
})

test('une tâche sans échéance est classée plus tard, jamais en retard', () => {
  const r = classerRelances([t('sansDate', null)], new Date(2026, 6, 20, 12, 0, 0))
  assert.deepEqual(r.enRetard.map(x => x.id), [])
  assert.deepEqual(r.plusTard.map(x => x.id), ['sansDate'])
})

test('les relances en retard sont triées de la plus ancienne à la plus récente', () => {
  const r = classerRelances(
    [t('recente', '2026-07-19'), t('ancienne', '2026-07-01')],
    new Date(2026, 6, 20, 12, 0, 0)
  )
  assert.deepEqual(r.enRetard.map(x => x.id), ['ancienne', 'recente'])
})

test('une liste vide ou absente ne casse pas le classement', () => {
  assert.deepEqual(classerRelances([], new Date(2026, 6, 20)).enRetard, [])
  assert.deepEqual(classerRelances(undefined, new Date(2026, 6, 20)).plusTard, [])
})

test('la référence est lisible et datée', () => {
  assert.equal(
    referenceInteraction({ date: '2026-07-20', canal: 'Appel' }, 'Mairie de Colomiers'),
    '2026-07-20 · Appel · Mairie de Colomiers'
  )
})

test('la référence tolère des données manquantes', () => {
  assert.equal(referenceInteraction({}, null), 'Échange')
})
```

- [ ] **Étape 2 : Lancer, constater l'échec**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --test tests/interactions.test.js
```
Attendu : ÉCHEC, module introuvable.

- [ ] **Étape 3 : Implémenter**

```javascript
// ecran-affichage-dynamique/server/services/interactions.js
// Fonctions pures du journal : aucune I/O, donc testables sans réseau.

// Canaux dont le démarchage suppose un accord préalable : le régime du SMS
// et de WhatsApp diffère de celui de l'email B2B, qui repose sur l'intérêt
// légitime.
const CANAUX_A_CONSENTEMENT = ['SMS', 'WhatsApp']

// LinkedIn interdit l'automatisation et restreint les comptes qui s'y
// essaient. Le canal existe pour être journalisé à la main.
const CANAUX_JAMAIS_AUTOMATISABLES = ['LinkedIn']

const JOURS_SEMAINE = 7

// Ramène une date au début de sa journée LOCALE. Une chaîne « AAAA-MM-JJ »
// passée à new Date() serait interprétée en UTC : à Paris, une échéance du
// jour paraîtrait dépassée dès 2 h du matin.
function debutDeJour(valeur) {
  if (!valeur) return null
  if (valeur instanceof Date) {
    const d = new Date(valeur)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valeur))
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function joursDEcart(echeance, maintenant) {
  const a = debutDeJour(echeance)
  const b = debutDeJour(maintenant)
  if (!a || !b) return null
  return Math.round((a - b) / 86400000)
}

export function peutEtreDemarche(interlocuteur, canal) {
  if (!interlocuteur) return false
  if (interlocuteur.opposition) return false
  if (CANAUX_JAMAIS_AUTOMATISABLES.includes(canal)) return false
  if (CANAUX_A_CONSENTEMENT.includes(canal)) {
    return interlocuteur.consentementSmsWhatsapp === 'Accordé'
  }
  return true
}

export function classerRelances(taches = [], maintenant = new Date()) {
  const aFaire = (taches || []).filter(t => t?.statut === 'À faire')

  const enRetard = []
  const cetteSemaine = []
  const plusTard = []

  for (const tache of aFaire) {
    const jours = joursDEcart(tache.echeance, maintenant)
    // Une tâche sans échéance n'est pas en retard : on ne peut pas être en
    // retard sur une date qu'on n'a jamais fixée.
    if (jours === null) plusTard.push(tache)
    else if (jours < 0) enRetard.push(tache)
    else if (jours <= JOURS_SEMAINE) cetteSemaine.push(tache)
    else plusTard.push(tache)
  }

  const parEcheance = (a, b) => String(a.echeance || '').localeCompare(String(b.echeance || ''))
  return {
    enRetard: enRetard.sort(parEcheance),
    cetteSemaine: cetteSemaine.sort(parEcheance),
    plusTard: plusTard.sort(parEcheance)
  }
}

// Libellé d'affichage, figé à la création. Ce n'est pas une source de vérité :
// il ne se met pas à jour si la date ou le canal changent ensuite.
export function referenceInteraction(interaction, nomOrganisation) {
  const morceaux = [interaction?.date, interaction?.canal, nomOrganisation].filter(Boolean)
  return morceaux.length ? morceaux.join(' · ') : 'Échange'
}
```

- [ ] **Étape 4 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --test tests/interactions.test.js
```
Attendu : `# pass 16`.

- [ ] **Étape 5 : Vérifier sous plusieurs fuseaux**

C'est la vérification qui compte : elle prouve que le classement ne dépend pas du fuseau.

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
for tz in Europe/Paris Pacific/Kiritimati Pacific/Midway UTC; do
  echo "--- $tz"
  TZ=$tz node --test tests/interactions.test.js 2>&1 | grep -E "^# (pass|fail)|pass [0-9]+|fail [0-9]+" | head -3
done
```
Attendu : `fail 0` dans les quatre cas. **Si un seul échoue, la logique de date est fausse — corriger avant d'avancer.**

- [ ] **Étape 6 : Non-régression**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique && node --test
```
Attendu : `# pass 61` (45 existants + 16), `# fail 0`.

- [ ] **Étape 7 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add ecran-affichage-dynamique/server/services/interactions.js ecran-affichage-dynamique/tests/interactions.test.js
git commit -m "feat(crm): pure rules for channel consent, follow-up classification and interaction labels"
```

### Tâche 3 : Client Airtable

**Fichier :** Créer `server/services/interactionsClient.js`

Le modèle à suivre est `server/services/organisationsClient.js` : `fetch` natif, pagination, garde sur le token, erreurs explicites, écriture par nom de champ avec `typecast: true`.

- [ ] **Étape 1 : Implémenter**

Remplacer les deux constantes de table par les identifiants relevés à la tâche 1.

Le module doit exporter :

- `listInteractions()` → tableau mappé sur les clés : `id`, `reference`, `canal`, `sens`, `date`, `compteRendu`, `auteur`, `assisteeIA`, `organisationIds`, `interlocuteurIds`, `opportuniteIds`
- `listTaches()` → `id`, `intitule`, `echeance`, `responsable`, `statut`, `notes`, `organisationIds`, `interlocuteurIds`, `opportuniteIds`, `interactionIds`
- `creerInteraction(champs)` → crée et renvoie l'interaction mappée
- `creerTache(champs)` → crée et renvoie la tâche mappée
- `majTache(id, champs)` → met à jour et renvoie la tâche mappée
- `majDernierEchange(organisationId, dateISO)` → met à jour le champ `Dernier échange` de l'organisation

⚠️ **`majDernierEchange` ne doit jamais reculer la date.** Si l'organisation porte déjà une date postérieure — cas d'une saisie a posteriori d'un vieil échange — la conserver. Lire la valeur actuelle avant d'écrire, et n'écrire que si la nouvelle est plus récente.

- [ ] **Étape 2 : Vérifier la syntaxe**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --check server/services/interactionsClient.js
```

- [ ] **Étape 3 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add ecran-affichage-dynamique/server/services/interactionsClient.js
git commit -m "feat(crm): Airtable client for interactions and follow-ups"
```

### Tâche 4 : Routes

**Fichier :** Modifier `server/routes/intranet/data.js`

Toutes les routes de cette livraison sont **réservées à Macao** (`requireRole('Macao')`), comme celles de 3a.

- [ ] **Étape 1 : `POST /interactions`**

Corps attendu : `{ organisationId, canal, sens, date, compteRendu, interlocuteurId?, opportuniteId?, assisteeIA?, relance? }` où `relance` vaut `{ intitule, echeance }`.

La route doit :
1. **Valider** `canal` et `sens` contre les listes fermées, comme le fait le `PATCH /dossiers/:id` pour ses propres champs. Une valeur inconnue répond **400 sans appel réseau** — `typecast: true` créerait sinon l'option dans Airtable.
2. Exiger `organisationId` ; répondre 400 sinon.
3. Générer la `Référence` avec `referenceInteraction`, à partir du nom de l'organisation.
4. Créer l'interaction.
5. Mettre à jour `Dernier échange` de l'organisation via `majDernierEchange`.
6. Si `relance` est fourni avec un `intitule`, créer la tâche correspondante (statut `À faire`, responsable = auteur, `Interaction d'origine` = l'interaction créée) et la renvoyer.

⚠️ **Les étapes 5 et 6 ne doivent pas faire échouer l'enregistrement de l'interaction.** Si la mise à jour de la date ou la création de la relance échoue, l'interaction reste enregistrée et la réponse le signale. Perdre un compte rendu déjà saisi est le pire résultat possible : c'est exactement ce qui décourage de journaliser.

Réponse : `{ data: { interaction, tache: tache|null, avertissements: [] } }`.

- [ ] **Étape 2 : `PATCH /taches/:id`**

Corps : `{ statut }`, validé contre `['À faire', 'Faite', 'Annulée']`. Toute autre valeur répond 400. Sert au bouton « fait » du tableau de bord.

- [ ] **Étape 3 : Enrichir `GET /organisations/:id`**

Ajouter à la réponse :
- `interactions` : celles de l'organisation, **triées de la plus récente à la plus ancienne**, allégées à `{ id, canal, sens, date, compteRendu, auteur, assisteeIA, interlocuteurIds }`
- `taches` : celles de l'organisation, allégées à `{ id, intitule, echeance, statut, responsable }`

⚠️ Charger interactions et tâches **une seule fois** par requête, sans appel par organisation. Si leur chargement échoue, la fiche s'affiche en mode dégradé (listes vides) plutôt que de renvoyer 500.

- [ ] **Étape 4 : Tableau de bord**

Dans le bloc Macao, ajouter, **dans un `try/catch` isolé** afin qu'une panne ne rende pas la page blanche :
- `relances` : le résultat de `classerRelances`, limité aux champs utiles à l'affichage, avec le nom de l'organisation de chaque tâche
- `relancesEnRetard` et `relancesCetteSemaine` : les deux compteurs

En cas d'échec : `relances` vaut `null` et les deux compteurs `null`.

- [ ] **Étape 5 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
node --check server/routes/intranet/data.js
node --test
env -u RESEND_API_KEY JWT_SECRET=test PORT=5274 AIRTABLE_TOKEN=faux node server/server.js &
# attendre que le port écoute (le démarrage est lent sur cette machine), puis :
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:5274/api/health
curl -s -o /dev/null -w "opportunities=%{http_code}\n" http://localhost:5274/api/opportunities
curl -s -o /dev/null -w "interactions_sans_session=%{http_code}\n" -X POST http://localhost:5274/api/intranet/interactions
kill %1
```
Attendu : `# pass 61`, puis `health=200`, `opportunities=200`, `interactions_sans_session=401`.

- [ ] **Étape 6 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add ecran-affichage-dynamique/server
git commit -m "feat(crm): interaction logging with optional follow-up, task status, dashboard follow-ups"
```

---

## Phase C — Portail

### Tâche 5 : Méthodes API

**Fichier :** Modifier `intranet-macao/src/lib/api.js`

- [ ] **Étape 1 : Ajouter dans l'objet `api`**

```javascript
  // Journal et relances — réservé à Macao
  journaliserEchange: (corps) =>
    appel('/interactions', { method: 'POST', body: JSON.stringify(corps) }),
  changerStatutTache: (id, statut) =>
    appel(`/taches/${id}`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
```

- [ ] **Étape 2 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/lib/api.js
git commit -m "feat(crm): API methods for logging and follow-ups"
```

### Tâche 6 : Le formulaire rapide

**Fichier :** Créer `intranet-macao/src/components/FormulaireEchange.jsx`

**⚠️ C'est la pièce dont dépend toute la livraison.** La spec pose une règle : **trente secondes**. Un formulaire plus long ne sera pas rempli, et le module n'aura servi à rien.

- [ ] **Étape 1 : Implémenter**

Props : `organisation` (avec `nom`, `id`, `interlocuteurs`), `onEnregistre(resultat)`, `onAnnuler()`.

Champs, dans cet ordre :
1. **Canal** — boutons ou liste : Email, Appel, SMS, WhatsApp, Visioconférence, Rendez-vous, LinkedIn, Courrier, Formulaire du site, Autre. Défaut : `Appel`.
2. **Sens** — Sortant / Entrant. Défaut : `Sortant`.
3. **Date** — préremplie à **aujourd'hui**.
4. **Compte rendu** — zone de texte, le champ principal, avec le focus à l'ouverture.
5. **Interlocuteur** — facultatif, liste des interlocuteurs de l'organisation.
6. **Assistée par IA** — case à cocher discrète.
7. **« Prévoir une relance »** — case à cocher qui révèle deux champs : intitulé et échéance. C'est le geste structurant : rien d'autre ne doit lui voler la vedette.

**L'avertissement de démarchage** : si l'interlocuteur choisi porte `opposition`, afficher un bandeau rouge sans ambiguïté. Si le canal est SMS ou WhatsApp et que `consentementSmsWhatsapp` ne vaut pas `Accordé`, afficher un avertissement orange rappelant que ces canaux exigent un accord préalable. **Ne pas bloquer l'enregistrement** — on journalise aussi ce qui a déjà eu lieu.

Pendant l'envoi : désactiver le bouton, afficher « Enregistrement… ». En cas d'erreur, **conserver le contenu saisi** — ne jamais vider le compte rendu.

- [ ] **Étape 2 : Vérifier le build**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
```

⚠️ Le composant n'étant pas encore utilisé, il ne sera pas dans le bundle : le build vert ne prouve rien. Compile-le séparément pour t'en assurer et dis-le dans ton rapport.

- [ ] **Étape 3 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/components/FormulaireEchange.jsx
git commit -m "feat(crm): thirty-second interaction form with optional follow-up"
```

### Tâche 7 : Journal et bloc relances

**Fichiers :** Créer `intranet-macao/src/components/JournalEchange.jsx` et `intranet-macao/src/components/dash/BlocRelances.jsx`

- [ ] **Étape 1 : `JournalEchange.jsx`**

Props : `interactions` (tableau). Affiche la liste chronologique, la plus récente en premier : date, canal, sens, auteur, puis le compte rendu. Marquer discrètement les interactions `assisteeIA`. Si la liste est vide : « Aucun échange journalisé. »

Normaliser avec `Array.isArray(...) ? ... : []`, comme le reste du projet.

- [ ] **Étape 2 : `BlocRelances.jsx`**

Props : `relances` (`{ enRetard, cetteSemaine, plusTard }` ou `null`), `onMarquerFaite(id)`, `enCours`.

Trois groupes, dans cet ordre : **en retard** (en rouge `macao-terra`), **cette semaine**, puis le simple **nombre** de relances plus lointaines. Chaque ligne : intitulé, nom de l'organisation, échéance, responsable, et un bouton **« Fait »**.

Si `relances` vaut `null` : « Relances indisponibles. » Si les trois groupes sont vides : « Aucune relance en attente. » — et c'est une bonne nouvelle, pas une erreur.

- [ ] **Étape 3 : Vérifier et commiter**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/components
git commit -m "feat(crm): interaction journal and follow-up dashboard block"
```

### Tâche 8 : Câblage

**Fichiers :** Modifier `pages/OrganisationDetail.jsx` et `pages/Dashboard.jsx`

- [ ] **Étape 1 : Fiche organisation**

Ajouter, entre la section Interlocuteurs et la section Opportunités :
- un bouton **« Journaliser un échange »** qui ouvre `FormulaireEchange` ;
- le **journal** (`JournalEchange`) alimenté par `o.interactions`.

Après enregistrement, recharger la fiche pour que le journal, `dernierEchange` et les tâches soient à jour. Fermer le formulaire.

- [ ] **Étape 2 : Tableau de bord**

Placer `BlocRelances` **avant** les bandes d'indicateurs — c'est ce qu'on doit voir en premier en ouvrant l'intranet. Alimenter avec `donnees.relances`, et brancher `onMarquerFaite` sur `api.changerStatutTache(id, 'Faite')`, en rechargeant ensuite.

Ajouter les deux indicateurs à la bande dossiers ou dans une bande dédiée : **relances en retard** (couleur `terra`) et **relances cette semaine** (couleur `gold`).

⚠️ `StatBand` attend un **nom** de couleur, pas un hexadécimal.
⚠️ Convention du projet : `—` plutôt que `0`, **sauf** pour un indicateur d'hygiène dont le zéro est une bonne nouvelle — c'est le cas de « relances en retard ». Utiliser `?? null` et non `|| null`, comme cela a été fait pour « sans organisation ».

- [ ] **Étape 3 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
cd ../ecran-affichage-dynamique && node --test
```
Attendu : `✓ built`, puis `# pass 61`, `# fail 0`. C'est le premier build qui compile réellement les trois nouveaux composants.

- [ ] **Étape 4 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src
git commit -m "feat(crm): wire journal into organisation page and follow-ups into dashboard"
```

---

## Phase D — Mise en service

### Tâche 9 : Vérifier, déployer, documenter

- [ ] **Étape 1 : Vérification complète**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique && node --test
cd ../intranet-macao && npm run build
cd .. && git diff main...HEAD --numstat -- ecran-affichage-dynamique/server/services/airtableClient.js
```
Attendu : `# pass 61`, `✓ built`, et **aucune sortie** de la dernière commande — l'Écran TV n'a pas été touché du tout.

- [ ] **Étape 2 : Cloisonnement des rôles**

Avec une session **Coworker** : `POST /api/intranet/interactions` et `PATCH /api/intranet/taches/:id` doivent répondre **403**, et le tableau de bord ne doit contenir ni `relances`, ni `relancesEnRetard`, ni `relancesCetteSemaine`.

- [ ] **Étape 3 : Fusionner** — **demander l'accord avant**, la fusion déclenche la mise en production.

- [ ] **Étape 4 : Vérifier la production**

```bash
curl -s -o /dev/null -w "tv_health=%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/health
curl -s -o /dev/null -w "tv_opportunites=%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/opportunities
curl -s -o /dev/null -w "portail=%{http_code}\n" https://intranet-macao.vercel.app
curl -s -o /dev/null -w "interactions_401=%{http_code}\n" -X POST https://intranet-macao.vercel.app/api/intranet/interactions
```
Attendu : `200`, `200`, `200`, `401`.

- [ ] **Étape 5 : Parcours réel**

Se connecter, ouvrir une organisation, **journaliser un échange en cochant « prévoir une relance »**, puis vérifier dans Airtable que l'interaction existe, que la tâche existe et pointe vers elle, et que `Dernier échange` de l'organisation a été mis à jour. Enfin, marquer la relance **faite** depuis le tableau de bord.

C'est le seul test qui valide la promesse de la livraison.

- [ ] **Étape 6 : Documenter**

Dans `REPRISE-PROJET.md` : ajouter `Interactions` et `Tâches` au tableau des tables avec leurs identifiants, et cocher 3b dans la feuille de route. **Y inscrire l'avertissement du §5 de la spec** : enregistrer une opposition ne la fait pas respecter tant que 3d n'existe pas.

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add REPRISE-PROJET.md
git commit -m "docs: record journal tables and the un-enforced opposition caveat"
```

---

## Auto-revue (couverture de la spec)

| Exigence de la spec | Tâche |
|---|---|
| §4 Table Interactions, 10 canaux | 1 |
| §4 Table Tâches, lien vers l'interaction d'origine | 1, 4 étape 1 |
| §4 Trois champs de consentement sur Interlocuteurs | 1 étape 4 |
| §2 Formulaire en trente secondes | 6 |
| §2 Un geste enregistre le passé et programme l'avenir | 4 étape 1, 6 |
| §3 `Dernier échange` alimenté automatiquement, sans reculer | 3 (`majDernierEchange`), 4 étape 1 |
| §5 Règles de démarchage par canal | 2 (`peutEtreDemarche`), 6 (avertissements) |
| §5 L'avertissement informe sans bloquer | 6 |
| §6 Classement au jour et non à l'instant | 2 (`classerRelances`, étape 5 sous 4 fuseaux) |
| §7 Journal chronologique sur la fiche | 7, 8 |
| §7 Bloc « Vos relances » en tête du tableau de bord | 7, 8 étape 2 |
| §7 Deux indicateurs | 8 étape 2 |
| §9 `Référence` figée à la création | 2 (`referenceInteraction`), commentaire |

**Placeholders :** deux, incontournables — les identifiants des tables `Interactions` et `Tâches` à la tâche 3, qui n'existent qu'après la tâche 1. L'étape 5 de la tâche 1 impose de les relever.

**Cohérence des noms :** `peutEtreDemarche`, `classerRelances`, `referenceInteraction`, `listInteractions`, `listTaches`, `creerInteraction`, `creerTache`, `majTache`, `majDernierEchange` — identiques entre définition et usage. Les propriétés (`canal`, `sens`, `date`, `compteRendu`, `auteur`, `assisteeIA`, `intitule`, `echeance`, `statut`, `responsable`, `opposition`, `consentementSmsWhatsapp`) sont identiques du mappeur Airtable aux composants React. Les groupes `enRetard`, `cetteSemaine`, `plusTard` sont nommés pareil du service au composant.
