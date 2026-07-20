# CRM 3a — Socle relationnel : Conception

**Date :** 2026-07-20
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation
**Cadre :** `2026-07-20-crm-agence-vision.md` — livraison **3a** sur quatre

---

## 1. Cadre

- **Contexte** — Aujourd'hui, l'acheteur d'une opportunité est un **champ texte libre**. Les valeurs existantes agglomèrent trois informations : « Mairie de Colomiers (31770) », « HÉRAULT LOGEMENT (Montpellier, 34) », « Communauté d'Agglomération du Pays de l'Or (Mauguio) ». Impossible de filtrer, de regrouper, ni de savoir ce qu'on a déjà tenté chez qui.
- **Objectif** — Faire de l'organisation une entité à part entière : identité, interlocuteurs, historique, état de la relation. C'est le socle sur lequel reposeront le journal des interactions (3b) et les campagnes (3d).
- **Moment** — La base compte **7 opportunités**, toutes « À analyser ». Aucune gagnée ni perdue. La valeur du module n'est pas de restituer un passé — il n'y en a pas — mais de **structurer avant que le volume arrive**. Rattacher 7 organisations coûte une minute ; en dédupliquer deux cents dans deux ans coûtera un projet.
- **Audience** — *Macao* uniquement. Données commerciales : relation, notes, coordonnées.

## 2. Décisions d'architecture

**On modélise des organisations, pas des acheteurs.** Une collectivité existe indépendamment de la consultation qu'elle publie. L'appel d'offres est une manière d'entrer en relation parmi d'autres — à côté de la prospection, de la recommandation, du réseau. Les acheteurs publics sont donc un cas particulier d'organisation, pas le modèle de référence. Sans cette généralisation, les livraisons 3b et 3d exigeraient de tout refaire.

**La liaison s'ajoute à côté du texte, elle ne le remplace pas.** Le champ `Acheteur / client` est lu par l'Écran TV, affiché en permanence dans les locaux du client, et `estAffichable()` refuse toute opportunité sans acheteur. Le convertir casserait l'affichage. On ajoute un champ de liaison `Organisation` et **on ne touche pas au texte**. Son retrait éventuel sera une décision séparée.

**Une table `Interlocuteurs` distincte de la table `Contacts` existante.** `Contacts` n'est pas un carnet d'adresses : sa description dit « Messages externes reçus via le formulaire Jotform de contact ». C'est une boîte de réception. Y greffer les contacts d'organisations mélangerait deux objets sans rapport.

**L'historique est calculé, jamais ressaisi.** Nombre d'opportunités, de dossiers, de gagnés et de perdus : déduits des liaisons **côté serveur**, comme les pièces manquantes et les dossiers bloqués du module précédent. Pas de rollup Airtable — le calcul reste dans le code, testable.

## 3. Modèle de données

### Table `Organisations` (nouvelle)

| Champ | Type | Valeurs / notes |
|---|---|---|
| Nom | Single line text | champ principal — le nom **propre**, sans code postal ni commune collés |
| Nature | Single select | Publique · Privée · Association |
| Type | Single select | Commune · Communauté d'agglomération · Communauté de communes · Département · Région · Bailleur social · Établissement public · Association · Entreprise · Autre |
| Commune | Single line text | |
| Code postal | Single line text | texte et non nombre : les codes commençant par 0 |
| Territoire | Single select | Agen · Lot-et-Garonne (47) · Nouvelle-Aquitaine · Occitanie · National · Autre — **identique au champ Territoire des Opportunités** |
| SIRET | Single line text | |
| Site web | URL | |
| Niveau de relation | Single select | Jamais contacté · Contact pris · En discussion · Déjà client · Client récurrent |
| Origine | Single select | Appel d'offres · Prospection · Recommandation · Réseau · Entrant · Autre |
| Référent Macao | Single select | Daniel · Dominique · Mathieu |
| Dernier échange | Date | saisi à la main en 3a ; **alimenté automatiquement par le journal en 3b** |
| Plateforme de publication | Single select | AWS Marchés publics · e-marchespublics.com · Achatpublic.com · PLACE (État) · Marchés Sécurisés · Site propre · Autre · Inconnue |
| Particularités administratives | Long text | contraintes récurrentes de cette organisation |
| Notes | Long text | |
| Opportunités | Link → Opportunités | réciproque du nouveau champ `Organisation` |
| Interlocuteurs | Link → Interlocuteurs | |

**Deux champs sont anticipés pour les livraisons suivantes** : `Origine` (segmentation des campagnes en 3d) et `Nature` (une campagne ne s'adresse pas de la même façon à une collectivité et à une entreprise). Les ajouter maintenant coûte une ligne ; les rétro-remplir sur deux cents organisations coûtera une journée.

### Table `Interlocuteurs` (nouvelle)

| Champ | Type | Notes |
|---|---|---|
| Nom complet | Single line text | champ principal |
| Fonction | Single line text | ex. « Responsable service marchés » |
| Email | Email | |
| Téléphone | Phone | |
| Organisation | Link → Organisations | |
| **Opposition à la prospection** | Checkbox | coché ⇒ ne jamais inclure dans une campagne |
| Notes | Long text | |

**Sur l'opposition** : la traçabilité RGPD complète (date, canal, preuve de la demande) relève de la livraison 3b. Mais un simple indicateur dès maintenant évite le préjudice réel qu'est le démarchage d'une personne ayant demandé à ne plus l'être. Il est peu coûteux et se remplira naturellement.

### Table `Opportunités` (modifiée)

Un seul ajout : `Organisation` — Link → Organisations. **Le champ texte `Acheteur / client` reste inchangé.**

## 4. Reprise des données existantes

Les 7 opportunités actuelles portent 7 valeurs textuelles distinctes. Pendant la mise en place :

1. Créer une organisation par valeur distincte, en **séparant** ce qui est aggloméré : « Mairie de Colomiers (31770) » devient nom `Mairie de Colomiers`, commune `Colomiers`, code postal `31770`, type `Commune`, nature `Publique`.
2. Rattacher chaque opportunité à son organisation via le nouveau champ de liaison.
3. Reprendre le `Territoire` de l'opportunité comme territoire de l'organisation.
4. Renseigner `Origine = Appel d'offres` et `Niveau de relation = Jamais contacté` pour les sept.

Le texte d'origine n'est pas modifié : il reste la sécurité de l'Écran TV.

## 5. L'historique, calculé côté serveur

Pour chaque organisation, à partir des opportunités liées et de leurs dossiers :

- nombre d'opportunités détectées
- nombre de dossiers déposés
- nombre de **gagnés** et de **perdus**
- date de la dernière opportunité

Une valeur absente s'affiche `—`, jamais `0` — convention du projet.

## 6. Interface intranet

### Page « Organisations » (Macao)
Liste : nom, nature, type, territoire, niveau de relation, nombre d'opportunités.

### Fiche organisation (Macao)
- **Identité** : nature, type, commune, code postal, territoire, SIRET, site web
- **Relation** : niveau, origine, référent Macao, dernier échange, notes
- **Interlocuteurs** : liste avec fonction et coordonnées, l'opposition à la prospection clairement signalée
- **Historique** : opportunités liées avec leur statut, dossiers avec leur issue, compteurs
- **Modalités** : plateforme de publication, particularités administratives

### Depuis une opportunité
Un lien vers la fiche de son organisation, quand la liaison existe.

## 7. L'indicateur qui empêche la structure de se vider

Une opportunité créée demain remplira le champ texte **sans** rattacher l'organisation, et personne ne le remarquera. Le tableau de bord Macao affiche donc :

**Opportunités sans organisation rattachée** — compte des opportunités dont la liaison est vide.

Sans cet indicateur, le module se dégrade en silence et la table devient un vestige.

## 8. Hors périmètre

Journal des interactions et relances (3b) · campagnes de prospection (3d) · pipeline, devis et facturation (module 4) · envoi d'emails · accès coworkers · suppression du champ texte `Acheteur / client` · déduplication automatique des saisies futures.

## 9. Risques et points d'attention

- **Deux sources pour le nom de l'organisation.** Le texte et la liaison coexistent. S'ils sont corrigés séparément, ils divergent. Choix assumé : la sécurité de l'Écran TV prime sur l'élégance du modèle. À trancher quand le module sera rodé.
- **Le rattachement reste manuel.** Rien ne force à lier une organisation à la création d'une opportunité — c'est ce que surveille l'indicateur du §7.
- **Le module est vide de sens tant qu'il n'y a pas d'historique.** Avec 7 opportunités toutes « À analyser », les compteurs afficheront `—` partout. Normal et attendu.
- **`Dernier échange` sera saisi à la main jusqu'en 3b**, où le journal l'alimentera. Entre les deux, ce champ vieillira mal : personne ne pense à le mettre à jour. C'est une raison de ne pas trop tarder sur 3b.
- **Type, Nature, Origine et Plateforme sont des listes fermées.** Une organisation qui ne rentre dans aucune case ira dans `Autre`, ce qui masque le besoin d'une nouvelle valeur. À relire dans quelques mois.
