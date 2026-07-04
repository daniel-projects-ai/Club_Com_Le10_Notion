# 🚀 Guide Complet — Écran TV + Dashboard Modération

Système complet de diffusion d'opportunités sur grand écran avec modération en temps réel.

---

## 📋 Architecture

```
NOTION (source vérité)
    ↓ API
BACKEND Express + WebSocket
    ↙        ↖
ÉCRAN TV   DASHBOARD
(public)   (modération)
```

---

## 🎯 Installation

### 1️⃣ Mettre à jour les dépendances

```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
npm install
```

### 2️⃣ Vérifier le fichier `.env`

Fichier : `.env`
```
NOTION_API_KEY=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
NOTION_DB_OPPORTUNITIES=380eb37e55598044b885dde5eb3ca5a7
NOTION_DB_DOSSIERS=380eb37e555980d486a3ed5c3fe5b950
PORT=5000
NODE_ENV=development
```

✅ **Clé API et IDs déjà inclus** (voir `.env.example` pour le modèle)

---

## 🚀 Démarrage

### Option A : Tout en même temps (recommandé)

```bash
npm run dev:all
```

Cela lance :
- ✅ **Backend Express** → http://localhost:5000
- ✅ **Écran TV** → http://localhost:3000
- ✅ **Dashboard** → http://localhost:3000/dashboard

### Option B : Séparément

**Terminal 1 — Backend :**
```bash
npm run server
```

**Terminal 2 — Frontend :**
```bash
npm run dev
```

---

## 🎨 Utilisation

### 🖥️ Écran TV (http://localhost:3000)
- Affichage automatique des opportunités
- Rotation 3 slides (20s/15s/20s)
- **Contrôlé par le Dashboard**

### 📊 Dashboard (http://localhost:3000/dashboard)
- Affichage/masquage des opportunités
- Pause/reprise
- Rafraîchissement Notion
- Vue stats en direct

---

## 🔌 API Backend (http://localhost:5000)

### Endpoints Notion

**GET /api/notion/opportunities**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Campagne jeunesse",
      "client": "Ville de Montauban",
      "deadline": "28 juin 2026",
      "budget": "22000€",
      "status": "Ouvert"
    }
  ],
  "source": "notion"
}
```

**GET /api/notion/stats**
```json
{
  "data": {
    "portfolio": "287000€",
    "successRate": "68%",
    "activeOpportunities": 3,
    "freelancesEngaged": 8
  }
}
```

**GET /api/notion/refresh**
- Force un rafraîchissement des données Notion

### Endpoints Modération

**POST /api/moderation/toggle-opportunity**
```bash
curl -X POST http://localhost:5000/api/moderation/toggle-opportunity \
  -H "Content-Type: application/json" \
  -d '{"id": "opportunity-id"}'
```

**POST /api/moderation/pause**
- Pause/reprend l'affichage

**POST /api/moderation/reset**
- Réinitialise tous les paramètres

---

## 🔄 WebSocket (temps réel)

Le Dashboard et l'Écran TV se synchronisent via WebSocket sur `ws://localhost:5000`

Messages :
- `state` — État complet du système
- `opportunityToggled` — Une offre a été masquée/affichée
- `pauseToggled` — L'affichage a été mis en pause
- `reset` — Réinitialisation

---

## 🔐 Sécurité

⚠️ **Important avant production :**

1. **Ne pas committer `.env`** avec les clés API
   ```bash
   # Ajouter à .gitignore (déjà fait)
   .env
   ```

2. **Utiliser des variables d'environnement** sur le serveur
   ```bash
   export NOTION_API_KEY=your-key-here
   ```

3. **Ajouter une authentification** au Dashboard
   ```javascript
   // À implémenter : login simple ou API key
   ```

4. **Limiter l'accès aux endpoints** modération
   ```javascript
   // Ajouter middleware d'auth
   ```

---

## 📱 Responsive

- ✅ **Écran TV** : Optimisé pour 16:9 / 4:3
- ✅ **Dashboard** : Responsive desktop/tablet
- ✅ **Mobile** : Non optimisé (modération depuis desktop)

---

## 🐛 Troubleshooting

### Notion API 401 (clé invalide)
```bash
# Vérifier la clé dans .env
echo $NOTION_API_KEY
```

### WebSocket Connection Refused
```bash
# Vérifier que le backend est lancé
npm run server
```

### CORS Errors
```bash
# Backend express a déjà cors() configuré
# Si erreur persiste : vérifier PORT=5000
```

### Aucune donnée affichée
```bash
# Vérifier :
# 1. Base Notion accessible (clé API)
# 2. Opportunités dans Notion avec Status = "Ouvert"
# 3. Endpoint /api/notion/opportunities retourne des données
```

---

## 📊 Monitoring

### Logs du backend

```
✅ Client WebSocket connecté
📨 Message WebSocket reçu: opportunityToggled
🔄 Rafraîchissement Notion...
```

### Vérifier l'état du système

```bash
curl http://localhost:5000/api/moderation/state
```

```json
{
  "opportunities": { "id1": { "visible": true } },
  "displayOrder": [1, 2, 3],
  "durations": { "1": 20, "2": 15, "3": 20 },
  "paused": false,
  "lastUpdate": "2026-07-05T14:30:00Z"
}
```

---

## 🚀 Déploiement

### Vercel (Frontend)
```bash
npm run build
vercel
```

### Render/Railway (Backend)
```bash
# Créer une app Node.js
# Branch : main
# Build : npm install
# Start : npm run server
# Env variables : NOTION_API_KEY, etc.
```

---

## 📚 Structure

```
ecran-affichage-dynamique/
├── server/
│   ├── server.js                    # Point d'entrée Express
│   ├── services/
│   │   └── notionClient.js          # Service API Notion
│   └── routes/
│       ├── notion.js                # Routes /api/notion/*
│       └── moderation.js            # Routes /api/moderation/*
├── src/
│   ├── pages/
│   │   └── Dashboard.jsx            # Page modération
│   ├── components/
│   │   ├── ScreenTV.jsx             # Écran TV (Écran public)
│   │   ├── SlideOpportunities.jsx
│   │   ├── SlideStats.jsx
│   │   └── SlideClubCom.jsx
│   ├── hooks/
│   │   └── useWebSocket.js          # Hook sync temps réel
│   ├── App.jsx                      # Router
│   └── index.css
├── .env                             # Variables sécurisées
├── package.json
└── vite.config.js
```

---

## ✨ Features actuelles

✅ Écran TV avec rotation auto
✅ Dashboard de modération
✅ Sync temps réel WebSocket
✅ API Notion avec cache
✅ Toggle visibilité opportunités
✅ Pause/reprise affichage

## 🔮 À implémenter

⏳ Authentification Dashboard
⏳ Reordering des slides
⏳ Durées personnalisables par slide
⏳ Upload images/logos
⏳ Statistiques détaillées

---

**Questions ?** Contactez l'équipe Macao : contact@agence-macao.com
