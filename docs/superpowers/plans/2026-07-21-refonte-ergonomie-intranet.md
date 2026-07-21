# Refonte de l'ergonomie de l'intranet — Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** faire de l'intranet un poste de travail lisible — quatre entrées de menu, un écran qui dit quoi faire, des actions visibles, et une interface utilisable sur iPhone.

**Architecture :** refonte d'interface **exclusivement**. Aucun fichier de `ecran-affichage-dynamique/` n'est modifié. Le vocabulaire de l'interface change (« Projets », « Devis », « Clients & prospects ») sans toucher aux routes ni aux données.

**Stack :** React + Vite + Tailwind.

**Spec :** `docs/superpowers/specs/2026-07-21-refonte-ergonomie-intranet-design.md`

---

## Règles absolues de cette refonte

**⚠️ Aucune modification hors `intranet-macao/src/`.** Le backend, Airtable et l'Écran TV — affiché en permanence dans les locaux du client — ne doivent pas être touchés. Cette commande doit rester sans sortie à chaque étape :

```bash
git diff main...HEAD --numstat -- ecran-affichage-dynamique/
```

**⚠️ Les routes ne changent pas.** `/opportunites`, `/dossiers`, `/organisations`, `/annuaire`, `/profil` restent telles quelles. Seuls les **libellés** changent. Renommer les routes casserait les liens sans bénéfice.

**⚠️ Les données affichées ne changent pas.** Aucun nouveau champ n'est demandé au serveur. Si un indicateur souhaité n'existe pas dans la réponse, on ne l'invente pas — on le note comme reporté.

**⚠️ `npm run build` peut se bloquer sur `transforming…`.** C'est un processus résiduel, pas le code : `pkill -f "vite build"` puis relancer.

## Ce que le tableau de bord reçoit réellement du serveur

Recensé dans le code existant. **Ne rien utiliser d'autre.**

| Clé | Contenu | Rôle |
|---|---|---|
| `role` | `Macao` / `Coworker` / `Freelance` | tous |
| `totalOpportunites` | nombre | tous |
| `echeancesProches` | échéances sous **30** jours | tous |
| `aAnalyser` | nombre | Macao |
| `prioritaires` | `[{ id, name, client, status, score }]` | Macao |
| `parStatut` | `{ statut: nombre }` | Macao |
| `sansOrganisation` | nombre | Macao |
| `dossiersEnCours`, `aDeposer`, `dossiersBloques` | nombres | Macao |
| `relances` | `{ enRetard, cetteSemaine, plusTard }` ou `null` | Macao |
| `relancesEnRetard`, `relancesCetteSemaine` | nombres ou `null` | Macao |
| `opportunites` | `[{ id, name, client }]` | Coworker / Freelance |

⚠️ **« Clients actifs », évoqué au §5 de la spec, n'existe pas dans cette réponse.** Ne pas l'inventer : le remplacer par `sansOrganisation` et signaler le report dans le rapport final.

⚠️ `echeancesProches` couvre **30 jours**, pas 7. Le libellé doit dire la vérité.

## Structure des fichiers

| Fichier | Action |
|---|---|
| `src/layout/Shell.jsx` | Réécrit : 4 entrées, profil en pied, tiroir mobile |
| `src/pages/Dashboard.jsx` | Réécrit : trois blocs |
| `src/components/dash/BlocATraiter.jsx` | Créé |
| `src/components/BarreActions.jsx` | Créé |
| `src/components/SectionRepliable.jsx` | Créé |
| `src/pages/Opportunities.jsx` | Titres, barre d'actions, pipeline déplacé ici |
| `src/pages/Dossiers.jsx`, `DossierDetail.jsx` | Titres, barre d'actions |
| `src/pages/Organisations.jsx`, `OrganisationDetail.jsx` | Titres, barre d'actions, sections repliables |
| `src/pages/Directory.jsx`, `Profile.jsx` | Titres |

---

## Tâche 1 : La coquille — menu à quatre entrées et tiroir mobile

**Fichier :** Réécrire `intranet-macao/src/layout/Shell.jsx`

Lire le fichier actuel avant de commencer : la logique de filtrage par rôle (`!lien.role || lien.role === user?.role`) doit être **conservée**.

- [ ] **Étape 1 : Remplacer le tableau `LIENS`**

```javascript
// Quatre destinations, ordonnées par fréquence d'usage : ce qu'on regarde
// chaque matin, puis le travail en cours, puis les référentiels.
// Les routes ne changent pas — seuls les libellés parlent enfin le langage
// de l'agence plutôt que celui des marchés publics.
const LIENS = [
  { to: '/', libelle: "Aujourd'hui", end: true },
  { to: '/opportunites', libelle: 'Projets' },
  { to: '/organisations', libelle: 'Clients & prospects', role: 'Macao' },
  { to: '/annuaire', libelle: 'Communauté' }
]
```

⚠️ **`/dossiers` disparaît du menu mais la route reste active.** Les devis se rejoignent depuis un projet et depuis « Aujourd'hui ». Ne pas supprimer la route dans `App.jsx`.

- [ ] **Étape 2 : Le profil en pied de barre**

Dans le bloc de pied existant (celui qui affiche l'email, le rôle et le bouton de déconnexion), ajouter **au-dessus** un lien discret vers `/profil` libellé « Mon profil ». Il ne doit plus figurer dans `LIENS`.

- [ ] **Étape 3 : Le tiroir mobile**

La barre est aujourd'hui `w-60` en dur : sur iPhone, elle mange l'écran.

Ajouter un état local `menuOuvert`. Comportement attendu :

- **Sur mobile** (`< lg`) : la barre latérale est masquée par défaut. Un en-tête fixe apparaît en haut avec le nom « Macao » et un bouton d'ouverture (☰). Ouvert, le menu se superpose au contenu avec un fond semi-transparent cliquable pour fermer.
- **À partir de `lg`** : comportement actuel, barre fixe visible en permanence, pas de bouton.

Le menu doit **se fermer automatiquement** quand on clique une entrée — sinon il masque la page qu'on vient d'ouvrir.

Cibles tactiles d'au moins **44 px** de haut sur les liens et le bouton.

- [ ] **Étape 4 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
```
Attendu : `✓ built`.

- [ ] **Étape 5 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/layout/Shell.jsx
git commit -m "refactor(ui): four-entry menu, profile in footer, mobile drawer"
```

---

## Tâche 2 : Le bloc « À traiter »

**Fichier :** Créer `intranet-macao/src/components/dash/BlocATraiter.jsx`

C'est le cœur de la refonte : la première chose qu'on voit doit dire **quoi faire**, pas combien.

- [ ] **Étape 1 : Implémenter**

Props : `donnees` (la réponse du tableau de bord), `onMarquerFaite(id)`, `enCours`.

Le composant assemble une liste d'**alertes actionnables**, chacune étant un lien vers l'endroit où agir :

1. **Relances en retard** — une ligne par relance de `donnees.relances?.enRetard`, avec intitulé, client, échéance, et un bouton « Fait » appelant `onMarquerFaite`.
2. **Devis bloqués** — si `donnees.dossiersBloques > 0`, une ligne « N devis bloqués » liant vers `/dossiers`.
3. **Devis à rendre sous 7 jours** — si `donnees.aDeposer > 0`, une ligne liant vers `/dossiers`.
4. **Relances cette semaine** — les entrées de `donnees.relances?.cetteSemaine`, présentées après les urgences.

Chaque ligne porte une pastille de couleur : `macao-terra` pour ce qui est en retard, `macao-gold` pour ce qui approche.

**Si rien n'est en attente**, afficher un message affirmatif — « Rien d'urgent aujourd'hui. » — et non un vide. C'est une bonne nouvelle, le ton doit le refléter.

**Si `donnees.relances` vaut `null`** (calcul en panne côté serveur), l'indiquer sans masquer les autres alertes.

Normaliser tous les tableaux avec `Array.isArray(x) ? x : []`.

- [ ] **Étape 2 : Vérifier et commiter**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/components/dash/BlocATraiter.jsx
git commit -m "feat(ui): actionable to-do block for the daily view"
```

---

## Tâche 3 : « Aujourd'hui » remplace le tableau de bord

**Fichier :** Réécrire `intranet-macao/src/pages/Dashboard.jsx`

La page compte aujourd'hui **six sections empilées et douze indicateurs**, dont le doublon « Échéances sous 30 j ». Elle doit tenir sur un écran.

⚠️ Lire le fichier actuel intégralement avant de le réécrire. Trois comportements sont à **conserver tels quels** — ils corrigent des défauts trouvés en revue :
- le garde `if (erreur && !donnees)`, qui distingue l'échec initial de l'échec de rechargement ;
- le garde `if (relanceEnCours) return` contre le double clic ;
- le message signalant que les relances peuvent être obsolètes après un rechargement raté.

- [ ] **Étape 1 : Restructurer la page**

Titre : **« Aujourd'hui »**. Sous-titre selon le rôle.

Trois blocs, dans cet ordre :

**1. À traiter** — le composant `BlocATraiter` (Macao uniquement ; un Coworker n'a ni relances ni devis).

**2. Nouveaux projets** — pour Macao, la liste `prioritaires` sous le titre « Nouveaux projets à trier ». Pour un Coworker, `opportunites` sous « Projets ouverts ». Reprendre le rendu existant des cartes.

**3. En bref** — **quatre indicateurs, pas plus** :

```javascript
const stats = estMacao
  ? [
      { label: 'Projets en cours', valeur: donnees.totalOpportunites, couleur: 'terra' },
      { label: 'À trier', valeur: donnees.aAnalyser, couleur: 'gold' },
      { label: 'Devis en cours', valeur: donnees.dossiersEnCours || null, couleur: 'teal' },
      // Indicateur d'hygiène : zéro est l'état visé, `??` le laisse passer.
      { label: 'Projets sans client', valeur: donnees.sansOrganisation ?? null, couleur: 'ink' }
    ]
  : [
      { label: 'Projets ouverts', valeur: donnees.totalOpportunites, couleur: 'terra' },
      { label: 'Échéances sous 30 j', valeur: donnees.echeancesProches || null, couleur: 'teal' }
    ]
```

**Ce qui disparaît de cette page** : le doublon « Échéances sous 30 j », « Opportunités notées », « Sans organisation » (renommé et conservé), les trois indicateurs dossiers (repris dans le bloc « À traiter »), les deux indicateurs de relances (idem), et la section « Pipeline par statut » — **déplacée à la tâche 4**, pas supprimée.

- [ ] **Étape 2 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
```

Compter les indicateurs rendus : il doit y en avoir **4 pour Macao**, **2 pour un Coworker**.

- [ ] **Étape 3 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src/pages/Dashboard.jsx
git commit -m "refactor(ui): daily view — three blocks, four figures instead of twelve"
```

---

## Tâche 4 : Barre d'actions et vocabulaire des pages

**Fichiers :** Créer `src/components/BarreActions.jsx`, puis modifier les pages.

- [ ] **Étape 1 : Le composant d'en-tête**

`BarreActions` reçoit `titre`, `sousTitre` et `enfants` (les boutons d'action). Il rend un en-tête où le titre est à gauche et les actions **à droite**, avec un repli en colonne sous `sm` pour le mobile.

- [ ] **Étape 2 : Appliquer les nouveaux libellés**

| Page | Ancien titre | Nouveau titre |
|---|---|---|
| `Opportunities.jsx` | Opportunités | **Projets** |
| `Dossiers.jsx` | Dossiers de réponse | **Devis** |
| `DossierDetail.jsx` | (retour) « Tous les dossiers » | « Tous les devis » |
| `Organisations.jsx` | Organisations | **Clients & prospects** |
| `Directory.jsx` | Annuaire | **Communauté** |

Dans les textes de ces pages, remplacer « opportunité » par « projet » et « dossier de réponse » par « devis ». **Ne pas toucher aux valeurs de statut** (`À analyser`, `GO`, `Déposé`…) : elles viennent d'Airtable.

- [ ] **Étape 3 : Remonter les actions**

Sur `OrganisationDetail.jsx`, le bouton « Journaliser un échange » passe dans la barre d'actions, libellé **« Noter un échange »**. Sur `Opportunities.jsx`, les boutons de chaque carte restent en place — ils sont contextuels à la ligne, pas à la page.

- [ ] **Étape 4 : Déplacer le pipeline**

La section « Pipeline par statut » quitte le tableau de bord pour la page **Projets**, où elle a du sens. Le composant `PipelineBars` existe déjà.

⚠️ `parStatut` est renvoyé par `/dashboard`, pas par `/opportunities`. Deux options : appeler aussi `api.tableauDeBord()` depuis la page Projets, ou **calculer la répartition côté client** à partir des projets déjà chargés. **Préférer la seconde** — pas d'appel réseau supplémentaire, et la donnée est déjà là.

- [ ] **Étape 5 : Vérifier et commiter**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src
git commit -m "refactor(ui): agency vocabulary, action bars, pipeline moved to projects page"
```

---

## Tâche 5 : Sections repliables sur les fiches

**Fichiers :** Créer `src/components/SectionRepliable.jsx`, puis l'appliquer.

- [ ] **Étape 1 : Le composant**

Props : `titre`, `compteur` (nombre ou `null`), `ouvertParDefaut`, `enfants`.

Un `<details>`/`<summary>` natif suffit — accessible au clavier sans code supplémentaire. Le titre affiche le compteur entre parenthèses quand il est fourni, pour qu'on sache ce que contient la section sans l'ouvrir.

- [ ] **Étape 2 : `OrganisationDetail.jsx`**

Cinq sections aujourd'hui empilées. Nouvel ordre et état par défaut :

| Section | Ouverte ? |
|---|---|
| Interlocuteurs | ✅ |
| Journal des échanges | ✅ |
| Projets | repliée, avec compteur |
| Devis | repliée, avec compteur |
| Informations | repliée |

- [ ] **Étape 3 : `DossierDetail.jsx`**

Les trois chantiers et la check-list des pièces restent visibles. La section « Informations » se replie.

- [ ] **Étape 4 : Vérifier et commiter**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src
git commit -m "refactor(ui): collapsible sections with counters on record pages"
```

---

## Tâche 6 : Passe mobile

**Fichiers :** toutes les pages de `intranet-macao/src/pages/`

L'interface n'a jamais été regardée sur un petit écran.

- [ ] **Étape 1 : Corriger les points bloquants**

Parcourir chaque page et corriger :
- les `px-8 py-10` fixes → `px-4 py-6 sm:px-8 sm:py-10`
- les grilles à colonnes fixes → une colonne sous `sm`
- les tableaux de définition à largeur fixe (`w-44`, `w-52`) → empilés sous `sm`
- les lignes d'informations en `flex` sans `flex-wrap` → ajouter `flex-wrap`
- les boutons en dessous de 44 px de haut

- [ ] **Étape 2 : Vérifier**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao && npm run build
```

Si un navigateur est disponible, contrôler le rendu à **375 px** de large : aucun défilement horizontal, aucun texte tronqué, tous les boutons atteignables.

- [ ] **Étape 3 : Commit**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git add intranet-macao/src
git commit -m "refactor(ui): responsive pass across all pages"
```

---

## Tâche 7 : Vérifier, déployer, documenter

- [ ] **Étape 1 : Le backend n'a pas bougé**

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion
git diff main...HEAD --numstat -- ecran-affichage-dynamique/
```
Attendu : **aucune sortie**. Si quoi que ce soit apparaît, **arrêter et signaler** — cette refonte ne doit pas toucher au backend.

- [ ] **Étape 2 : Tests et build**

```bash
cd ecran-affichage-dynamique && node --test
cd ../intranet-macao && npm run build
```
Attendu : `# pass 65`, `# fail 0`, puis `✓ built`.

⚠️ `node --test tests/` échoue sur cette machine — utiliser `node --test` seul.

- [ ] **Étape 3 : Contrôle des critères de la spec**

- Le tableau de bord tient-il sur un écran d'ordinateur sans défiler ?
- Le menu compte-t-il quatre entrées plus le profil en pied ?
- Reste-t-il un doublon parmi les indicateurs ?
- Le mot « opportunité » subsiste-t-il dans un libellé visible ?

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/intranet-macao
grep -rn "Opportunités\|Dossiers de réponse\|Tableau de bord\|Annuaire" src/ | grep -v "^src/lib/api.js"
```
Chaque occurrence restante doit être justifiée (par exemple un statut Airtable), sinon corrigée.

- [ ] **Étape 4 : Fusionner** — **demander l'accord avant**, la fusion déclenche la mise en production.

- [ ] **Étape 5 : Vérifier la production**

```bash
curl -s -o /dev/null -w "tv_opportunites=%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/opportunities
curl -s -o /dev/null -w "portail=%{http_code}\n" https://intranet-macao.vercel.app
```
Attendu : `200`, `200`. L'Écran TV doit être vérifié **visuellement** : c'est lui qui tourne en permanence chez le client.

- [ ] **Étape 6 : Documenter**

Dans `REPRISE-PROJET.md`, ajouter une section sur le vocabulaire :

> **⚠️ L'interface et Airtable parlent deux langues.** « Projet » à l'écran = « Opportunité » dans Airtable. « Devis » = « Dossier de réponse ». « Clients & prospects » = « Organisations ». Choix assumé lors de la refonte du 2026-07-21 : aligner les noms Airtable aurait touché tout le code d'écriture pour un bénéfice nul côté utilisateur.

```bash
git add REPRISE-PROJET.md
git commit -m "docs: record the UI/Airtable vocabulary divergence"
```

---

## Auto-revue (couverture de la spec)

| Exigence de la spec | Tâche |
|---|---|
| §4 Menu à quatre entrées, profil en pied | 1 |
| §4 Correspondance des libellés | 1, 4 |
| §4 Routes inchangées | 1 (garde explicite) |
| §5 Trois blocs, dont « À traiter » actionnable | 2, 3 |
| §5 Quatre chiffres au lieu de douze | 3 |
| §5 Cloisonnement par rôle reflété | 3 |
| §6 Actions en haut à droite | 4 |
| §7 Une information principale, le reste replié | 5 |
| §8 Mobile, tablette, ordinateur | 1 (tiroir), 6 (passe complète) |
| §9 Aucune modification hors interface | 7 étape 1 |
| §10 Critères de réussite | 7 étape 3 |
| §11 Divergence de vocabulaire documentée | 7 étape 6 |

**Écart assumé avec la spec :** « clients actifs », cité au §5 comme quatrième indicateur, **n'existe pas** dans la réponse du serveur. Il est remplacé par « Projets sans client » et le report doit être signalé — l'ajouter demanderait une modification backend, hors périmètre.

**Placeholders :** aucun. Les tâches 1, 3, 4 et 6 demandent de lire le fichier existant avant de le modifier, ce qui est une consigne, pas une omission.

**Cohérence des noms :** `BlocATraiter`, `BarreActions`, `SectionRepliable` — identiques entre création et usage. Les libellés « Aujourd'hui », « Projets », « Devis », « Clients & prospects », « Communauté » sont employés uniformément du menu aux titres de page.
