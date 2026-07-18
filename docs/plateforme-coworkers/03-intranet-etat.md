# Intranet Macao — état et mise en service

**Date :** 2026-07-18
**Branche :** `feat/intranet-macao-portail` (non fusionnée — rien n'est en production)

## Ce qui est construit

**Backend** — ajouté au service Express existant (`ecran-affichage-dynamique/server/`, déployé sur Railway). Les routes publiques de l'Écran TV sont **inchangées**.

| Fichier | Rôle |
|---|---|
| `services/auth.js` | Jetons de connexion (15 min, usage unique via `jti`) et de session (7 jours) |
| `services/permissions.js` | Matrice des rôles, filtrage des champs internes |
| `services/coworkersClient.js` | Lecture de la table Coworkers |
| `services/mailer.js` | Envoi du lien magique (Resend, instanciation paresseuse) |
| `middleware/requireAuth.js` | Session obligatoire, garde par rôle |
| `routes/intranet/auth.js` | `request-link`, `verify`, `me`, `logout` |
| `routes/intranet/data.js` | `dashboard`, `opportunities`, `directory`, `profile` |
| `tests/` | 11 tests (jetons + permissions), lancés par `node --test` |

**Portail** — `intranet-macao/` (React + Vite + Tailwind). Pages : connexion, vérification, tableau de bord, opportunités, annuaire, profil.

## Rôles

| | Macao | Coworker | Freelance |
|---|---|---|---|
| Opportunités | toutes | visibles à l'écran | visibles à l'écran |
| Score IA | ✅ | ❌ | ❌ |
| Pipeline, priorités | ✅ | ❌ | ❌ |
| Annuaire, profil | ✅ | ✅ | ✅ |

Le filtrage est fait **côté serveur** : les champs réservés ne quittent jamais l'API pour un autre rôle.

## Mise en service — ce qui reste à faire

### 1. Compte Resend
Créer un compte sur [resend.com](https://resend.com), ajouter le domaine `agence-macao.com` et publier les enregistrements **SPF et DKIM** fournis. Sans cette étape, les liens de connexion partent en spam. Récupérer la clé API.

### 2. Variables d'environnement Railway
À ajouter au service backend :

```
JWT_SECRET=<chaîne aléatoire, voir ci-dessous>
RESEND_API_KEY=<clé Resend>
RESEND_FROM=intranet@agence-macao.com
INTRANET_URL=<URL Vercel du portail>
NODE_ENV=production
```

Générer le secret :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Tant que `JWT_SECRET` est absent, les routes `/api/intranet` répondent 503** et l'écrivent dans les logs — par conception, pour ne pas laisser croire que l'intranet fonctionne. L'Écran TV, lui, continue de tourner normalement.

### 3. Projet Vercel
Nouveau projet pointant sur ce dépôt, **répertoire racine `intranet-macao`**. Récupérer l'URL et la reporter dans `INTRANET_URL` côté Railway (elle sert à construire les liens de connexion **et** à autoriser l'origine CORS).

### 4. Fusion de la branche
`feat/intranet-macao-portail` → `main`. C'est cette fusion qui déclenche les déploiements.

### 5. Vérifications après déploiement

```bash
# L'Écran TV fonctionne toujours
curl -s https://clubcomle10notion-production.up.railway.app/api/opportunities | head -c 80

# L'intranet refuse l'accès sans session
curl -s -o /dev/null -w "%{http_code}\n" https://clubcomle10notion-production.up.railway.app/api/intranet/dashboard
# attendu : 401
```

Puis, dans le navigateur : se connecter avec `daniel.such@icloud.com`, vérifier la réception de l'email, cliquer le lien, obtenir le tableau de bord Macao. **Recharger la page** pour confirmer que la session tient (c'est le test du cookie cross-site).

**Test de cloisonnement** — le plus important : créer une fiche Coworker de test avec une adresse accessible, s'y connecter, et vérifier dans l'onglet Réseau que la réponse de `/api/intranet/opportunities` **ne contient pas** `score`.

## Points connus

- **État en mémoire** : les jetons consommés et les compteurs du limiteur vivent dans le process. Un redémarrage Railway les efface (un lien magique redevient utilisable dans sa fenêtre de 15 min) et plusieurs répliques multiplieraient les quotas. Acceptable en instance unique ; à déplacer vers un stockage partagé en cas de montée en charge.
- **Révocation** : rôle et statut vivent dans le jeton de session, donc une désactivation met jusqu'à 7 jours à prendre effet. Pour une révocation immédiate, il faudrait revalider le statut en base à chaque requête.
- **Dette de nommage** : le dossier `ecran-affichage-dynamique/server/` héberge désormais un backend partagé (Écran TV **et** intranet). Le renommer imposerait de reconfigurer Railway sur un service en production — à faire lors d'une migration d'infrastructure, jamais pendant une livraison fonctionnelle.
- **`/api/moderation/*`** expose toujours des POST non authentifiés (héritage de l'Écran TV). Sans gravité aujourd'hui, mais l'écart avec l'intranet authentifié mérite d'être traité un jour.
