# Intranet Macao — Phase 1 : le portail (conception)

**Date :** 2026-07-17
**Porteur :** Daniel Such (Agence Macao)
**Statut :** Conception validée — prête pour le plan d'implémentation

---

## 1. Cadre COSTAR

- **Contexte** — L'agence Macao (Daniel, Dominique, Mathieu) anime LE 10 Coworking et le Club Com' à Agen, et répond à des appels d'offres en communication. Deux modules existent déjà en production : gestion des opportunités et gestion des coworkers, sur une base Airtable, avec un écran d'affichage public et un agent IA d'accueil (Léa).
- **Objectif** — Rassembler ces briques, et celles à venir, dans un intranet unique doté de tableaux de bord ergonomiques et immédiatement compréhensibles.
- **Style / Ton** — Professionnel, chaleureux, créatif. Identité mixte : Macao pour l'agence, LE 10 pour l'espace coworkers.
- **Audience** — Trois rôles : *Macao* (accès complet), *Coworker* (opportunités et annuaire), *Freelance* (mission en cours ; périmètre élargi en phase ultérieure).
- **Réponse attendue** — Une phase 1 livrant un portail utilisable, puis trois modules métier successifs.

## 2. Décisions d'architecture

**Socle hybride.** Airtable reste la base de données et le lieu de saisie. Le portail est une couche de lecture et de pilotage. On ne remplace pas ce qui fonctionne.

**Réutilisation du backend existant.** Le service Express déjà déployé sur Railway lit Airtable et détient le token. On y ajoute un groupe de routes protégées plutôt que de maintenir un second service.

```
Airtable (données)
    ↑ API REST, token serveur uniquement
Backend Express (Railway, existant)
    ├─ /api/public/*    → Écran TV (ouvert, non authentifié)
    └─ /api/intranet/*  → portail (session requise)
    ↓
Portail React + Vite (Vercel, nouvelle application)
```

**Le filtrage par rôle se fait côté serveur.** Le client ne reçoit jamais de données qu'il n'a pas le droit de voir : aucune donnée sensible ne transite pour être masquée ensuite en CSS.

**Séquencement retenu (option A).** Portail et premier tableau de bord sur les données existantes, puis Dossiers de réponse → Clients/Références → Facturation. Un tableau de bord n'est pas un module : chaque module livre le sien, et la vue dirigeant se consolide progressivement.

## 3. Authentification — lien magique

**Flux**
1. L'utilisateur saisit son email sur la page de connexion.
2. Le serveur cherche cet email dans la table **Coworkers** et lit son champ **Rôle**. Email inconnu ou statut `Inactif` → message neutre, sans révéler si le compte existe.
3. Le serveur génère un jeton signé (JWT, HS256) valable **15 minutes**, à usage unique.
4. **Resend** envoie l'email contenant le lien.
5. Le clic vérifie le jeton et ouvre une **session de 30 jours** (cookie `httpOnly`, `Secure`, `SameSite=Lax`).
6. Chaque appel à `/api/intranet/*` lit la session, en déduit le rôle, et filtre les données en conséquence.

**Choix techniques**
- `RESEND_API_KEY` et `JWT_SECRET` en variables d'environnement Railway.
- Pas de table de sessions : le JWT porte l'identité (id Airtable du coworker, email, rôle). Simple, sans état, suffisant à cette échelle.
- Anti-abus : maximum 5 demandes de lien par email et par heure.

## 4. Rôles et permissions

Le champ **Rôle** de la table Coworkers doit accueillir une troisième option : `Freelance` (aujourd'hui `Coworker` et `Macao`).

| Donnée | Macao | Coworker | Freelance |
|---|---|---|---|
| Opportunités visibles | toutes | celles marquées visibles | celles marquées visibles |
| Score IA, notes internes, référent | ✅ | ❌ | ❌ |
| Positionnements | tous | les siens | les siens |
| Annuaire des coworkers | ✅ | ✅ | ✅ |
| Inscriptions à valider, contacts | ✅ | ❌ | ❌ |
| Modules futurs (CRM, facturation) | ✅ | ❌ | ❌ |

En phase 1, *Freelance* voit la même chose que *Coworker* ; le rôle est créé maintenant pour que le module Projets s'y branche sans refonte.

## 5. Pages de la phase 1

| Page | Contenu |
|---|---|
| **Connexion** | saisie de l'email, envoi du lien magique |
| **Tableau de bord** | page d'accueil, contenu selon le rôle (§6) |
| **Opportunités** | liste filtrable, fiche détaillée, bouton « ça m'intéresse » |
| **Annuaire** | coworkers actifs, filtrables par métier |
| **Mon profil** | ses informations, ses métiers, ses positionnements |

Coquille commune : navigation latérale, en-tête avec logo, nom de l'utilisateur et déconnexion.

## 6. Tableaux de bord

**Vue Macao — pilotage**
- Bandeau de 4 chiffres : opportunités actives · à analyser · échéances sous 30 jours · positionnements en attente
- Pipeline par statut (barres proportionnelles, pas de camembert)
- Opportunités à traiter, triées par score IA décroissant
- Colonne « à faire » : inscriptions à valider, contacts non traités

**Vue Coworker / Freelance**
- Bandeau : opportunités correspondant à mes métiers · mes positionnements en cours
- Ces opportunités, triées par échéance
- Raccourci vers l'annuaire

**Principes d'ergonomie** — c'est l'exigence centrale du projet :
- Le résumé précède le détail : la première hauteur d'écran suffit à savoir où on en est.
- L'état est encodé dans la forme (pastille, couleur, position), pas seulement dans le chiffre.
- Aucune visualisation décorative : chaque bloc répond à une question explicite.
- Ce qui appelle une action est visuellement distinct de ce qui informe.
- Les valeurs absentes s'affichent « — », jamais « 0 » : un zéro faux est pire qu'un vide honnête.

## 7. Identité visuelle mixte

Les deux chartes partagent des familles chaudes, ce qui rend le mélange cohérent.

| Usage | Traitement |
|---|---|
| Coquille de l'intranet (nav, en-tête, fonds) | **Macao** : anthracite `#1d1d1b`, emblème en dégradé terracotta → teal → or |
| Accents et graphiques | dégradé Macao : terracotta `#c0562f`, teal `#206b73`, or `#e9a94e` |
| Espace coworkers (opportunités, annuaire) | **LE 10** : pétrole `#00252b`, or `#efad29`, emblème perroquet |
| Typographie | **Work Sans** pour l'interface (accord avec le wordmark géométrique Macao) ; **Lora** en serif réservé à l'espace LE 10 |

La bascule de charte signale à l'utilisateur qu'il change d'univers : administration de l'agence d'un côté, communauté du Club de l'autre.

## 8. Sécurité

- Token Airtable et clés côté serveur exclusivement ; jamais exposés au navigateur.
- Filtrage des données par rôle en amont de la réponse HTTP.
- Cookies `httpOnly` + `Secure` ; jetons de connexion à usage unique et courte durée.
- Les emails inconnus reçoivent la même réponse que les emails connus (pas d'énumération de comptes).
- Données personnelles des coworkers : accès restreint aux rôles autorisés, conformément au consentement recueilli à l'inscription.

## 9. Hors périmètre de la phase 1

Dossiers de réponse, CRM et références, facturation et rentabilité, portail client, gestion des espaces de coworking, application mobile. Ces modules viendront se brancher sur la coquille construite ici.

## 10. Risques et points d'attention

- **Adoption** — un intranet que personne n'ouvre est un échec. Le tableau de bord doit valoir l'ouverture dès la première semaine ; c'est le critère de réussite de la phase 1.
- **Délivrabilité des emails** — les liens magiques peuvent tomber en spam. Configurer le domaine d'envoi dans Resend (SPF/DKIM) dès la mise en route.
- **Qualité des données** — les tableaux de bord révèlent les champs vides (budgets et échéances ne sont pas renseignés aujourd'hui). C'est une vertu, pas un défaut : ils rendront visible ce qu'il faut compléter.
- **Charge de travail** — 4 modules en 3 mois est ambitieux pour une équipe de 3 personnes. Le séquencement permet de s'arrêter après n'importe quelle phase avec un outil utilisable.
