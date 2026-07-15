# Plateforme Coworkers LE 10 — Plan d'implémentation

> **Nature du plan :** guide de construction dans des outils no-code (Airtable, Jotform, Airtable AI). Pas de tests automatisés — chaque tâche se termine par une **vérification manuelle**. L'assistant guide l'utilisateur pas-à-pas (il n'a pas d'accès API direct à ces outils).

**Objectif :** construire le MVP d'une plateforme où Macao gère les opportunités et où les coworkers du 10 les suivent, se positionnent et échangent.

**Architecture :** Airtable = source unique (6 tables). Jotform alimente Coworkers + Contacts. Airtable AI enrichit et matche les opportunités. Interfaces Airtable avec accès par rôle.

**Stack :** Airtable · Jotform · Airtable AI.

**Spec de référence :** `docs/superpowers/specs/2026-07-15-plateforme-coworkers-design.md`

---

## Phase 0 — Prérequis (comptes)

### Tâche 0.1 : Comptes prêts
- [ ] Compte **Airtable** créé (plan Team recommandé pour l'IA et les Interfaces ; à défaut, plan gratuit pour commencer, IA limitée).
- [ ] Compte **Jotform** créé (plan gratuit suffisant pour 2 formulaires).
- [ ] **Vérification :** se connecter aux deux, créer une base Airtable vide nommée « LE 10 — Plateforme Coworkers ».

---

## Phase 1 — Base Airtable (Livrable 2)

> On crée les tables dans l'ordre des dépendances : Métiers d'abord (référentiel), puis Coworkers et Opportunités qui s'y relient, puis les jonctions.

### Tâche 1.1 : Table « Métiers » (référentiel)

**Table :** renommer la table par défaut « Table 1 » en **Métiers**.

- [ ] **Champs :**
  - `Métier` — Single line text (champ principal)
  - `Catégorie` — Single select : `Création`, `Digital`, `Contenu`, `Conseil`, `Production`
- [ ] **Peupler** les 15 métiers (aligné sur le Notion existant) :
  - Création : Graphiste, Directeur artistique, Illustrateur, Photographe, Vidéaste
  - Digital : Webdesigner, Développeur web, Consultant SEO, Consultant IA / no-code
  - Contenu : Rédacteur, Community manager
  - Conseil : Consultant communication, Formateur, Relations presse
  - Production : Événementiel
- [ ] **Vérification :** la table contient 15 lignes, chacune avec une catégorie.

### Tâche 1.2 : Table « Coworkers »

**Table :** créer **Coworkers**.

- [ ] **Champs :**
  - `Prénom` — Single line text
  - `Nom` — Single line text
  - `Nom complet` — Formula : `{Prénom} & " " & {Nom}` — définir comme champ principal
  - `Email` — Email
  - `Téléphone` — Phone number
  - `Bio` — Long text
  - `Portfolio / site` — URL
  - `Photo` — Attachment
  - `Disponibilité` — Single select : `Disponible`, `Partiellement`, `Indisponible`
  - `Métiers / compétences` — Link to another record → **Métiers** (autoriser plusieurs)
  - `Statut` — Single select : `En attente de validation`, `Actif`, `Inactif`
  - `Rôle` — Single select : `Coworker`, `Macao`
  - `Date d'inscription` — Created time
- [ ] **Créer 3 lignes Macao** manuellement : Daniel, Dominique, Mathieu (Rôle = Macao, Statut = Actif).
- [ ] **Vérification :** ajouter un coworker test avec 2 métiers → les métiers apparaissent bien liés (et réciproquement visibles dans la table Métiers).

### Tâche 1.3 : Table « Opportunités »

**Table :** créer **Opportunités**.

- [ ] **Champs :**
  - `Nom` — Single line text (champ principal)
  - `Objet` — Long text
  - `Acheteur / client` — Single line text
  - `Type d'opportunité` — Single select : `Appel d'offres`, `Consultation`, `Demande de devis`, `Marché public`, `Projet privé`, `Subvention`, `Autre`
  - `Source` — Single select : `BOAMP`, `France Marchés`, `PLACE`, `Achatpublic`, `Réseau local`, `Client direct`, `Collectivité`, `Autre`
  - `Territoire` — Single select : `Agen`, `Lot-et-Garonne (47)`, `Nouvelle-Aquitaine`, `Occitanie`, `National`, `Autre`
  - `Budget estimé` — Number (format Euro, précision 0)
  - `Date limite` — Date
  - `Statut` — Single select : `À analyser`, `GO / NO GO à décider`, `GO`, `Transmis au Club`, `En réponse`, `Déposé`, `Gagné`, `Perdu`, `Archivé`
  - `Lien annonce` — URL
  - `Résumé IA` — Long text (rempli par l'IA en phase 4)
  - `Métiers détectés (texte)` — Long text (sortie IA intermédiaire, phase 4)
  - `Score pertinence` — Number (0–100)
  - `Métiers concernés` — Link → **Métiers** (autoriser plusieurs)
  - `Coworkers suggérés` — Link → **Coworkers** (autoriser plusieurs)
  - `Référent Macao` — Single select : `Daniel`, `Dominique`, `Mathieu`
  - `Date de détection` — Date
  - `Visible sur écran` — Checkbox (défaut coché)
- [ ] **Vérification :** créer une opportunité test, lier 1 métier et 1 coworker → liens réciproques OK.

### Tâche 1.4 : Tables de jonction « Positionnements » et « Commentaires »

- [ ] **Table Positionnements** — champs :
  - `Positionnement` — champ principal (Autonumber ou Formula `{Coworker} & " → " & {Opportunité}`)
  - `Coworker` — Link → **Coworkers** (un seul)
  - `Opportunité` — Link → **Opportunités** (un seul)
  - `Statut` — Single select : `Intéressé`, `Retenu par Macao`, `Écarté` (défaut `Intéressé`)
  - `Date` — Created time
  - `Note Macao` — Long text
- [ ] **Table Commentaires** — champs :
  - `Commentaire` — champ principal (Autonumber)
  - `Opportunité` — Link → **Opportunités** (un seul)
  - `Auteur` — Link → **Coworkers** (un seul)
  - `Message` — Long text
  - `Date` — Created time
- [ ] **Vérification :** créer 1 positionnement et 1 commentaire de test reliés à l'opportunité test → ils apparaissent dans la fiche de l'opportunité (champs liens réciproques).

### Tâche 1.5 : Table « Contacts / Demandes »

- [ ] **Table Contacts** — champs :
  - `Nom` — Single line text (champ principal)
  - `Email` — Email
  - `Type de demande` — Single select : `Rejoindre le Club`, `Proposer un projet`, `Partenariat`, `Autre`
  - `Message` — Long text
  - `Statut de traitement` — Single select : `Nouveau`, `En cours`, `Traité` (défaut `Nouveau`)
  - `Traité par` — Single select : `Daniel`, `Dominique`, `Mathieu`
  - `Date` — Created time
- [ ] **Vérification :** la table existe avec tous les champs ; ajouter une ligne test.

### Tâche 1.6 : Migration des 7 opportunités réelles depuis Notion

> Les 7 vraies opportunités (celles avec un acheteur) sont listées dans la spec / la base Notion. On laisse les 38 alertes brutes.

- [ ] Pour chacune des 7, créer une ligne dans **Opportunités** avec au minimum `Nom`, `Objet`, `Acheteur / client`, `Statut = À analyser`.
  - Refonte site internet et identité visuelle — Grand Villeneuvois
  - Cérémonie des vœux 2027 — Agglomération Pays de l'Or
  - Identité graphique et dispositifs d'accueil du site de Payolle — Ville de Campan
  - Organisation des Salons du livre — La Grande Motte
  - Programmation et audit technico-économique lycées Occitanie — Site EST
  - Conception graphique, impression et distribution du magazine Le Columérin — Colomiers
  - AMO transformation numérique — Hérault Logement
- [ ] **Vérification :** 7 opportunités présentes, chacune avec Nom + Objet + Acheteur renseignés.

---

## Phase 2 — Formulaires Jotform (Livrable 3)

### Tâche 2.1 : Formulaire A — Inscription coworker

- [ ] Créer un formulaire Jotform « Rejoindre le Club Com' Le 10 » avec les champs :
  - Prénom (Short text, requis)
  - Nom (Short text, requis)
  - Email (Email, requis)
  - Téléphone (Phone)
  - Bio / présentation (Long text)
  - Portfolio ou site web (Short text / URL)
  - Photo (File upload, 1 fichier image)
  - Métiers / compétences (Checkboxes — **exactement les 15 libellés** de la table Métiers)
  - Disponibilité (Single choice : Disponible / Partiellement / Indisponible)
  - Case de consentement RGPD (requise) : « J'accepte que mes données soient utilisées pour la mise en relation au sein du Club Com' Le 10. »
- [ ] **Vérification :** prévisualiser et soumettre un test — la soumission apparaît dans les résultats Jotform.

### Tâche 2.2 : Formulaire B — Contact / demande

- [ ] Créer un formulaire Jotform « Contact — Club Com' Le 10 » :
  - Nom (Short text, requis)
  - Email (Email, requis)
  - Type de demande (Single choice : Rejoindre le Club / Proposer un projet / Partenariat / Autre)
  - Message (Long text, requis)
- [ ] **Vérification :** soumettre un test → visible dans Jotform.

### Tâche 2.3 : Connexion Jotform → Airtable

- [ ] Dans chaque formulaire : **Settings → Integrations → Airtable**, autoriser, choisir la base « LE 10 — Plateforme Coworkers ».
- [ ] **Formulaire A** → table **Coworkers** : mapper champ à champ (Prénom→Prénom, … , Métiers→Métiers/compétences, Photo→Photo). Forcer `Statut = En attente de validation` (valeur par défaut Airtable ou champ caché Jotform).
- [ ] **Formulaire B** → table **Contacts** : mapper Nom, Email, Type de demande, Message. `Statut de traitement = Nouveau` par défaut.
- [ ] **Vérification bout-en-bout :** soumettre le formulaire A → une nouvelle ligne Coworker apparaît dans Airtable avec les bons métiers liés ; idem formulaire B → ligne Contact.

---

## Phase 3 — Interface Airtable & accès (Livrable 4)

### Tâche 3.1 : Interface « Espace Coworkers »

- [ ] Dans Airtable : **Interfaces → Create → Blank / Gallery**. Nom : « Espace Coworkers ».
- [ ] **Page Opportunités** : liste (Gallery ou Grid) filtrée sur `Visible sur écran = coché` et `Statut` ≠ `Archivé`/`Perdu`. Champs affichés : Nom, Acheteur, Résumé IA, Territoire, Date limite, Métiers concernés.
- [ ] **Détail opportunité** : ouvrir une fiche → afficher Objet/Résumé, bouton **« Ça m'intéresse »** (Button → crée une ligne Positionnements avec le coworker courant), et une liste des Commentaires + formulaire d'ajout.
- [ ] **Page Annuaire** : galerie des Coworkers `Statut = Actif` (Photo, Nom, Métiers, Bio, Portfolio).
- [ ] **Vérification :** en tant que coworker test, cliquer « Ça m'intéresse » → une ligne Positionnements est créée ; ajouter un commentaire → visible dans la fiche.

### Tâche 3.2 : Interface « Pilotage Macao »

- [ ] Créer une 2ᵉ interface « Pilotage Macao » :
  - **Pipeline opportunités** : vue groupée par `Statut` (édition du statut, du référent).
  - **Positionnements** : liste des intérêts par opportunité (avec Note Macao éditable).
  - **Inscriptions à valider** : Coworkers `Statut = En attente` → bouton passer à `Actif`.
  - **Contacts** : liste `Statut = Nouveau` à traiter.
- [ ] **Vérification :** changer un statut d'opportunité depuis l'interface → reflété dans la table.

### Tâche 3.3 : Accès par rôle

- [ ] **Partage Interfaces :** partager « Espace Coworkers » avec les coworkers (permission **Commenter/limitée**) ; « Pilotage Macao » réservé au groupe Macao (**Éditeur**).
- [ ] Restreindre l'accès direct aux tables (les coworkers passent par l'interface, pas par la base brute).
- [ ] **Vérification :** ouvrir « Espace Coworkers » dans une fenêtre privée avec un compte invité → on voit les opportunités mais pas la table brute ni le pilotage.

---

## Phase 4 — Agent IA (Livrable 5)

> Airtable AI. Deux automatisations déclenchées à la création/màj d'une opportunité.

### Tâche 4.1 : Enrichissement IA (Résumé + Score + Métiers détectés)

- [ ] Ajouter 3 **champs IA** (ou une automation « Run AI ») sur **Opportunités** :
  - **Résumé IA** — prompt :
    > « Tu es l'assistant de veille de l'agence Macao (communication). À partir de l'objet suivant, rédige un résumé de 2 à 3 phrases, clair et engageant, destiné à des professionnels de la communication. N'invente rien. Objet : {Objet} »
  - **Score pertinence** (0–100) — prompt :
    > « Évalue de 0 à 100 la pertinence de cette opportunité pour une agence de communication et un réseau de freelances com (plus le sujet est proche de la communication/création/digital, plus le score est haut). Réponds uniquement par un nombre. Objet : {Objet} »
  - **Métiers détectés (texte)** — prompt :
    > « Parmi cette liste EXACTE de métiers : [Graphiste, Directeur artistique, Illustrateur, Photographe, Vidéaste, Webdesigner, Développeur web, Consultant SEO, Consultant IA / no-code, Rédacteur, Community manager, Consultant communication, Formateur, Relations presse, Événementiel], liste ceux concernés par cette opportunité, séparés par des virgules. N'ajoute aucun autre mot. Objet : {Objet} »
- [ ] **Vérification :** sur une des 7 opportunités, les 3 champs se remplissent de manière cohérente.

### Tâche 4.2 : Matching → Coworkers suggérés

- [ ] Créer une **Automation** : déclencheur « quand Métiers détectés (texte) n'est pas vide ».
  - Étape script/recherche : pour chaque métier détecté, trouver les **Coworkers actifs** ayant ce métier, et remplir le lien **Coworkers suggérés** de l'opportunité.
  - (Alternative sans script : lier d'abord `Métiers concernés` puis utiliser un rollup/lookup pour lister les coworkers de ces métiers.)
- [ ] **Vérification :** une opportunité « Graphiste » suggère bien les coworkers dont les métiers incluent Graphiste.

### Tâche 4.3 : Notification

- [ ] Automation : quand `Coworkers suggérés` est renseigné → envoyer un email au **Référent Macao** (et optionnellement aux coworkers suggérés) avec le nom + résumé de l'opportunité et le lien vers l'interface.
- [ ] **Vérification :** créer une opportunité test → l'email de notification arrive.

---

## Phase 5 (hors MVP — pour mémoire)

- Rebrancher l'Écran TV (backend Express/Railway) sur l'API Airtable au lieu de Notion.
- IA de qualification à l'ingestion d'alertes email (ne créer que les vraies opportunités).
- Assistant conversationnel pour les coworkers.

---

## Auto-revue (couverture spec)

- Livrable 1 (schéma) : fait (hors plan). ✅
- Livrable 2 (base) : Phase 1. ✅
- Livrable 3 (Jotform) : Phase 2. ✅
- Livrable 4 (interface + accès) : Phase 3. ✅
- Livrable 5 (agent IA) : Phase 4. ✅
- Rôle IA MVP (enrichir + matcher) : Tâches 4.1–4.2. ✅
- Interaction coworker (intérêt + commentaires) : Tâches 1.4, 3.1. ✅
- Jotform (inscription + contact) : Tâches 2.1–2.3. ✅
- RGPD : consentement Tâche 2.1 ; accès Tâche 3.3. ✅
