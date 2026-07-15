# Plateforme Coworkers LE 10 — Conception (spec)

**Date :** 2026-07-15
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation

---

## 1. Cadre COSTAR

- **Contexte** — L'agence Macao détecte des opportunités (marchés publics, consultations, projets privés) dans le domaine de la communication. LE 10 Coworking (Agen) réunit une communauté de professionnels de la com. Aujourd'hui les opportunités vivent dans Notion et s'affichent sur un Écran TV ; les coworkers n'ont aucun moyen de les suivre ni d'interagir.
- **Objectif** — Une plateforme où Macao (Daniel, Dominique, Mathieu) gère les opportunités et où les coworkers du 10 les suivent en temps réel, manifestent leur intérêt et échangent.
- **Style / Ton** — Professionnel et chaleureux, aligné sur la charte LE 10 (vert pétrole #00252b, or #efad29, serif Lora + sans Work Sans).
- **Audience** — Deux groupes : *Macao* (administration complète) ; *Coworkers* (consultation + interaction légère).
- **Réponse attendue** — MVP rapide, puis itérations. Stack imposée : Airtable (données) + Jotform (collecte) + Airtable AI (enrichissement/matching).

## 2. Décisions d'architecture

- **Airtable est la source unique de vérité.** On ne fait pas tourner Airtable et Notion en parallèle (doublons, synchro fragile).
- **L'Écran TV existant est rebranché sur Airtable en phase 2**, pas maintenant — pour ne pas bloquer la plateforme. Le backend Express actuel (Railway) lit aujourd'hui l'API Notion ; il lira l'API Airtable en phase 2.
- **Migration** : on importe les 7 vraies opportunités depuis Notion ; on laisse les 38 lignes d'alerte email brutes.
- **Construction guidée** : l'assistant n'a pas d'accès API direct à Airtable/Jotform ; il produit la conception, les guides de construction pas-à-pas et les livrables documentés. La construction se fait dans les comptes Airtable/Jotform de Macao.

## 3. Modèle de données (6 tables)

### 3.1 Opportunités (cœur)
Alimentée par Macao (import Notion + saisie manuelle ; automatisation d'ingestion en phase 2).

| Champ | Type Airtable | Notes |
|---|---|---|
| Nom | Single line text | Titre de l'opportunité (champ principal) |
| Objet | Long text | Description détaillée (source du résumé IA) |
| Acheteur / client | Single line text | |
| Type d'opportunité | Single select | Appel d'offres, Consultation, Demande de devis, Marché public, Projet privé, Subvention, Autre |
| Source | Single select | BOAMP, France Marchés, PLACE, Réseau local, Client direct, … |
| Territoire | Single select | Agen, Lot-et-Garonne (47), Nouvelle-Aquitaine, Occitanie, National, Autre |
| Budget estimé | Number (€) | |
| Date limite | Date | Échéance de réponse |
| Statut | Single select | À analyser, GO / NO GO à décider, GO, Transmis au Club, En réponse, Déposé, Gagné, Perdu, Archivé |
| Lien annonce | URL | |
| Résumé IA | Long text | **Rempli par l'IA** |
| Score pertinence | Number (0–100) | **Rempli par l'IA** |
| Référent Macao | Single select / collaborator | Daniel, Dominique, Mathieu |
| Date de détection | Date | |
| Métiers concernés | Link → Métiers | **Complété par l'IA** ; pivot du matching |
| Coworkers suggérés | Link → Coworkers | **Rempli par l'IA** (matching) |
| Positionnements | Link → Positionnements | Auto (réciproque) |
| Commentaires | Link → Commentaires | Auto (réciproque) |
| Visible sur écran | Checkbox | Modération de l'Écran TV (compat. phase 2) |

### 3.2 Coworkers (membres du 10)
Alimentée par **Jotform (inscription)**.

| Champ | Type | Notes |
|---|---|---|
| Prénom | Single line text | |
| Nom | Single line text | |
| Nom complet | Formula | `Prénom & " " & Nom` (champ principal) |
| Email | Email | Clé d'identité |
| Téléphone | Phone | |
| Bio | Long text | |
| Portfolio / site | URL | |
| Photo | Attachment | |
| Disponibilité | Single select | Disponible, Partiellement, Indisponible |
| Métiers / compétences | Link → Métiers | Pivot du matching |
| Statut | Single select | En attente de validation, Actif, Inactif |
| Rôle | Single select | Coworker, Macao (admin) |
| Date d'inscription | Created time | |

### 3.3 Métiers / Compétences (référentiel)
Table fixe gérée par Macao. Pivot entre Opportunités et Coworkers.

| Champ | Type | Notes |
|---|---|---|
| Métier | Single line text | Graphiste, Directeur artistique, Webdesigner, Développeur web, Consultant com, Community manager, Rédacteur, Photographe, Vidéaste, Consultant SEO, Consultant IA/no-code, Formateur, Relations presse, Événementiel, Illustrateur |
| Catégorie | Single select | Création, Digital, Contenu, Conseil, Production |
| Opportunités | Link → Opportunités | |
| Coworkers | Link → Coworkers | |

### 3.4 Positionnements (« ça m'intéresse »)
Jonction Coworker × Opportunité, portant sa propre donnée. Créée depuis l'interface (1 clic).

| Champ | Type | Notes |
|---|---|---|
| Coworker | Link → Coworkers | |
| Opportunité | Link → Opportunités | |
| Statut | Single select | Intéressé, Retenu par Macao, Écarté |
| Date | Created time | |
| Note Macao | Long text | Suivi interne |

### 3.5 Commentaires (fil d'échange)
Un fil de discussion par opportunité.

| Champ | Type | Notes |
|---|---|---|
| Opportunité | Link → Opportunités | |
| Auteur | Link → Coworkers | |
| Message | Long text | |
| Date | Created time | |

### 3.6 Contacts / Demandes
Alimentée par **Jotform (contact externe)**.

| Champ | Type | Notes |
|---|---|---|
| Nom | Single line text | |
| Email | Email | |
| Message | Long text | |
| Type de demande | Single select | Rejoindre le Club, Proposer un projet, Partenariat, Autre |
| Statut de traitement | Single select | Nouveau, En cours, Traité |
| Traité par | Single select | Daniel, Dominique, Mathieu |
| Date | Created time | |

## 4. Relations

- **Métiers** relie **Opportunités ↔ Coworkers** (deux liens M:N) → base du matching IA.
- **Positionnements** = jonction Coworker × Opportunité (entité à part entière : date, statut, note).
- **Commentaires** = jonction Opportunité × Coworker (auteur).
- **Contacts** est autonome (aucun lien).

## 5. Flux de données

1. **Inscription** : coworker remplit le Jotform → crée une ligne *Coworkers* (statut « En attente »), avec ses *Métiers*. Macao valide → « Actif ».
2. **Nouvelle opportunité** : Macao saisit/importe une opportunité → **Airtable AI** remplit *Résumé IA*, *Métiers concernés*, *Score* et *Coworkers suggérés*.
3. **Notification** : une automatisation Airtable prévient par email les coworkers dont les métiers correspondent (phase MVP légère : email au référent + coworkers suggérés).
4. **Interaction** : le coworker consulte l'opportunité dans l'interface, clique « ça m'intéresse » (*Positionnements*) et/ou commente (*Commentaires*).
5. **Pilotage** : Macao suit les positionnements et fait avancer le *Statut*.
6. **Contact externe** : un prospect remplit le Jotform contact → table *Contacts* → traité par Macao.

## 6. Agent IA (Airtable AI)

**MVP — deux tâches à haute valeur, déclenchées à la création/màj d'une opportunité :**

- **Enrichir** : à partir de *Objet* (+ *Nom*, *Acheteur*), générer *Résumé IA* (2–3 phrases claires pour les coworkers), déduire *Métiers concernés* (parmi le référentiel), estimer un *Score de pertinence* (0–100) pour Macao/le Club.
- **Matcher** : croiser *Métiers concernés* avec les *Coworkers* actifs partageant ces métiers → remplir *Coworkers suggérés*.

**Phase 2 :**
- **Qualifier / filtrer** à l'entrée (utile si on rebranche l'ingestion d'alertes email : ne créer une fiche que si c'est une vraie opportunité).
- **Assistant conversationnel** pour les coworkers (« quelles opportunités en design ce mois-ci ? »).

## 7. Collecte Jotform (2 formulaires)

- **Formulaire A — Inscription coworker** → table *Coworkers*. Champs : Prénom, Nom, Email, Téléphone, Bio, Portfolio, Photo, Métiers (cases à cocher alignées sur le référentiel), Disponibilité.
- **Formulaire B — Contact / demande** → table *Contacts*. Champs : Nom, Email, Type de demande, Message.
- Connexion : intégration native Jotform → Airtable (mapping champ à champ documenté).

## 8. Interface Airtable & accès par rôle

- **Interface Coworker** : liste des opportunités (filtrées « visibles »), fiche détaillée avec bouton « ça m'intéresse » et fil de commentaires ; annuaire des coworkers. Lecture seule sur les données Macao.
- **Interface Macao (admin)** : gestion complète des opportunités (statut, référent), vue des positionnements, validation des inscriptions, traitement des contacts, déclenchement IA.
- **Accès** : basés sur le champ *Rôle* et les permissions de partage Airtable Interfaces (groupe Macao = éditeur ; groupe Coworkers = commentateur/limité).

## 9. Livrables (phasage)

1. **Schéma de base de données** — diagramme + ce document. *(livrable 1 — en cours)*
2. **Base Airtable structurée** — 6 tables, champs, liens, documentés.
3. **Formulaires Jotform connectés** — A (inscription) + B (contact) → Airtable.
4. **Interface Airtable** — vues Coworker + Macao, accès par rôle.
5. **Agent IA** — enrichir + matcher (Airtable AI).

## 10. Hors périmètre (phase 2+)

- Rebranchement de l'Écran TV sur Airtable.
- IA de qualification/filtrage à l'ingestion d'alertes.
- Assistant conversationnel coworkers.
- Constitution d'équipes / candidatures détaillées (non retenu : les coworkers manifestent leur intérêt, Macao pilote).

## 11. Risques & points d'attention

- **RGPD** : la table Coworkers contient des données personnelles → mention de consentement dans le Jotform, accès restreint.
- **Limites Airtable AI** : selon le plan Airtable, le nombre d'exécutions IA peut être plafonné — à vérifier avant la phase 5.
- **Doublons d'inscription** : dédoublonnage sur l'email (vue/automatisation de contrôle).
