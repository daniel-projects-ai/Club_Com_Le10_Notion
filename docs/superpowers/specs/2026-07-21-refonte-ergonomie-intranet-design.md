# Refonte de l'ergonomie de l'intranet — Conception

**Date :** 2026-07-21
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation
**Nature :** Refonte d'interface. Aucune donnée, aucune route, aucun calcul métier n'est modifié.

---

## 1. Le constat

L'intranet a été construit en quatre livraisons successives (portail, dossiers de réponse, CRM 3a, CRM 3b). À chaque fois, la question posée a été *« où ajouter cette information ? »*, jamais *« que regarde-t-on en ouvrant l'outil ? »*.

Le verdict du client, mot pour mot : **« l'ergonomie de l'intranet en l'état est incompréhensible »**. Les quatre blocages proposés ont tous été retenus : ne pas savoir où aller, un tableau de bord illisible, des actions introuvables, et l'absence de fil conducteur.

Mesuré dans le code :

- **12 indicateurs** sur le tableau de bord, dont **« Échéances sous 30 j » en double** et « Opportunités actives » à côté d'« Opportunités ouvertes »
- **6 entrées de menu** au même niveau, mélangeant travail quotidien, référentiels et réglages
- **5 sections empilées** sur la fiche organisation, sans hiérarchie
- **358 lignes** dans la page Opportunités, où trois boutons se sont accumulés au fil des modules

## 2. Le défaut de fond : un outil d'appels d'offres, pas un intranet d'agence

Point soulevé par le client et qui commande tout le reste : **l'interface ne doit pas laisser penser que l'intranet est exclusivement dédié aux appels d'offres.**

Tout le vocabulaire actuel le trahit — « Opportunités », « Dossiers de réponse », « GO / NO GO », « À analyser ». Or Macao a aussi des clients directs, des projets en cours, de la prospection, et une communauté de coworkers. **L'appel d'offres est un cas particulier, pas le sujet.**

## 3. Décisions

**Interface seule.** Airtable, les routes, les règles métier et les tests ne bougent pas. Conséquence directe : **aucun risque pour l'Écran TV**, affiché en permanence dans les locaux du client.

**Le vocabulaire du client gagne.** « Projets » et « Devis » sont les mots employés dans l'agence. Ils remplacent « Opportunités » et « Dossiers de réponse » **dans l'interface uniquement** — les tables Airtable conservent leurs noms.

**Le projet est le contenant qui traverse tout le cycle.** L'objection classique — « projet » désigne ce qui est déjà gagné — se lève en assumant qu'un projet couvre prospect → réponse en cours → gagné → production → terminé. C'est précisément ce qui sort de la logique appel d'offres : un projet naît d'un marché public *ou* d'un client qui appelle.

**Le devis vit dans le projet**, pas dans le menu. Un devis appartient toujours à un projet ; une entrée de menu de plus n'apporterait rien.

**Un prospect n'est pas un client.** Nommer « Clients » une liste qui contient des organisations jamais contactées fausse la lecture. L'entrée s'appelle **« Clients & prospects »**, et la distinction s'appuie sur le champ `Niveau de relation` déjà présent : `Déjà client` et `Client récurrent` d'un côté ; `Jamais contacté`, `Contact pris`, `En discussion` de l'autre.

**Un chiffre qui ne déclenche aucune action n'a rien à faire sur le tableau de bord.**

## 4. Le menu

Quatre entrées, plus le profil en retrait.

| Entrée | Contenu | Rôles |
|---|---|---|
| **Aujourd'hui** | Ce qui réclame une décision maintenant | tous |
| **Projets** | Toute affaire, quelle que soit son origine. Les devis sont dans la fiche | tous |
| **Clients & prospects** | Organisations, interlocuteurs, historique | Macao |
| **Communauté** | Les coworkers du 10, leurs métiers, disponibilités | tous |

Le profil devient une entrée discrète en pied de barre latérale, pas une destination de même rang.

### Correspondance des libellés

| Aujourd'hui | Demain |
|---|---|
| Tableau de bord | **Aujourd'hui** |
| Opportunités | **Projets** |
| Dossiers de réponse | **Devis** |
| Organisations | **Clients & prospects** |
| Annuaire | **Communauté** |

Les routes techniques (`/opportunites`, `/dossiers`, `/organisations`) restent inchangées : les renommer casserait les liens existants sans bénéfice pour l'utilisateur. Seuls les libellés changent.

## 5. « Aujourd'hui » — trois blocs

L'écran répond à une seule question : *qu'est-ce que je dois faire aujourd'hui ?*

### Bloc 1 — À traiter
Ce qui appelle une action, chaque ligne cliquable menant à l'endroit où agir :
- relances en retard
- devis bloqués (échéance proche et un chantier non prêt)
- échéances sous 7 jours

Si rien n'est en attente, le dire clairement — c'est une bonne nouvelle, pas un écran vide.

### Bloc 2 — Nouveaux projets
Ce qui vient d'arriver et attend un tri, avec l'action de décision à portée.

### Bloc 3 — En bref
**Quatre chiffres maximum** : projets en cours · devis à rendre · relances en attente · clients actifs.

Les huit autres indicateurs disparaissent, dont le doublon « Échéances sous 30 j ». Les données restent calculées côté serveur : c'est l'affichage qui est réduit.

**Par rôle** : un Coworker ou un Freelance voit ses propres échéances et les projets ouverts ; il ne voit ni relances, ni devis bloqués, ni clients — cloisonnement déjà appliqué côté serveur, l'interface ne fait que le refléter.

## 6. Les actions

Sur chaque page et chaque fiche, **les actions sont en haut à droite**, dans une barre identifiable : « Noter un échange », « Créer un devis », « Ça m'intéresse ».

Aujourd'hui, ces boutons sont noyés au milieu de cartes ou en bas de page. Ils deviennent le premier élément qu'on cherche du regard.

## 7. Les fiches

Chaque fiche a **une information principale**, le reste se replie.

- **Fiche projet** — l'essentiel visible : où en est-on, pour qui, pour quand. Le devis, l'équipe et l'historique en sections repliables.
- **Fiche client** — le niveau de relation et les interlocuteurs d'abord ; le journal, les projets et les informations administratives ensuite.

Les sections repliées gardent leur titre et un compteur, pour qu'on sache ce qu'elles contiennent sans les ouvrir.

## 8. Les trois écrans

L'intranet est aujourd'hui **inutilisable sur iPhone** : la barre latérale est figée à 240 px et mange l'écran.

- **Mobile** — barre latérale escamotable derrière un bouton, cartes empilées, formulaires en pleine largeur, cibles tactiles d'au moins 44 px.
- **Tablette** — mise en page intermédiaire, barre latérale rétractable.
- **Ordinateur** — la mise en page actuelle, allégée.

Noter un échange en sortant d'un rendez-vous est le cas d'usage qui justifie à lui seul le mobile.

## 9. Hors périmètre

Renommage des tables et champs Airtable · modification des routes API et des règles métier · suppression de fonctionnalités existantes · refonte de l'Écran TV, qui a sa propre charte et son propre public · nouvelle fonctionnalité de quelque nature que ce soit.

## 10. Comment on saura que c'est réussi

- Le tableau de bord tient sur un écran sans défilement, sur ordinateur.
- Un nouvel arrivant comprend où aller sans explication.
- Noter un échange depuis un iPhone est possible.
- Aucun test ne casse, l'Écran TV est intact, et le diff sur le backend est vide.

## 11. Risques et points d'attention

- **Le vocabulaire de l'interface diverge de celui d'Airtable.** Une « Affaire » à l'écran reste une « Opportunité » dans la base. C'est assumé — aligner les deux toucherait au socle — mais il faut le documenter, sous peine de perdre le prochain intervenant.
- **Replier des sections peut masquer de l'information utile.** Le compteur sur chaque titre replié est là pour l'éviter ; si un doute subsiste, laisser ouvert plutôt que replier.
- **Réduire de douze à quatre indicateurs supprime des chiffres que quelqu'un regarde peut-être.** Ils restent disponibles dans Airtable, et la décision se réexamine après quelques semaines d'usage.
- **Le mobile n'a jamais été testé.** Aucun test automatisé ne couvre le rendu : la validation sera visuelle, sur un vrai iPhone.
