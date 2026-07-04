# Schéma de relations Notion

## Introduction

Ce document décrit les relations exactes à recréer après import des CSV dans Notion. Les colonnes actuellement présentes dans les CSV servent de base de saisie, mais certaines doivent être converties manuellement en propriétés de relation dans Notion après l’import.

## Tableau récapitulatif

| Base source | Propriété | Type | Base cible | Réciproque |
|---|---|---|---|---|
| Opportunités | Freelances pressentis | Relation | Freelances & coworkers | Opportunités associées |
| Opportunités | Références mobilisables | Relation | Références & compétences | Opportunités liées |
| Opportunités | Dossier de réponse lié | Relation | Dossiers de réponse | Opportunité liée |
| Freelances & coworkers | Opportunités associées | Relation | Opportunités | Freelances pressentis |
| Freelances & coworkers | Dossiers associés | Relation | Dossiers de réponse | Équipe mobilisée |
| Freelances & coworkers | Références | Relation | Références & compétences | Réalisé par |
| Références & compétences | Réalisé par | Relation | Freelances & coworkers | Références |
| Références & compétences | Opportunités liées | Relation | Opportunités | Références mobilisables |
| Dossiers de réponse | Opportunité liée | Relation | Opportunités | Dossier de réponse lié |
| Dossiers de réponse | Équipe mobilisée | Relation | Freelances & coworkers | Dossiers associés |
| Dossiers de réponse | Références utilisées | Relation | Références & compétences | Opportunités liées |

## Base Opportunités

### Freelances pressentis

- Nom exact de la propriété: Freelances pressentis
- Type de propriété: Relation
- Base cible: Freelances & coworkers
- Sens de la relation: Opportunités vers Freelances & coworkers
- Relation réciproque: Oui, créer Opportunités associées
- Usage concret: lier les freelances pressentis à une opportunité pour suivre la mobilisation.

### Références mobilisables

- Nom exact de la propriété: Références mobilisables
- Type de propriété: Relation
- Base cible: Références & compétences
- Sens de la relation: Opportunités vers Références & compétences
- Relation réciproque: Oui, créer Opportunités liées
- Usage concret: rattacher les références utilisables pour une réponse AO.

### Dossier de réponse lié

- Nom exact de la propriété: Dossier de réponse lié
- Type de propriété: Relation
- Base cible: Dossiers de réponse
- Sens de la relation: Opportunités vers Dossiers de réponse
- Relation réciproque: Oui, créer Opportunité liée
- Usage concret: relier une opportunité au dossier de réponse correspondant.

## Base Freelances & coworkers

### Opportunités associées

- Nom exact de la propriété: Opportunités associées
- Type de propriété: Relation
- Base cible: Opportunités
- Sens de la relation: Freelances & coworkers vers Opportunités
- Relation réciproque: Oui, reliée à Freelances pressentis
- Usage concret: voir les opportunités sur lesquelles un freelance est pressenti ou mobilisé.

### Dossiers associés

- Nom exact de la propriété: Dossiers associés
- Type de propriété: Relation
- Base cible: Dossiers de réponse
- Sens de la relation: Freelances & coworkers vers Dossiers de réponse
- Relation réciproque: Oui, reliée à Équipe mobilisée
- Usage concret: suivre les dossiers où un freelance intervient.

### Références

- Nom exact de la propriété: Références
- Type de propriété: Relation
- Base cible: Références & compétences
- Sens de la relation: Freelances & coworkers vers Références & compétences
- Relation réciproque: Oui, reliée à Réalisé par
- Usage concret: afficher les références attribuées à un freelance.

## Base Références & compétences

### Réalisé par

- Nom exact de la propriété: Réalisé par
- Type de propriété: Relation
- Base cible: Freelances & coworkers
- Sens de la relation: Références & compétences vers Freelances & coworkers
- Relation réciproque: Oui, reliée à Références
- Usage concret: indiquer quels profils ont produit ou porté la référence.

### Opportunités liées

- Nom exact de la propriété: Opportunités liées
- Type de propriété: Relation
- Base cible: Opportunités
- Sens de la relation: Références & compétences vers Opportunités
- Relation réciproque: Oui, reliée à Références mobilisables
- Usage concret: associer une référence à une opportunité donnée.

## Base Dossiers de réponse

### Opportunité liée

- Nom exact de la propriété: Opportunité liée
- Type de propriété: Relation
- Base cible: Opportunités
- Sens de la relation: Dossiers de réponse vers Opportunités
- Relation réciproque: Oui, reliée à Dossier de réponse lié
- Usage concret: rattacher le dossier au marché ou à l’appel d’offres concerné.

### Équipe mobilisée

- Nom exact de la propriété: Équipe mobilisée
- Type de propriété: Relation
- Base cible: Freelances & coworkers
- Sens de la relation: Dossiers de réponse vers Freelances & coworkers
- Relation réciproque: Oui, reliée à Dossiers associés
- Usage concret: visualiser les personnes impliquées dans le dossier.

### Références utilisées

- Nom exact de la propriété: Références utilisées
- Type de propriété: Relation
- Base cible: Références & compétences
- Sens de la relation: Dossiers de réponse vers Références & compétences
- Relation réciproque: Oui, reliée à Opportunités liées
- Usage concret: lister les références mobilisées dans la réponse.

## Rollups à créer

### Base Opportunités

- Nombre de freelances pressentis: rollup sur Freelances pressentis, fonction Count all.
- Nombre de références mobilisables: rollup sur Références mobilisables, fonction Count all.
- Statut du dossier de réponse: rollup sur Dossier de réponse lié puis Statut dossier.
- Montant proposé: rollup sur Dossier de réponse lié puis Montant proposé.
- Résultat du dossier: rollup sur Dossier de réponse lié puis Résultat.

### Base Freelances & coworkers

- Nombre d’opportunités associées: rollup sur Opportunités associées, fonction Count all.
- Nombre de dossiers associés: rollup sur Dossiers associés, fonction Count all.
- Nombre de références utilisables AO: rollup sur Références, puis filtrer ou compter les références marquées Utilisable AO si vous ajoutez un rollup ou une vue dédiée.

### Base Références & compétences

- Nombre d’opportunités liées: rollup sur Opportunités liées, fonction Count all.
- Profils associés: rollup sur Réalisé par, fonction Show original ou Count all selon le besoin.
- Utilisable AO: cette information existe déjà comme propriété booléenne; un rollup n’est pas nécessaire.

### Base Dossiers de réponse

- Date limite opportunité: rollup sur Opportunité liée puis Date limite.
- Acheteur / client: rollup sur Opportunité liée puis Acheteur / client.
- Score Macao: rollup sur Opportunité liée puis Score Macao.
- Score Club Com’: rollup sur Opportunité liée puis Score Club Com’.
- Métiers concernés: rollup sur Opportunité liée puis Métiers concernés.
- Nombre de profils mobilisés: rollup sur Équipe mobilisée, fonction Count all.
- Nombre de références utilisées: rollup sur Références utilisées, fonction Count all.

## Points à convertir manuellement après import

- Dans `opportunites.csv`, les colonnes Freelances pressentis, Références mobilisables et Dossier de réponse lié sont importées comme texte ou valeur plate; elles doivent devenir des relations dans Notion.
- Dans `freelances_coworkers.csv`, les colonnes Opportunités associées, Dossiers associés et Références sont également à convertir en relations.
- Dans `references_competences.csv`, les colonnes Réalisé par et Opportunités liées doivent être converties en relations.
- Dans `dossiers_reponse.csv`, les colonnes Opportunité liée, Équipe mobilisée et Références utilisées doivent être converties en relations.

## Vues Notion à ajuster après création des relations

- vue Kanban des Opportunités par Statut
- vue calendrier des Opportunités par Date limite
- vue Dossiers de réponse par Statut dossier
- vue Freelances par Priorité de mobilisation
- vue Références par Niveau de pertinence
- vue des opportunités enrichie avec les rollups principaux

## Check-list de configuration finale

1. Importer les CSV dans Notion.
2. Renommer les bases avec les noms définitifs.
3. Convertir les colonnes texte en relations.
4. Activer les relations réciproques.
5. Créer les rollups listés.
6. Vérifier les types de colonnes et les valeurs par défaut.
7. Ajuster les vues et tris.
8. Tester avec une opportunité fictive.

## Ordre recommandé de création dans Notion

1. Importer ou créer la base Freelances & coworkers.
2. Importer ou créer la base Références & compétences.
3. Importer ou créer la base Opportunités.
4. Importer ou créer la base Dossiers de réponse.
5. Créer les relations depuis Dossiers de réponse.
6. Créer les relations depuis Opportunités.
7. Vérifier les relations réciproques.
8. Créer les rollups.
9. Ajuster les vues.
10. Tester avec une opportunité fictive.
