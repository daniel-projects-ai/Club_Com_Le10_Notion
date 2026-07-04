# 🖥️ Écran d'Affichage Dynamique — Club Com' Le 10

Application React moderne pour afficher les opportunités et indicateurs du Club Com' Le 10 sur un grand écran (TV) dans les locaux.

## ✨ Fonctionnalités

- **Rotation automatique** de 3 slides (20-15-20 secondes)
  - Slide 1 : Opportunités actives (2 par slide)
  - Slide 2 : Tableau de bord (KPIs en temps réel)
  - Slide 3 : Présentation Club Com' Le 10

- **Design moderne et ergonomique**
  - Tailwind CSS + gradients élégants
  - Animations fluides (fade in/out)
  - Responsive (adapté aux grands écrans)
  - Horloge en temps réel

- **Prêt pour l'intégration Notion**
  - Structure données modulaire
  - Données de test incluses
  - API Notion prête à connecter

## 🚀 Installation & Démarrage

### 1. Installer les dépendances
```bash
cd /Users/danielsuch/Documents/Club_Com_Le10_Notion/ecran-affichage-dynamique
npm install
```

### 2. Lancer en développement
```bash
npm run dev
```
L'app s'ouvre automatiquement sur http://localhost:3000

### 3. Builder pour la production
```bash
npm run build
npm run preview
```

## 📁 Structure du projet

```
ecran-affichage-dynamique/
├── src/
│   ├── components/
│   │   ├── ScreenTV.jsx          # Conteneur principal + rotation
│   │   ├── SlideOpportunities.jsx # Slide des offres
│   │   ├── SlideStats.jsx         # Slide des KPIs
│   │   └── SlideClubCom.jsx       # Slide Club Com' Le 10
│   ├── App.jsx                    # Component racine
│   ├── main.jsx                   # Point d'entrée React
│   ├── index.css                  # Styles Tailwind
│   └── mockData.js                # Données de test
├── index.html                     # HTML principal
├── vite.config.js                 # Config Vite
├── tailwind.config.js             # Config Tailwind
├── postcss.config.js              # Config PostCSS
└── package.json                   # Dépendances

```

## 🎨 Customisation

### Modifier les données
Éditez `src/mockData.js` :
```javascript
export const mockData = {
  opportunities: [...],  // Ajouter/modifier les offres
  stats: {...},          // Changer les KPIs
  clubComInfo: {...}     // Infos Club Com' Le 10
}
```

### Modifier les durées de slide
Dans `src/components/ScreenTV.jsx`, ligne `slides` :
```javascript
const slides = [
  { id: 1, component: SlideOpportunities, duration: 20 }, // 20 sec
  { id: 2, component: SlideStats, duration: 15 },         // 15 sec
  { id: 3, component: SlideClubCom, duration: 20 }        // 20 sec
]
```

### Changer les couleurs
Éditez `tailwind.config.js` pour les couleurs Macao.

## 🔌 Connexion à Notion (Prochaine étape)

À faire :
1. Créer un service `src/services/notionAPI.js`
2. Intégrer l'API Notion pour :
   - Récupérer les opportunités en temps réel
   - Calculer les KPIs dynamiquement
   - Auto-refresh toutes les 30 minutes

## 📺 Déploiement

### Option 1 : Vercel (recommandé)
```bash
npm install -g vercel
vercel
```

### Option 2 : Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3 : Serveur local (pour la TV)
```bash
npm run build
# Serveur simple Python
python -m http.server 8000 --directory dist
# Ouvrir sur la TV : http://192.168.x.x:8000
```

## 🔧 Stack Technologique

- **React 18** — Framework UI
- **Vite** — Build tool ultra-rapide
- **Tailwind CSS** — Styling moderne
- **JavaScript moderne** — ES modules

## 📝 Notes

- L'app est **fullscreen optimisée** pour grands écrans
- **Zéro interaction utilisateur requise** (affichage pur)
- **Horloge** en haut à droite pour se repérer
- **Indicateurs de slide** en bas pour voir la progression

## 🚀 Prochaines étapes

1. ✅ Tester en local sur un écran
2. 🔌 Connecter l'API Notion
3. 📊 Ajouter le Dashboard de modération
4. 🚀 Déployer en production
5. 📱 Créer l'app mobile pour modération

---

**Questions ?** Contactez l'équipe Macao : contact@agence-macao.com
