# Plateforme Coworkers LE 10 — État de construction

**Date :** 2026-07-16

## Identifiants Airtable

- **Base** : `appdJ309q39i4Gr8t` — [ouvrir](https://airtable.com/appdJ309q39i4Gr8t)
- **Workspace** : `wsphPtgRIMYMludjn`

| Table | ID |
|---|---|
| Métiers | `tblkKza5jMfBqEC4b` |
| Coworkers | `tbl89xazn0oY4A18o` |
| Opportunités | `tbl3jvmo4VjUDTkmD` |
| Positionnements | `tbllJ1W7jxuTcODwe` |
| Commentaires | `tblvkQvlOW9CdKEPm` |
| Contacts | `tblddrQJJgmh0FW21` |

| Interface | ID | Pages |
|---|---|---|
| Espace Coworkers | `pbdNCHS6Btu0JKWPU` | Opportunités (recordReview), Annuaire (gallery) |
| Pilotage Macao | `pbdBCobP63gRYWFm1` | Pipeline (kanban), Positionnements, Inscriptions à valider, Contacts à traiter, **Affichage Écran TV** |

## 📺 Écran TV — rebranché sur Airtable (2026-07-16)

Le backend Express (Railway) lit désormais **Airtable** et non plus Notion. Notion n'est plus utilisé par aucun composant.

- `server/services/airtableClient.js` — client REST Airtable (fetch natif, pagination, retry)
- `server/routes/opportunities.js` — route `/api/opportunities` (cache 2 min)
- Anciens `notionClient.js` et `routes/notion.js` supprimés
- Alias legacy `/api/notion/opportunities` conservé le temps du redéploiement — supprimable

**Règle d'affichage** : une opportunité apparaît sur la TV si **« Visible sur écran »** est cochée, qu'elle a un acheteur, et que son statut n'est ni `Perdu`, ni `Archivé`, ni `NO GO`. La page **Affichage Écran TV** (interface Pilotage Macao) permet de piloter ça.

### Variables d'environnement Railway
```
AIRTABLE_TOKEN=<Personal Access Token Airtable>   # à créer sur airtable.com/create/tokens
AIRTABLE_BASE_ID=appdJ309q39i4Gr8t                # optionnel (valeur par défaut dans le code)
```
Les variables `NOTION_*` ne servent plus et peuvent être supprimées.

## Formulaires Jotform

| Formulaire | ID | Cible Airtable |
|---|---|---|
| Rejoindre le Club Com' Le 10 | `261955996118069` | Coworkers |
| Contact — Club Com' Le 10 | `261956539490066` | Contacts |

Connexion native Jotform → Airtable **active et testée** (2026-07-16).

## Contenu créé

- 15 métiers (référentiel), 3 membres Macao (Daniel, Dominique, Mathieu)
- 7 opportunités réelles migrées depuis Notion, enrichies (Résumé IA, Score, Métiers)
- Les 38 lignes d'alerte email de Notion n'ont **pas** été migrées (bruit)

## ✅ Fait automatiquement

Base, tables, champs, relations, données, formulaires, interfaces (publiées), enrichissement IA initial des 7 opportunités.

## 🤖 Agent IA — Léa (Jotform AI Agent)

Airtable AI nécessite des crédits (plan payant) ; le plan Jotform inclut 5 agents IA. Le livrable acceptant « agent IA intégré **au formulaire** ou à la base », l'agent a été construit côté Jotform.

- **Nom** : Léa — Assistante d'accueil du Club Com' Le 10
- **Langue** : français ; ton chaleureux, vouvoiement
- **Connaissance** : présentation du Club + liste des 15 métiers avec correspondances + crawl de `le10.club`
- **Garde-fous** (Chat Guidelines) : ne jamais inventer de métier hors des 15 ; ne jamais évoquer d'opportunités précises (elle n'y a pas accès) ; ne jamais promettre l'adhésion ; rappel RGPD
- **Formulaire relié** : Rejoindre le Club Com' Le 10 → Airtable

**Chaîne validée de bout en bout le 2026-07-16 : conversation Léa → Jotform → Airtable, métiers compris.**

### Pièges rencontrés (à retenir)
- Le consentement RGPD était un **widget « Terms & Conditions »** (iframe) : impossible à cocher en conversation → bouclait à l'infini et bloquait l'envoi. Remplacé par une **case à cocher native** (option courte « J'accepte »). Widget masqué et rendu non obligatoire.
- Les métiers ne peuvent pas être mappés vers un champ **texte** ni vers un champ **lien** : Jotform grise ces options. Il faut un champ **sélection multiple** aux libellés strictement identiques → champ `Métiers déclarés` (fldSDAZRX6aovHyef).
- Le champ texte `Métiers déclarés (formulaire)` est devenu inutile (à supprimer manuellement).

## ⚠️ Étapes restantes (interface graphique uniquement)

L'API Airtable n'expose ni les champs IA ni les automatisations. Ces points se règlent dans les éditeurs.

### 1. Accès par rôle
- Partager l'interface **Espace Coworkers** avec les coworkers → permission *Commenter / limitée*
- Garder **Pilotage Macao** réservée au groupe Macao → *Éditeur*

### 3. Champs IA Airtable (pour l'automatisation permanente)

À créer dans la table **Opportunités** (bouton « + » → *AI* → *Generate text*) :

**Champ « Résumé IA »** — prompt :
> Tu es l'assistant de veille de l'agence Macao (communication). À partir de l'objet suivant, rédige un résumé de 2 à 3 phrases, clair et engageant, destiné à des professionnels de la communication. N'invente rien.
> Objet : {Objet}

**Champ « Score pertinence »** (sortie nombre) — prompt :
> Évalue de 0 à 100 la pertinence de cette opportunité pour une agence de communication et un réseau de freelances com. Plus le sujet est proche de la communication, de la création ou du digital, plus le score est haut. Une mission d'ingénierie technique ou de BTP obtient un score bas. Réponds uniquement par un nombre.
> Objet : {Objet}

**Champ « Métiers détectés (texte) »** — prompt :
> Parmi cette liste EXACTE de métiers : Graphiste, Directeur artistique, Illustrateur, Photographe, Vidéaste, Webdesigner, Développeur web, Consultant SEO, Consultant IA / no-code, Rédacteur, Community manager, Consultant communication, Formateur, Relations presse, Événementiel — liste ceux concernés par cette opportunité, séparés par des virgules. Si aucun ne correspond, réponds « Aucun métier du Club identifié ». N'ajoute aucun autre mot.
> Objet : {Objet}

### 4. Automatisation « Matching » (optionnelle)
Déclencheur : *Métiers détectés (texte)* non vide → script ou étape de recherche qui relie les **Coworkers actifs** partageant ces métiers dans le champ **Coworkers suggérés**, puis envoie un email au **Référent Macao**.

> En attendant, l'assistant peut faire l'enrichissement et le matching à la demande via l'API (comme pour les 7 premières opportunités).
