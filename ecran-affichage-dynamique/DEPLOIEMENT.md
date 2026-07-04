# 🚀 Guide de Déploiement — Écran TV Club Com' Le 10

Guide complet pour déployer le système en production.

---

## 📋 Prérequis

- Compte Vercel (gratuit) pour le frontend
- Compte Railway (gratuit) pour le backend
- Clé API Notion
- Git configuré

---

## 🌐 Partie 1 : Déployer le Frontend (Vercel)

### Étape 1 : Créer un compte Vercel
1. Allez à https://vercel.com
2. Cliquez **"Sign Up"**
3. Connectez-vous avec GitHub ou email

### Étape 2 : Connecter le repository
1. Allez à https://vercel.com/new
2. Sélectionnez **"Import Git Repository"**
3. Cherchez : `Club_Com_Le10_Notion`
4. Cliquez **Import**

### Étape 3 : Configurer le projet
- **Framework**: Vite
- **Root Directory**: `ecran-affichage-dynamique`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Étape 4 : Variables d'environnement
Aucune requise pour le frontend (il accède au backend via `localhost:5001` en dev).

### Étape 5 : Déployer
Cliquez **Deploy** → Vercel construit et publie automatiquement.

**Votre Écran TV est live !** 🎉  
URL: `https://[votre-project].vercel.app`

---

## 🔌 Partie 2 : Déployer le Backend (Railway)

### Étape 1 : Créer un compte Railway
1. Allez à https://railway.app
2. Cliquez **"Sign Up"**
3. Connectez-vous avec GitHub

### Étape 2 : Créer une nouvelle app
1. Dashboard → **"Create New"** → **Project**
2. Cliquez **"Deploy from GitHub repo"**
3. Cherchez : `Club_Com_Le10_Notion`
4. Sélectionnez `ecran-affichage-dynamique`

### Étape 3 : Configurer le build
- **Start Command**: `npm run server`
- **Build Command**: `npm install`

### Étape 4 : Variables d'environnement
Allez à **Project Settings** → **Variables** et ajoutez :
```
NOTION_API_KEY=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
NOTION_DB_OPPORTUNITIES=380eb37e55598044b885dde5eb3ca5a7
NOTION_DB_DOSSIERS=380eb37e555980d486a3ed5c3fe5b950
PORT=5001
NODE_ENV=production
```

### Étape 5 : Déployer
Railway déploie automatiquement quand les variables sont configurées.

**Votre API est live !** 🎊  
URL: `https://[votre-railway-app].railway.app`

---

## 🔗 Partie 3 : Connecter Frontend ↔ Backend

### Mettre à jour les URLs du Frontend

Créez un fichier `.env.production` :

```bash
VITE_API_BASE_URL=https://[votre-railway-app].railway.app
```

Puis mettez à jour le Dashboard pour utiliser cette variable :

```javascript
// src/pages/Dashboard.jsx
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

const oppRes = await fetch(`${API_BASE}/api/notion/opportunities`)
```

Déployez à nouveau sur Vercel.

---

## 🔐 Partie 4 : Partager la Base Notion

**C'est l'étape critique pour que l'API accède aux données réelles !**

### Pour la base **Opportunités** :
1. Ouvrez Notion
2. Allez à la base **Opportunités**
3. Cliquez les **3 points** (...) en haut à droite
4. **Share** → Trouvez **"Écran TV Club Com' Le 10"**
5. Cliquez pour donner l'accès ✅

### Répétez pour la base **Dossiers de réponse**

Une fois partagée, l'API Notion récupérera les **vraies données** 🎯

---

## 🧪 Tester en Production

### Test 1 : Écran TV
```
https://[votre-vercel-app].vercel.app
```
→ Devrait afficher les opportunités

### Test 2 : Dashboard
```
https://[votre-vercel-app].vercel.app/dashboard
```
→ Login: `macao` / `Le10Admin2026`
→ Testez les toggles visible/caché

### Test 3 : API
```
curl https://[votre-railway-app].railway.app/api/health
```
→ Devrait retourner `{"status":"OK"}`

---

## 📊 Indicateurs de Succès

✅ Écran TV affiche les opportunités  
✅ Dashboard charge sans erreur  
✅ Toggle visible/caché fonctionne  
✅ WebSocket synchronise en temps réel  
✅ Aucun flash blanc  

---

## 🐛 Troubleshooting

### "Could not find database"
→ La base Notion n'est pas partagée avec l'intégration API  
→ **Solution**: Aller dans Notion et partager la base (étape 4)

### "WebSocket connection refused"
→ Le backend n'est pas accessible  
→ **Solution**: Vérifier que Railway a fini de déployer

### "Blank screen"
→ Vérifier la console du navigateur (F12)  
→ Vérifier que l'URL de l'API est correcte dans les .env

---

## 🎛️ Administration

### Changer les credentials
Éditez `src/pages/Login.jsx` :
```javascript
const VALID_USERNAME = 'macao'
const VALID_PASSWORD = 'Le10Admin2026'
```

### Changer les durées des slides
Éditez `src/components/ScreenTV.jsx` :
```javascript
const slides = [
  { id: 1, component: SlideOpportunities, duration: 20 },  // 20 secondes
  { id: 2, component: SlideStats, duration: 15 },          // 15 secondes
  { id: 3, component: SlideClubCom, duration: 20 }         // 20 secondes
]
```

---

## 📱 Accès à distance

### Pour afficher sur une TV :
1. Connectez un appareil à la TV (Chromecast, Apple TV, HDMI)
2. Accédez à : `https://[votre-vercel-app].vercel.app`
3. L'Écran TV s'affichera en plein écran ✨

### Pour le Dashboard (modération) :
1. Depuis n'importe quel ordinateur
2. Accédez à : `https://[votre-vercel-app].vercel.app/dashboard`
3. Login avec les credentials
4. Contrôlez ce qui s'affiche sur la TV 📊

---

## 🔄 Mises à jour futures

Chaque fois que vous pushez sur la branche `main` :
- Vercel recompile et déploie automatiquement
- Railway redéploie le backend
- Les changements sont en live en ~1 minute

---

## 📞 Support

Si quelque chose ne marche pas :
1. Vérifier les logs Vercel/Railway
2. Vérifier la console du navigateur (F12)
3. Vérifier la base Notion est partagée
4. Redémarrer le navigateur

---

**Vous êtes prêt pour la production !** 🚀
