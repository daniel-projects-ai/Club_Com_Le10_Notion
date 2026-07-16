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
| Pilotage Macao | `pbdBCobP63gRYWFm1` | Pipeline (kanban), Positionnements, Inscriptions à valider, Contacts à traiter |

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

## ⚠️ Étapes restantes (interface graphique uniquement)

L'API Airtable n'expose ni les **champs IA** ni les **automatisations** ; l'API Jotform n'expose pas les **intégrations**. Ces trois points se règlent dans les éditeurs.

### 1. Mapping Jotform manquant (30 s)
Formulaire d'inscription → mapper **Métiers / compétences** (Jotform) vers **Métiers déclarés (formulaire)** (Airtable, champ texte). Le champ `Métiers / compétences` est un lien vers une table : Jotform ne peut pas l'alimenter directement. Le lien se fait ensuite à la validation de l'inscription.

### 2. Accès par rôle
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
