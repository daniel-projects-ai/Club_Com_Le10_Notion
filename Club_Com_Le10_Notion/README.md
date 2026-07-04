# Club Com’ Le 10 — paquet Notion

Ce dossier rassemble un paquet local complet pour documenter, suivre et importer le dispositif Club Com’ Le 10 dans Notion.

Tous les CSV du dossier ont été validés pour un import Notion standard, avec contrôle du nombre de colonnes et correction des lignes problématiques.

## Ce que contient le dossier

- une page principale d’accueil et d’orientation
- quatre bases CSV principales pour les opportunités, les freelances, les références et les dossiers de réponse
- des pages Markdown prêtes à copier dans Notion
- un guide d’utilisation et des modèles de travail
- les fichiers hérités `fiche_marche.md` et `marches.csv`, conservés pour compatibilité

## Fichiers principaux

- `pages.csv` : inventaire des pages et bases du paquet
- `databases.csv` : structure des bases Notion
- `opportunites.csv` : base principale de suivi des opportunités
- `freelances_coworkers.csv` : base des freelances et coworkers
- `references_competences.csv` : base des références et compétences
- `dossiers_reponse.csv` : base des dossiers de réponse
- `guide_utilisation.md` : mode d’emploi du système
- `schema_relations_notion.md` : schéma exact des relations et rollups Notion
- `checklist_import_notion.md` : ordre d’import et vérification
- `kit_administratif_macao.md` : check-list administrative
- `modeles_prompts_ia.md` : bibliothèque de prompts IA
- `veille_sources.md` : suivi de veille
- `club_com_animation_communaute.md` : animation du réseau Club Com’
- `bilan_capitalisation.md` : capitalisation et indicateurs
- `fiche_modele_opportunite.md`, `fiche_modele_freelance.md`, `fiche_modele_dossier_reponse.md` : modèles de saisie

## Comment importer dans Notion

1. Créer une page racine dans Notion avec le titre `Club Com’ Le 10 — Opportunités & appels d’offres`.
2. Importer les fichiers Markdown comme pages Notion par glisser-déposer ou via l’import Notion.
3. Importer chaque CSV comme base de données séparée.
4. Renommer les bases dans Notion pour qu’elles correspondent aux titres du paquet.
5. Créer les relations entre les bases en s’appuyant sur les colonnes déjà prévues.
6. Utiliser `schema_relations_notion.md` pour créer les relations et rollups exacts.
7. Utiliser `checklist_import_notion.md` pour suivre l’ordre d’import.

## Quelle base utiliser en premier

Commencer par `opportunites.csv`, car c’est la base centrale qui pilote ensuite les freelances, les références et les dossiers de réponse.

## Relations recommandées

- opportunités vers dossiers de réponse
- opportunités vers freelances pressentis
- opportunités vers références mobilisables
- freelances vers opportunités associées
- dossiers de réponse vers opportunités liées

## Test du système sur 15 jours

1. Jour 1 à 3: saisir toutes les opportunités entrantes dans `opportunites.csv`.
2. Jour 4 à 7: tester le scoring, la décision GO / NO GO et la mobilisation des freelances.
3. Jour 8 à 10: remplir les références et les dossiers de réponse en parallèle.
4. Jour 11 à 13: suivre les actions, délais et risques.
5. Jour 14 à 15: faire un premier bilan et corriger les champs manquants ou inutiles.

## Prochaines étapes possibles

- automatiser l’alimentation avec Make
- synchroniser des scénarios avec n8n
- connecter une récupération BOAMP par API ou flux
- lier des pièces et modèles via Google Drive
- enrichir les analyses, matching et synthèses avec des agents IA

## Fichiers hérités

- `structure.md` : inventaire simple de la structure
- `fiche_marche.md` : fiche marché générique
- `marches.csv` : ancien format marché, conservé sans remplacer `opportunites.csv`



