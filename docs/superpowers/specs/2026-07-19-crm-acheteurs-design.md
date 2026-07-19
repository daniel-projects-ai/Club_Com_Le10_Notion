# Module « CRM acheteurs » — Conception

**Date :** 2026-07-19
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation
**Module :** n°3 de la feuille de route intranet

---

## 1. Cadre

- **Contexte** — Aujourd'hui, l'acheteur d'une opportunité est un **champ texte libre**. Les valeurs existantes mélangent trois informations : « Mairie de Colomiers (31770) », « HÉRAULT LOGEMENT (Montpellier, 34) », « Communauté d'Agglomération du Pays de l'Or (Mauguio) ». Impossible de filtrer, de regrouper, ni de savoir ce qu'on a déjà fait pour qui.
- **Objectif** — Faire de l'acheteur une entité à part entière, avec son identité, ses interlocuteurs, son historique et l'état de la relation commerciale.
- **Moment** — La base compte **7 opportunités**, toutes au statut « À analyser ». Aucune n'a encore été gagnée ni perdue. La valeur du module n'est donc pas de restituer un passé — il n'y en a pas — mais de **structurer avant que le volume arrive**. Rattacher 7 acheteurs coûte une minute ; en dédupliquer deux cents dans deux ans coûtera un projet.
- **Audience** — *Macao* uniquement. Le module contient des données commerciales : niveau de relation, notes, coordonnées d'interlocuteurs.

## 2. Décisions d'architecture

**La liaison s'ajoute à côté du texte, elle ne le remplace pas.** Le champ `Acheteur / client` est lu par l'Écran TV, affiché en permanence dans les locaux du client, et `estAffichable()` refuse toute opportunité sans acheteur. Le convertir en liaison casserait l'affichage. On ajoute donc un champ de liaison `Acheteur` sur les Opportunités et **on ne touche pas au texte**. Le retrait du texte, s'il a lieu un jour, sera une décision séparée et consciente.

**Une table `Interlocuteurs` distincte de la table `Contacts` existante.** La table `Contacts` de la base n'est pas un carnet d'adresses : sa description dit « Messages externes reçus via le formulaire Jotform de contact ». C'est une boîte de réception (message, statut de traitement, traité par). Y greffer les contacts acheteurs mélangerait deux objets sans rapport. `Contacts` reste ce qu'elle est.

**L'historique est calculé, jamais ressaisi.** Le nombre d'opportunités, de dossiers, de gagnés et de perdus par acheteur se déduit des liaisons, **côté serveur**, comme les pièces manquantes et les dossiers bloqués du module précédent. Pas de rollup Airtable : le calcul reste dans le code, testable et modifiable sans toucher au schéma.

**Un interlocuteur appartient à un acheteur, pas à une opportunité.** Le service marchés et la direction de la communication d'une même collectivité sont deux personnes, présentes sur plusieurs consultations successives.

## 3. Modèle de données

### Table `Acheteurs` (nouvelle)

| Champ | Type | Valeurs / notes |
|---|---|---|
| Nom | Single line text | champ principal — le nom **propre**, sans code postal ni commune collés |
| Type | Single select | Commune · Communauté d'agglomération · Communauté de communes · Département · Région · Bailleur social · Établissement public · Association · Entreprise · Autre |
| Commune | Single line text | |
| Code postal | Single line text | texte et non nombre : les codes commençant par 0 |
| Territoire | Single select | Agen · Lot-et-Garonne (47) · Nouvelle-Aquitaine · Occitanie · National · Autre — **identique au champ Territoire des Opportunités** |
| SIRET | Single line text | |
| Niveau de relation | Single select | Jamais travaillé · Contact pris · Déjà consulté · Déjà client · Client récurrent |
| Référent Macao | Single select | Daniel · Dominique · Mathieu |
| Dernier échange | Date | |
| Plateforme de publication | Single select | AWS Marchés publics · e-marchespublics.com · Achatpublic.com · PLACE (État) · Marchés Sécurisés · Site propre · Autre · Inconnue |
| Particularités administratives | Long text | contraintes récurrentes de cet acheteur |
| Notes | Long text | |
| Opportunités | Link → Opportunités | réciproque du nouveau champ `Acheteur` |
| Interlocuteurs | Link → Interlocuteurs | |

### Table `Interlocuteurs` (nouvelle)

| Champ | Type | Notes |
|---|---|---|
| Nom complet | Single line text | champ principal |
| Fonction | Single line text | ex. « Responsable service marchés » |
| Email | Email | |
| Téléphone | Phone | |
| Acheteur | Link → Acheteurs | |
| Notes | Long text | |

### Table `Opportunités` (modifiée)

Un seul ajout : `Acheteur` — Link → Acheteurs. **Le champ texte `Acheteur / client` reste inchangé.**

## 4. Reprise des données existantes

Les 7 opportunités actuelles portent 7 valeurs textuelles distinctes. Pendant la mise en place :

1. Créer un enregistrement `Acheteurs` par valeur distincte, en **séparant** ce qui est aujourd'hui aggloméré : « Mairie de Colomiers (31770) » devient nom `Mairie de Colomiers`, commune `Colomiers`, code postal `31770`, type `Commune`.
2. Rattacher chaque opportunité à son acheteur via le nouveau champ de liaison.
3. Reprendre le `Territoire` de l'opportunité comme territoire de l'acheteur.

Le texte d'origine n'est pas modifié : il reste la sécurité de l'Écran TV.

## 5. L'historique, calculé côté serveur

Pour chaque acheteur, à partir des opportunités liées et de leurs dossiers :

- nombre d'opportunités détectées
- nombre de dossiers déposés
- nombre de **gagnés** et de **perdus** (statut de l'opportunité, ou `Résultat` du dossier)
- date de la dernière opportunité

Une valeur absente s'affiche `—`, jamais `0` — convention du projet.

## 6. Interface intranet

### Page « Acheteurs » (Macao)
Liste : nom, type, territoire, niveau de relation, nombre d'opportunités. Filtrable à la lecture — un acheteur « jamais travaillé » et un « client récurrent » ne se regardent pas de la même façon.

### Fiche acheteur (Macao)
- **Identité** : type, commune, code postal, territoire, SIRET
- **Relation** : niveau, référent Macao, dernier échange, notes
- **Interlocuteurs** : la liste, avec fonction et coordonnées
- **Historique** : les opportunités liées avec leur statut, les dossiers avec leur issue, et les compteurs
- **Modalités** : plateforme de publication, particularités administratives

### Depuis une opportunité
Un lien vers la fiche de son acheteur, quand la liaison existe.

## 7. L'indicateur qui empêche la structure de se vider

Une opportunité créée demain remplira le champ texte **sans** rattacher l'acheteur, et personne ne le remarquera. Le tableau de bord Macao affiche donc :

**Opportunités sans acheteur rattaché** — compte des opportunités dont la liaison `Acheteur` est vide.

Sans cet indicateur, le module se dégrade en silence et la table Acheteurs devient un vestige.

## 8. Hors périmètre

Bibliothèque de références (module suivant, déjà cadré : couverture en pièce jointe + lien Drive, Macao écrit et les coworkers consultent) · envoi d'emails · relances automatiques · déduplication automatique des saisies futures · accès coworkers · suppression du champ texte `Acheteur / client`.

## 9. Risques et points d'attention

- **Deux sources pour le nom de l'acheteur.** Le texte et la liaison coexistent. Si l'un est corrigé et pas l'autre, ils divergent. Choix assumé : la sécurité de l'Écran TV prime sur l'élégance du modèle. À trancher quand le module sera rodé.
- **Le rattachement reste manuel.** Rien ne force à lier un acheteur à la création d'une opportunité. C'est précisément ce que surveille l'indicateur du §7.
- **Le module est vide de sens tant qu'il n'y a pas d'historique.** Avec 7 opportunités toutes « À analyser », les compteurs afficheront `—` partout. C'est normal et attendu ; la valeur vient avec le temps.
- **Type et Plateforme sont des listes fermées.** Un acheteur qui ne rentre dans aucune case ira dans `Autre`, ce qui masque le besoin d'une nouvelle valeur. À relire dans quelques mois.
