# 📺 Guide d'Utilisation — Écran TV Club Com' Le 10

Guide pour utiliser le système d'affichage dynamique au quotidien.

---

## 🖥️ Deux Écrans, Deux Rôles

### **Écran 1 : TV Grande (Public)**
- **URL**: `https://[votre-domaine].vercel.app`
- **Affiche**: Opportunités en rotation 🎯
- **Durée**: 20 sec → 15 sec → 20 sec (puis repeat)
- **Qui la voit**: Visiteurs des locaux LE 10
- **Mise à jour**: Automatique (chaque 30 min)

### **Écran 2 : Dashboard (Modération)**
- **URL**: `https://[votre-domaine].vercel.app/dashboard`
- **Accès**: `Login: macao` / `Password: Le10Admin2026`
- **Contrôle**: Qui s'affiche sur l'Écran TV 📊
- **Qui l'utilise**: Administrateur LE 10

---

## 🎯 Utilisation Quotidienne

### **Le matin : Vérifier les opportunités**

1. Ouvrir le **Dashboard**
   ```
   https://[votre-domaine].vercel.app/dashboard
   ```

2. **Se connecter**
   - Login: `macao`
   - Password: `Le10Admin2026`

3. Voir les opportunités du jour
   - ✅ Affichées en vert
   - 🚫 Masquées en rouge

### **Gérer l'affichage**

**Montrer une opportunité** :
- Cliquez sur **✅ AFFICHER**
- Elle apparaît sur la TV en temps réel ⚡

**Masquer une opportunité** :
- Cliquez sur **🚫 MASQUÉ**
- Elle disparaît de la TV immédiatement ⚡

**Rafraîchir les données Notion** :
- Cliquez sur **🔄 RAFRAÎCHIR**
- Les dernières données Notion se chargent

**Arrêter/Reprendre l'affichage** :
- Cliquez sur **▶️ EN DIRECT** pour continuer
- Cliquez sur **⏸️ REPRENDRE** pour reprendre

---

## 📊 Comprendre le Dashboard

### **État du système**
```
┌─────────────────────────────────────┐
│ État      │ Opportunités │ Cachées  │
│ ▶️ Direct │ 12           │ 2        │
└─────────────────────────────────────┘
```

- **État** : En direct ▶️ ou En pause ⏸️
- **Opportunités** : Total d'offres
- **Cachées** : Offres masquées volontairement

---

## 🔄 Scénarios d'Utilisation

### **Scénario 1 : Ajouter une opportunité**

1. Une nouvelle offre arrive dans Notion
2. Cliquez **🔄 RAFRAÎCHIR** dans le Dashboard
3. L'offre s'ajoute automatiquement
4. Cliquez **✅ AFFICHER** pour la montrer
5. Elle apparaît sur la TV ✨

### **Scénario 2 : Masquer une offre expirée**

1. Une deadline est passée
2. Dans le Dashboard, cliquez **🚫 MASQUÉ**
3. L'offre disparaît de la TV immédiatement
4. Elle reste en base de données (non supprimée)

### **Scénario 3 : Tester l'Écran TV**

1. Ouvrir `https://[votre-domaine].vercel.app` sur la TV
2. Vérifier la rotation :
   - Slide 1 (20s) : Opportunités
   - Slide 2 (15s) : Tableau de bord
   - Slide 3 (20s) : Club Com' Le 10
3. Horloge visible en haut à droite
4. Indicateurs de slide en bas

---

## 🎨 Comprendre l'Écran TV

### **Slide 1 : Opportunités** (20 sec)
```
📌 NOUVELLES OFFRES
━━━━━━━━━━━━━━━━━━━━━━
 🎯 Campagne jeunesse
    Client: Ville de Montauban
    Budget: 22 000€
    Deadline: 28 juin
    ▶ Voir sur AWsolutions
```

### **Slide 2 : Tableau de bord** (15 sec)
```
📊 INDICATEURS
━━━━━━━━━━━━━━━━━━━━━━
💰 Portefeuille: 287 000€
🎯 Taux réussite: 68%
📈 Opportunités actives: 12
👥 Freelances mobilisés: 8
```

### **Slide 3 : Club Com' Le 10** (20 sec)
```
🌟 CLUB COM' LE 10
━━━━━━━━━━━━━━━━━━━━━━
👥 10+ professionnels
🎨 Compétences complémentaires
💼 Opportunités régulières
📧 contact@agence-macao.com
```

---

## ⚙️ Paramètres Avancés

### **Changer les identifiants**
1. Contactez l'admin technique
2. Fichier à modifier : `src/pages/Login.jsx`
3. Changer les lignes :
   ```javascript
   const VALID_USERNAME = 'nouveau_login'
   const VALID_PASSWORD = 'nouveau_motdepasse'
   ```

### **Changer les durées des slides**
1. Contactez l'admin technique
2. Fichier à modifier : `src/components/ScreenTV.jsx`
3. Changer :
   ```javascript
   { duration: 20 }  // 20 secondes
   { duration: 15 }  // 15 secondes
   ```

### **Ajouter un nouveau slide**
Contact admin technique — c'est un peu plus complexe.

---

## 🐛 Dépannage

### **L'Écran TV est blanc**
- Vérifier la connexion internet
- Recharger la page (F5)
- Redémarrer la TV/l'appareil

### **Le Dashboard ne se charge pas**
- Vérifier les identifiants (macao / Le10Admin2026)
- Vérifier la connexion internet
- Vider le cache (Cmd+Shift+Delete sur Mac)

### **Les changements n'apparaissent pas sur la TV**
- Attendre 2-3 secondes (WebSocket sync)
- Recharger l'Écran TV (F5)
- Vérifier que le Dashboard affiche les données

### **L'Écran TV affiche les anciennes données**
- Cliquez **🔄 RAFRAÎCHIR** dans le Dashboard
- Les nouvelles données Notion se chargent
- L'Écran TV se met à jour automatiquement

---

## 📋 Checklist Quotidienne

**Avant d'ouvrir les locaux :**
- ✅ Dashboard accessible et connecté
- ✅ Écran TV affiche les bonnes offres
- ✅ Les offres expirées sont masquées
- ✅ Horloge visible sur la TV

**En fin de journée :**
- ✅ Masquer les offres du jour si deadline est passée
- ✅ Rafraîchir les données Notion
- ✅ Vérifier que tout est à jour

---

## 🚨 Urgence ?

Si un problème grave :

1. **Dashboard bloqué**
   - Cliquez 🚪 **Déconnexion** (bas à droite)
   - Reconnectez-vous

2. **Écran TV figé**
   - Recharger la page (F5)
   - Redémarrer l'appareil

3. **Données incohérentes**
   - Cliquez 🔄 **RAFRAÎCHIR**
   - Attendre 30 sec

4. **Besoin d'aide**
   - Contact: contact@agence-macao.com

---

## 📞 Support Technique

Pour les modifications avancées, contactez :
- **Email** : contact@agence-macao.com
- **Qui peut faire quoi**:
  - Changer identifiants : Admin technique
  - Ajouter/modifier offres Notion : Toute l'équipe
  - Modifier durées slides : Admin technique
  - Ajouter nouveaux slides : Admin technique

---

**Bon usage !** 🚀
