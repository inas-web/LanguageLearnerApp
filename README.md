# 🌍 Polyglot Academy - Application d'apprentissage de langues type Duolingo

Application mobile complète pour apprendre des langues avec système de progression par chapitres, API de traduction, et tests automatisés.

## 🎯 Fonctionnalités principales

### ✅ Système d'apprentissage progressif
- **Chapitres structurés** : Progression chapitre par chapitre
- **Leçons de vocabulaire** : Apprentissage de mots avec flashcards
- **Tests de chapitre** : Validation des acquis pour débloquer le suivant
- **Traductions API** : Traductions en temps réel via MyMemory et LibreTranslate
- **Prononciation audio** : Text-to-Speech pour chaque mot
- **Génération automatique de quiz** : Questions générées dynamiquement

### 📊 Système de progression
- **XP et niveaux** : Gagnez des points d'expérience
- **Séries (streaks)** : Maintenez votre motivation jour après jour
- **Déblocage progressif** : Les chapitres se débloquent après réussite du test
- **Statistiques détaillées** : Suivi de votre progression

### 🔐 Authentification
- Inscription et connexion avec Firebase
- Mode invité pour tester l'app
- Sauvegarde automatique de la progression

## 🚀 Installation rapide

### Prérequis
```bash
node -v  # v14 ou supérieur
npm -v   # v6 ou supérieur
```

### Installation
```bash
# Cloner le projet
git clone [votre-repo]
cd LanguageLearnerApp

# Installer les dépendances
npm install

# Ou avec yarn
yarn install
```

### Dépendances principales
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "expo": "~49.0.0",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/stack": "^6.3.17",
    "expo-linear-gradient": "~12.3.0",
    "@expo/vector-icons": "^13.0.0",
    "firebase": "^10.1.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "react-native-screens": "~3.22.0",
    "react-native-safe-area-context": "4.6.3",
    "react-native-gesture-handler": "~2.12.0"
  }
}
```

## 🔧 Configuration

### 1. Configuration Firebase

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez **Authentication** → Email/Password
3. Créez une base **Firestore Database**
4. Copiez vos credentials dans `src/services/firebase.js` :

```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

### 2. Configuration des API de traduction

#### Option 1 : MyMemory (Recommandé - Gratuit)
✅ Pas de clé API nécessaire
✅ Limite : 5000 requêtes/jour

```javascript
// src/utils/constants.js
export const API_CONFIG = {
  MY_MEMORY: {
    endpoint: 'https://api.mymemory.translated.net/get',
    email: 'votre-email@example.com', // Pour augmenter les limites
  },
};
```

#### Option 2 : LibreTranslate (Gratuit)
✅ Open source
✅ Illimité

```javascript
export const API_CONFIG = {
  LIBRE_TRANSLATE: {
    endpoint: 'https://libretranslate.de/translate',
  },
};
```

#### Option 3 : Google Translate API (Payant)
```javascript
export const API_CONFIG = {
  GOOGLE_TRANSLATE: {
    endpoint: 'https://translation.googleapis.com/language/translate/v2',
    key: 'VOTRE_CLE_GOOGLE_API',
  },
};
```

### 3. Règles Firestore

Ajoutez ces règles dans Firebase Console → Firestore → Rules :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Sous-collection de progression
      match /progress/{languageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 🏃 Lancer l'application

```bash
# Démarrer le serveur de développement
npm start
# ou
expo start

# Pour Android
npm run android

# Pour iOS (Mac uniquement)
npm run ios

# Pour web
npm run web
```

## 📱 Structure de l'application

### Flux utilisateur principal

```
WelcomeScreen
    ↓
LanguageSelectionScreen (Sélection de la langue)
    ↓
AuthScreen (Choix connexion/inscription/invité)
    ↓
LoginScreen / SignupScreen
    ↓
HomeScreen (Tableau de bord)
    ↓
VocabularyScreen (Liste des chapitres)
    ↓
LessonDetailScreen (Apprentissage des mots)
    ↓
QuizScreen (Test du chapitre)
    ↓
QuizResultsScreen (Résultats)
    ↓
[Chapitre suivant débloqué]
```

### Architecture des données

#### Structure Firestore

```
users/
  {userId}/
    - name: string
    - email: string
    - totalXP: number
    - level: number
    - streak: number
    - lastActivityDate: string
    - createdAt: timestamp
    
    progress/
      {languageId}/
        - languageId: string
        - xp: number
        - level: number
        - completedLessons: array
        - completedChapters: array
        - unlockedChapters: array
        - currentChapter: number
        - streak: number
```

#### Curriculum (constants.js)

```javascript
{
  id: 1,
  title: 'Les bases 1',
  level: 1,
  locked: false,
  requiredChapter: null,
  lessons: [
    {
      id: 'en-1-1',
      title: 'Salutations',
      type: 'vocabulary',
      duration: 10,
      xp: 50,
      words: [...]
    },
    {
      id: 'en-1-test',
      title: 'Test du chapitre 1',
      type: 'chapter_test',
      passingScore: 70,
      xp: 100
    }
  ]
}
```

## 🎮 Guide d'utilisation

### 1. Première utilisation
```
1. Lancez l'app
2. Sélectionnez la langue à apprendre
3. Créez un compte ou continuez en invité
4. Explorez le curriculum
```

### 2. Apprentissage
```
1. Commencez par le chapitre 1
2. Complétez chaque leçon de vocabulaire
3. Révisez les mots avec les flashcards
4. Passez le test du chapitre (70% minimum requis)
5. Débloquez le chapitre suivant !
```

### 3. Système de points
```
- Leçon complétée : 50 XP
- Test réussi : 100 XP
- Score parfait (90%+) : 150 XP
- Bonus première tentative : 25 XP
- Bonus série quotidienne : 10 XP/jour
```

## 🔄 API utilisées

### 1. MyMemory Translation API
**Endpoint :** `https://api.mymemory.translated.net/get`
**Usage :** Traduction gratuite
**Limite :** 5000 req/jour (augmentée à 50000 avec email)

### 2. LibreTranslate API
**Endpoint :** `https://libretranslate.de/translate`
**Usage :** Traduction open source
**Limite :** Illimitée

### 3. Dictionary API
**Endpoint :** `https://api.dictionaryapi.dev/api/v2/entries`
**Usage :** Définitions et phonétiques
**Limite :** Gratuit, illimité

### 4. ResponsiveVoice (TTS)
**Endpoint :** `https://code.responsivevoice.org/getvoice.php`
**Usage :** Text-to-Speech
**Limite :** Gratuit avec limitations

## 🛠️ Personnalisation

### Ajouter une nouvelle langue

1. **Modifier constants.js :**
```javascript
export const LANGUAGES = [
  // ...existantes
  { id: 'ar', name: 'Arabe', flag: '🇸🇦', color: '#006C35', code: 'ar' },
];
```

2. **Ajouter le curriculum :**
```javascript
export const CURRICULUM = {
  // ...existants
  ar: [
    {
      id: 1,
      title: 'الأساسيات 1',
      lessons: [...]
    }
  ]
};
```

### Modifier les couleurs

```javascript
// src/utils/constants.js
export const COLORS = {
  PRIMARY: '#4A90E2',      // Couleur principale
  SECONDARY: '#FF6B6B',    // Couleur secondaire
  SUCCESS: '#34C759',      // Succès
  WARNING: '#FF9500',      // Avertissement
  // ...
};
```

### Ajuster les niveaux XP

```javascript
export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 500 },
  { level: 3, xp: 1200 },
  // Ajoutez vos propres seuils
];
```

## 🐛 Dépannage

### Problème : "NAVIGATE action not handled"
**Solution :** Vérifiez que tous les écrans sont déclarés dans `AppNavigator.js`

### Problème : Firebase "Permission denied"
**Solution :** Vérifiez les règles Firestore et que l'utilisateur est connecté

### Problème : API de traduction ne fonctionne pas
**Solution :**
1. Vérifiez votre connexion internet
2. Testez l'API avec Postman
3. Utilisez LibreTranslate en alternative

### Problème : "Expo module not found"
```bash
# Nettoyez et réinstallez
rm -rf node_modules package-lock.json
npm install
```

## 📈 Améliorations futures

### Phase 1 (Court terme)
- [ ] Mode hors-ligne avec AsyncStorage
- [ ] Notifications push pour rappels
- [ ] Partage de progression sur réseaux sociaux
- [ ] Classement global (leaderboard)

### Phase 2 (Moyen terme)
- [ ] Reconnaissance vocale pour prononciation
- [ ] Exercices d'écoute avec audio natif
- [ ] Chat avec IA pour conversation
- [ ] Cours vidéo intégrés

### Phase 3 (Long terme)
- [ ] Certificats de complétion
- [ ] Communauté d'apprenants
- [ ] Professeurs en ligne
- [ ] Réalité augmentée pour vocabulaire contextuel

## 📊 Tests et qualité

### Tests unitaires
```bash
npm test
```

### Linter
```bash
npm run lint
```

### Build de production
```bash
# Android
expo build:android

# iOS
expo build:ios
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 👥 Auteurs

- **Votre Nom** - *Développement initial*

## 🙏 Remerciements

- Duolingo pour l'inspiration
- Firebase pour l'infrastructure
- MyMemory pour l'API de traduction gratuite
- Expo pour le framework mobile

## 📧 Support

Pour toute question ou problème :
- 📧 Email : support@polyglotacademy.com
- 💬 Discord : [Lien Discord]
- 🐦 Twitter : [@PolyglotAcademy]

---

**Bon apprentissage ! 🎓🌍**

*Made with ❤️ using React Native & Expo*