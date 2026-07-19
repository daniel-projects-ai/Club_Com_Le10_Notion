# Reprise du projet — Agence Macao / LE 10 Coworking

> Document de passation. À lire en entier avant toute modification.
> Dernière mise à jour : 2026-07-19

---

## 1. Le contexte métier

**Agence Macao** est une agence de communication à Agen (Lot-et-Garonne), animée par **Daniel Such, Dominique et Mathieu**. Elle anime **LE 10 Coworking**, dont la communauté de professionnels de la com s'appelle le **Club Com' Le 10**.

L'agence détecte des **opportunités** (appels d'offres publics, consultations, projets privés) et les partage avec les coworkers, qui peuvent s'y positionner. Trois systèmes ont été construits autour de ça.

## 2. Les trois systèmes en production

| Système | URL | Rôle |
|---|---|---|
| **Écran TV** | https://club-com-le10-notion.vercel.app | Affichage public dans les locaux, sur une TV Samsung |
| **Intranet Macao** | https://intranet-macao.vercel.app | Portail authentifié (équipe + coworkers) |
| **Backend partagé** | https://clubcomle10notion-production.up.railway.app | API Express commune aux deux |

Plus, hors code :
- **Base Airtable** — source unique de vérité : https://airtable.com/appdJ309q39i4Gr8t
- **Interfaces Airtable** — Espace Coworkers `pbdNCHS6Btu0JKWPU`, Pilotage Macao `pbdBCobP63gRYWFm1`
- **Jotform** — 2 formulaires + l'agent IA « Léa »

## 3. Architecture

```
                    Airtable  ← source unique de vérité
                       │
        ┌──────────────┼───────────────┬──────────────┐
        ↓              ↓               ↓              ↑
   Écran TV        Intranet      Interfaces      Jotform
   (public)      (authentifié)    Airtable      + Léa (IA)
        │              │
        └──────┬───────┘
               ↓
      Backend Express (Railway)
```

**Principe directeur :** Airtable reste la base de données et le lieu de saisie. Le code est une couche de lecture et de pilotage par-dessus. Notion a été entièrement abandonné (juillet 2026).

## 4. Le dépôt

```
Club_Com_Le10_Notion/
├── ecran-affichage-dynamique/     # Écran TV + BACKEND PARTAGÉ
│   ├── src/                       # front React de l'écran TV
│   ├── server/                    # ⚠️ backend commun aux deux applis
│   │   ├── server.js              # montage des routes, CORS, WebSocket
│   │   ├── services/
│   │   │   ├── airtableClient.js  # lecture/écriture Opportunités
│   │   │   ├── coworkersClient.js # lecture Coworkers
│   │   │   ├── positionnementsClient.js
│   │   │   ├── auth.js            # jetons JWT (testé)
│   │   │   ├── permissions.js     # matrice des rôles (testé)
│   │   │   └── mailer.js          # Resend
│   │   ├── middleware/requireAuth.js
│   │   └── routes/
│   │       ├── opportunities.js   # public (écran TV)
│   │       ├── moderation.js      # public (héritage)
│   │       └── intranet/          # authentifié
│   └── tests/                     # node --test (11 tests)
├── intranet-macao/                # portail React
└── docs/                          # specs, plans, état de construction
```

**⚠️ Dette de nommage assumée :** le dossier `ecran-affichage-dynamique/server/` héberge le backend des **deux** applications. Le renommer imposerait de reconfigurer Railway sur un service en production — à faire lors d'une migration d'infra, jamais pendant une livraison fonctionnelle.

## 5. Airtable — identifiants

**Base :** `appdJ309q39i4Gr8t`

| Table | ID |
|---|---|
| Opportunités | `tbl3jvmo4VjUDTkmD` |
| Coworkers | `tbl89xazn0oY4A18o` |
| Métiers | `tblkKza5jMfBqEC4b` |
| Positionnements | `tbllJ1W7jxuTcODwe` |
| Commentaires | `tblvkQvlOW9CdKEPm` |
| Contacts | `tblddrQJJgmh0FW21` |

**Champs dont l'ID est utilisé en dur dans le code** (écriture par ID pour survivre à un renommage) :

| Champ | ID |
|---|---|
| Opportunités · Statut | `fldfLM2jlZSFEnlPL` |
| Opportunités · Visible sur écran | `fldB43DeH03YeBkuR` |
| Positionnements · Coworker | `fldXtuPm5uEUybKhR` |
| Positionnements · Opportunité | `fld86VS10pTChIe6A` |
| Positionnements · Statut | `fld6LyBF7ywt9M5Tt` |
| Positionnements · Date | `fldYCMAEoCheS5Xre` |

**Règles métier encodées :**
- Une opportunité s'affiche sur la TV si `Visible sur écran` est coché, qu'elle a un acheteur, et que son statut n'est ni `Perdu`, ni `Archivé`, ni `NO GO`.
- Le tableau de bord Macao lit **toutes** les opportunités (`getAllOpportunities`), pas seulement les affichables — sinon les « À analyser » n'apparaîtraient jamais.
- Rôles : `Macao` (tout), `Coworker` et `Freelance` (vue réduite, sans le score IA).

## 6. Jotform et l'agent Léa

| Élément | ID / URL |
|---|---|
| Formulaire inscription | `261955996118069` |
| Formulaire contact | `261956539490066` |
| Agent IA « Léa » | assistante d'accueil, reliée au formulaire d'inscription |

Léa est un agent conversationnel Jotform : elle accueille les candidats, les guide dans l'inscription, et **ne propose que les 15 métiers du référentiel** (règle inscrite dans ses *Chat Guidelines*, la liste vivant dans sa *Knowledge Base*). Elle a interdiction d'évoquer des opportunités précises (elle n'y a pas accès) et de promettre une adhésion.

## 7. Variables d'environnement (Railway)

```
AIRTABLE_TOKEN      # scopes requis : data.records:read ET data.records:write
AIRTABLE_BASE_ID    # appdJ309q39i4Gr8t
JWT_SECRET          # signature des sessions
RESEND_API_KEY      # envoi des liens magiques
RESEND_FROM         # intranet@agence-macao.com
INTRANET_URL        # https://intranet-macao.vercel.app (SANS slash final)
NODE_ENV=production
PORT
```

Sans `JWT_SECRET`, les routes `/api/intranet/*` répondent **503** volontairement — et l'Écran TV continue de fonctionner. C'est un échec bruyant assumé.

## 8. Déploiements

| Quoi | Où | Répertoire racine |
|---|---|---|
| Écran TV | Vercel `club-com-le10-notion` | `ecran-affichage-dynamique` |
| Intranet | Vercel `intranet-macao` | `intranet-macao` |
| Backend | Railway `Club_Com_Le10_Notion` | `ecran-affichage-dynamique` |

Les trois se déploient automatiquement depuis la branche **`main`**. **Toute fusion sur `main` part en production**, y compris sur l'écran affiché dans les locaux.

## 9. Conventions de code

- **Tout en français** : noms de variables, commentaires, textes d'interface. Vouvoiement dans l'interface.
- **Modules ES** (`"type": "module"`), Node 22 en production.
- Les commentaires expliquent le **pourquoi**, jamais le quoi.
- Tests : `node --test` (runner natif, aucune dépendance). ⚠️ `node --test tests/` échoue sur macOS — utiliser `node --test` seul.
- Chartes graphiques : **Macao** (anthracite `#1d1d1b`, terracotta `#c0562f`, teal `#206b73`, or `#e9a94e`) pour l'intranet ; **LE 10** (pétrole `#00252b`, or `#efad29`, crème `#faf6ec`) pour l'écran TV et l'espace coworkers. Polices : Work Sans (interface), Lora (titres).

## 10. Pièges rencontrés — à ne pas refaire

Ces problèmes ont coûté du temps. Ils sont documentés pour éviter de les revivre.

**Safari bloque les cookies tiers.** L'intranet ne pouvait garder aucune session : le cookie posé par `railway.app` pendant qu'on navigue sur `vercel.app` est un cookie tiers, que l'ITP de Safari rejette — `SameSite=None` n'y change rien. **Solution :** Vercel relaie `/api/*` vers Railway (voir `intranet-macao/vercel.json`), le navigateur ne parle donc qu'à un seul domaine et le cookie reste first-party. Le front appelle des URL **relatives**.

**CORS `*` est incompatible avec les cookies.** Le middleware distingue les routes publiques (joker) des routes intranet (origine explicite + `credentials`).

**La réécriture SPA est obligatoire sur Vercel.** Sans elle, `/verify?token=…` et `/dashboard` renvoient 404 — donc tous les liens de connexion échouent.

**Le SDK Notion plantait** (`ERR_STREAM_PREMATURE_CLOSE`) avec Node 22. C'est ce qui a motivé l'usage du `fetch` natif partout. Ne pas réintroduire de SDK sans nécessité.

**Resend doit être instancié paresseusement.** `new Resend(undefined)` lève au chargement du module et ferait planter **tout** le serveur, écran TV compris.

**L'API Airtable ne sait pas tout faire :** impossible de créer une option de liste (utiliser `typecast: true` sur une écriture), de changer le type d'un champ, ni de créer des champs IA ou des automatisations — ces derniers n'existent que dans l'éditeur.

**Jotform ne mappe pas les cases à cocher vers n'importe quoi.** Un champ « cases à cocher » ne peut alimenter ni un champ texte, ni un champ lien Airtable : il lui faut une **sélection multiple** aux libellés strictement identiques. Et les **widgets** Jotform (type « Terms & Conditions », rendus en iframe) sont impossibles à remplir pour un agent conversationnel — utiliser des champs natifs.

**Les IDs Airtable copiés depuis une URL** contiennent souvent `?v=…` (identifiant de vue). Le code les nettoie, mais y penser lors d'une saisie manuelle.

## 11. Dette technique connue

- **Aucun test** ne couvre les routes qui appellent Airtable (elles nécessiteraient un harnais de mock). Seuls `auth.js` et `permissions.js` sont testés — 11 tests.
- **La liste des statuts est dupliquée** entre `airtableClient.js` (qui valide) et la page Opportunités du portail (qui affiche le menu). Les deux apps se déploient séparément et ne partagent pas de module.
- **État en mémoire** : jetons magiques consommés et compteurs anti-abus vivent dans le process. Un redémarrage les efface ; plusieurs répliques Railway les multiplieraient.
- **Révocation d'accès différée** : rôle et statut vivent dans le jeton de session (7 jours). Désactiver un coworker dans Airtable ne le déconnecte pas immédiatement.
- **`/api/moderation/*`** expose des POST non authentifiés (héritage de l'écran TV, antérieur à l'intranet).
- **Le token Airtable a un droit d'écriture global** sur la base — Airtable ne permet pas de restreindre par table.
- **Budgets et échéances vides** dans Airtable : les indicateurs affichent « — ». C'est voulu (un zéro faux serait pire), mais ça se remplit côté données.

## 12. Feuille de route

Le séquencement validé avec le client :

1. ✅ **Portail intranet** — authentification, tableaux de bord par rôle, positionnements
2. 🔲 **Dossiers de réponse** — pièces à fournir, qui rédige quoi, échéances, dépôt
3. 🔲 **Clients / CRM et références** — historique par acheteur, bibliothèque de références réutilisables
4. 🔲 **Facturation et rentabilité** — devis, factures, marge par projet

Chaque module embarque son propre tableau de bord ; la vue dirigeant se consolide au fur et à mesure. **Un tableau de bord n'est pas un module, c'est une conséquence** — il ne peut afficher que ce que les modules alimentent.

## 13. Documents de référence

| Document | Contenu |
|---|---|
| `docs/superpowers/specs/2026-07-15-plateforme-coworkers-design.md` | Conception de la plateforme coworkers |
| `docs/superpowers/specs/2026-07-17-intranet-macao-portail-design.md` | Conception de l'intranet |
| `docs/superpowers/plans/2026-07-17-intranet-macao-portail.md` | Plan d'implémentation détaillé |
| `docs/plateforme-coworkers/01-schema-base-de-donnees.html` | Schéma visuel de la base |
| `docs/plateforme-coworkers/02-etat-de-construction.md` | État Airtable/Jotform |
| `docs/plateforme-coworkers/03-intranet-etat.md` | État et mise en service de l'intranet |

## 14. Méthode de travail attendue

Le projet a été mené selon une discipline qu'il est recommandé de conserver :

- **Concevoir avant de coder** : une spec validée, puis un plan, puis l'implémentation.
- **Vérifier plutôt qu'affirmer** : ne jamais annoncer qu'une chose fonctionne sans l'avoir constatée (requête réelle, test lancé, sortie observée).
- **Ne jamais casser l'écran TV** : il est affiché en permanence dans les locaux. Toute modification du backend partagé doit être vérifiée sur `/api/opportunities` et `/api/health`.
- **Travailler sur une branche** pour toute évolution substantielle : `main` déploie en production.
- **Dire ce qui ne va pas** : les limites, les dettes et les échecs sont documentés ici précisément parce qu'ils ont été nommés plutôt que masqués.
