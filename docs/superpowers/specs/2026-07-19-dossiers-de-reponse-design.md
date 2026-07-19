# Module « Dossiers de réponse » — Conception

**Date :** 2026-07-19
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation
**Module :** n°2 de la feuille de route intranet

---

## 1. Cadre

- **Contexte** — L'intranet gère les opportunités et les positionnements des coworkers. Quand Macao décide de répondre à un appel d'offres (statut `GO`), il faut piloter la constitution du dossier : pièces administratives, mémoire technique, offre financière, puis dépôt sur la plateforme de l'acheteur.
- **Objectif** — Rendre visible d'un coup d'œil où en est chaque dossier et ce qui manque, pour ne plus rater un dépôt à cause d'une pièce oubliée ou d'un mémoire non relu.
- **Origine du modèle** — La structure reprend fidèlement la base Notion historique de Macao, qui encode leur savoir-faire des marchés publics. On ne réinvente pas un processus éprouvé.
- **Audience** — *Macao* (pilotage complet) ; *Coworker* et *Freelance* (uniquement les dossiers où ils sont mobilisés, sans les données commerciales).

## 2. Décisions d'architecture

**Airtable pour la saisie, intranet pour le pilotage.** Airtable conserve la richesse (textes longs, notes, retours acheteur). L'intranet apporte ce qu'Airtable rend mal : une vue « où en est-on ? » lisible immédiatement, plus les gestes fréquents (cocher une pièce, faire avancer un chantier).

**Trois chantiers parallèles.** Un dossier n'a pas une progression linéaire : les pièces administratives, le mémoire technique et l'offre financière avancent indépendamment. Le modèle et l'interface reflètent cette réalité plutôt que de la forcer dans un statut unique. Le `Statut dossier` global reste, mais comme synthèse, pas comme moteur.

**Le dépôt est un processus à part.** Déposer sur une plateforme de marché public est un obstacle en soi (compte à créer, plateforme à identifier, accusé à récupérer). Il a donc sa propre séquence d'états.

**Écart assumé avec Notion — pièces demandées vs fournies.** Dans Notion, les pièces demandées étaient un texte libre sur l'opportunité et les pièces administratives une liste sur le dossier. On remplace par **deux listes de même vocabulaire sur le dossier** : `Pièces demandées` et `Pièces fournies`. L'intranet calcule et met en évidence **ce qui manque** — c'est précisément ce qui fait rater un dépôt.

## 3. Modèle de données — table `Dossiers de réponse`

| Champ | Type Airtable | Valeurs / notes |
|---|---|---|
| Nom du dossier | Single line text | champ principal |
| Opportunité liée | Link → Opportunités | une seule |
| Statut dossier | Single select | À créer · En préparation · Pièces admin en cours · Mémoire en cours · Offre financière en cours · Relecture finale · Prêt à déposer · Déposé · Gagné · Perdu · Abandonné |
| Responsable | Single select | Daniel · Dominique · Mathieu |
| Mode de réponse | Single select | Macao seul · Macao mandataire · Macao sous-traitant · Cotraitance · Groupement Club Com' · Prescription simple · Accompagnement freelance |
| Niveau de risque | Single select | Faible · Moyen · Élevé |
| **Pièces demandées** | Multiple select | Kbis · RIB · Attestation URSSAF · Attestation fiscale · Assurance RC Pro · DC1 · DC2 · Acte d'engagement · Mémoire technique · Offre financière |
| **Pièces fournies** | Multiple select | mêmes options |
| Mémoire technique | Single select | Non commencé · Plan créé · V1 rédigée · En relecture · Finalisé · Non demandé |
| Offre financière | Single select | Non commencée · En cours · À valider · Validée · Non demandée |
| Montant proposé | Currency € | |
| Date limite | Date | recopiée de l'opportunité à la création |
| Dépôt | Single select | Non préparé · Plateforme identifiée · Compte à vérifier · En cours · Déposé · Accusé reçu |
| Date de dépôt | Date | |
| Dossier Drive | URL | les fichiers restent chez Google |
| Check-list finale | Long text | |
| Questions à poser | Long text | questions posées à l'acheteur |
| Réponses reçues | Long text | |
| Retours acheteur | Long text | |
| Éléments à réutiliser | Long text | capitalisation |
| Références utilisées | Long text | **provisoire** — deviendra une liaison au module 3 |
| Notes internes | Long text | |
| Résultat | Single select | En cours · Gagné · Perdu · Sans suite · Abandonné |
| Équipe mobilisée | Link → Coworkers | plusieurs |

## 4. Flux de création

Un dossier ne naît jamais automatiquement : c'est une décision.

1. Une opportunité passe au statut **GO** (déjà possible dans l'intranet).
2. Un membre de Macao clique **« Créer le dossier de réponse »** sur la fiche de l'opportunité.
3. Le dossier est créé pré-rempli : `Nom du dossier` (repris de l'opportunité), `Opportunité liée`, `Date limite`, `Mode de réponse` (depuis `Mode de réponse recommandé` si renseigné), `Statut dossier = En préparation`, `Résultat = En cours`.
4. Le bouton disparaît si un dossier existe déjà pour cette opportunité — un dossier par opportunité.

## 5. Interface intranet

### Page « Dossiers » (Macao)
Liste des dossiers. Chaque ligne montre : nom, acheteur, échéance, `Statut dossier`, et **l'avancement des trois chantiers** sous forme de trois indicateurs compacts (pièces manquantes / état du mémoire / état de l'offre). Les dossiers **en risque** ressortent visuellement (voir §7).

### Fiche dossier (Macao)
- Les **trois chantiers côte à côte**, chacun avec son état modifiable en un clic.
- La **check-list des pièces** : demandées vs fournies, les manquantes en évidence.
- L'**équipe mobilisée**, le **dépôt** et sa date, le lien Drive.
- Les textes longs (questions, retours acheteur, éléments à réutiliser) en consultation ; leur édition riche reste dans Airtable.

### Page « Mes dossiers » (Coworker / Freelance)
Uniquement les dossiers où l'utilisateur figure dans `Équipe mobilisée`. Il voit : nom, acheteur, échéance, statut, les trois chantiers, les pièces, l'équipe et le lien Drive. Il ne voit **pas** : `Montant proposé`, `Notes internes`, `Retours acheteur`, `Niveau de risque`.

Le filtrage est fait **côté serveur**, comme pour le score IA des opportunités.

## 6. Rôles et permissions

| Donnée | Macao | Coworker / Freelance |
|---|---|---|
| Liste des dossiers | tous | ceux où il est mobilisé |
| Chantiers, pièces, dates, équipe, Drive | ✅ | ✅ |
| Montant proposé, Notes internes, Retours acheteur, Niveau de risque | ✅ | ❌ |
| Créer un dossier, changer un état | ✅ | ❌ (403 côté serveur) |

## 7. Tableau de bord — trois indicateurs de plus (Macao)

- **Dossiers en cours** — `Résultat = En cours`
- **À déposer sous 7 jours** — `Date limite` dans les 7 jours et `Dépôt` différent de `Déposé` et `Accusé reçu`
- **Dossiers bloqués** — `Date limite` dans les 7 jours **et** au moins une de ces conditions : des pièces demandées ne sont pas fournies, ou `Mémoire technique` n'est ni `Finalisé` ni `Non demandé`, ou `Offre financière` n'est ni `Validée` ni `Non demandée`

Un dossier « bloqué » est signalé visuellement dans la liste : c'est l'information qui justifie à elle seule l'ouverture de l'intranet le matin.

## 8. Hors périmètre

Gestion de fichiers (le Drive reste chez Google, on ne stocke que le lien) · rédaction assistée du mémoire technique · table Références (module 3) · dépôt automatisé sur les plateformes d'acheteurs · notifications par email · édition des textes longs depuis l'intranet.

## 9. Risques et points d'attention

- **Double saisie** — `Date limite` est recopiée depuis l'opportunité à la création, puis vit sa propre vie. Si l'acheteur reporte la date, il faut la corriger aux deux endroits. Choix assumé : une liaison dynamique compliquerait le modèle pour un cas rare.
- **Richesse du modèle** — 24 champs, c'est beaucoup à remplir. L'interface doit donc afficher l'essentiel et non tout : le reste se saisit dans Airtable, au calme.
- **Le champ `Références utilisées` est provisoire.** Sa migration vers une liaison lors du module 3 devra convertir le texte existant.
- **Un dossier par opportunité** — le modèle ne prévoit pas plusieurs dossiers pour une même opportunité (cas des lots multiples d'un marché). Si ce besoin apparaît, il faudra faire évoluer la contrainte.
