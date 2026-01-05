import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// Données de démonstration étendues
const DEMO_CHAPTERS = [
  {
    id: 'greetings',
    title: 'Les salutations',
    icon: '👋',
    description: 'Apprenez à saluer et à vous présenter',
    level: 1,
    color: '#FF6B6B',
    category: 'basics',
    lessons: [
      {
        id: 'greetings_1',
        title: 'Salutations de base',
        type: 'vocabulary',
        duration: 15,
        xp: 50,
        words: [
          { word: 'Bonjour', translation: 'Hello' },
          { word: 'Au revoir', translation: 'Goodbye' },
          { word: 'Merci', translation: 'Thank you' },
        ]
      }
    ]
  },
  {
    id: 'numbers',
    title: 'Les nombres',
    icon: '🔢',
    description: 'Apprenez les nombres de 1 à 100',
    level: 1,
    color: '#4ECDC4',
    category: 'basics',
    lessons: [
      {
        id: 'numbers_1',
        title: 'Nombres 1-20',
        type: 'vocabulary',
        duration: 25,
        xp: 60,
        words: [
          { word: 'Un', translation: 'One' },
          { word: 'Deux', translation: 'Two' },
          { word: 'Trois', translation: 'Three' },
        ]
      }
    ]
  },
  {
    id: 'food',
    title: 'La nourriture',
    icon: '🍕',
    description: 'Vocabulaire alimentaire essentiel',
    level: 2,
    color: '#FFD166',
    category: 'daily_life',
    lessons: [
      {
        id: 'food_1',
        title: 'Au restaurant',
        type: 'vocabulary',
        duration: 20,
        xp: 70,
        words: [
          { word: 'Menu', translation: 'Menu' },
          { word: 'Commander', translation: 'To order' },
          { word: 'Addition', translation: 'Bill' },
        ]
      }
    ]
  },
  {
    id: 'travel',
    title: 'Voyages',
    icon: '✈️',
    description: 'Phrases utiles pour voyager',
    level: 2,
    color: '#118AB2',
    category: 'travel',
    lessons: [
      {
        id: 'travel_1',
        title: 'À l\'aéroport',
        type: 'vocabulary',
        duration: 30,
        xp: 80,
        words: [
          { word: 'Billet', translation: 'Ticket' },
          { word: 'Passport', translation: 'Passport' },
          { word: 'Enregistrement', translation: 'Check-in' },
        ]
      }
    ]
  }
];


export default function HomeScreen({ navigation, route }) {
  const { selectedLanguage, isGuest } = route.params || {};
  const [userProgress, setUserProgress] = useState(null);
  const [userName, setUserName] = useState('');
  const [userStreak, setUserStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [dailyLesson, setDailyLesson] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recommendedChapters, setRecommendedChapters] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    lessonsCompleted: 0,
    wordsLearned: 0,
    currentStreak: 0,
    totalTime: 0
  });

  useEffect(() => {
    fetchUserData();
    loadDynamicContent();
  }, [selectedLanguage]);

  const fetchUserData = async () => {
    if (auth.currentUser && !isGuest) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name);
          setUserStreak(userData.streak || 0);
          setTotalXP(userData.totalXP || 0);
          setUserProgress(userData.progress?.[selectedLanguage?.id || 'en']);
          
          // Calculer les statistiques
          const progress = userData.progress?.[selectedLanguage?.id || 'en'] || {};
          const completedLessons = progress.completedLessons || {};
          const lessonsCount = Object.keys(completedLessons).length;
          
          // Calculer les mots appris
          let wordsCount = 0;
          DEMO_CHAPTERS.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
              const lessonKey = `${chapter.id}_${lesson.id}`;
              if (completedLessons[lessonKey]) {
                wordsCount += lesson.words?.length || 0;
              }
            });
          });

          setStats({
            lessonsCompleted: lessonsCount,
            wordsLearned: wordsCount,
            currentStreak: userData.streak || 0,
            totalTime: lessonsCount * 15 // Estimation
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    } else {
      // Données pour invités
      setStats({
        lessonsCompleted: 3,
        wordsLearned: 15,
        currentStreak: 2,
        totalTime: 45
      });
    }
  };

  const loadDynamicContent = async () => {
    try {
      setLoading(true);
      
      // 1. Déterminer la leçon du jour
      await loadDailyLesson();
      
      // 2. Charger les dernières révisions
      await loadRecentReviews();
      
      // 3. Charger les chapitres recommandés
      await loadRecommendedChapters();
      
      // 4. Charger les succès
      await loadAchievements();
      
      // 5. Charger le classement (simulé)
      await loadLeaderboard();
      
    } catch (error) {
      console.error('Error loading dynamic content:', error);
      loadFallbackContent();
    } finally {
      setLoading(false);
    }
  };

  const loadDailyLesson = async () => {
    // Même logique que précédemment...
    try {
      let dailyLessonData = null;
      
      if (auth.currentUser && !isGuest) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const progress = userData.progress?.[selectedLanguage?.id || 'en'] || {};
          
          for (const chapter of DEMO_CHAPTERS) {
            for (const lesson of chapter.lessons) {
              const lessonKey = `${chapter.id}_${lesson.id}`;
              if (!progress.completedLessons || !progress.completedLessons[lessonKey]) {
                dailyLessonData = {
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                  description: `Apprenez ${lesson.words?.length || 0} nouveaux mots`,
                  duration: lesson.duration,
                  wordCount: lesson.words?.length || 0,
                  color: chapter.color,
                  chapter: chapter,
                  lesson: lesson
                };
                break;
              }
            }
            if (dailyLessonData) break;
          }
        }
      }
      
      if (!dailyLessonData && DEMO_CHAPTERS.length > 0) {
        const firstChapter = DEMO_CHAPTERS[0];
        if (firstChapter.lessons.length > 0) {
          const firstLesson = firstChapter.lessons[0];
          dailyLessonData = {
            chapterId: firstChapter.id,
            chapterTitle: firstChapter.title,
            lessonId: firstLesson.id,
            lessonTitle: firstLesson.title,
            description: `Apprenez ${firstLesson.words?.length || 0} nouveaux mots`,
            duration: firstLesson.duration,
            wordCount: firstLesson.words?.length || 0,
            color: firstChapter.color,
            chapter: firstChapter,
            lesson: firstLesson
          };
        }
      }
      
      setDailyLesson(dailyLessonData);
      
    } catch (error) {
      console.error('Error loading daily lesson:', error);
      loadFallbackDailyLesson();
    }
  };

  const loadRecentReviews = async () => {
    try {
      let recentReviewsData = [];
      
      if (auth.currentUser && !isGuest) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const progress = userData.progress?.[selectedLanguage?.id || 'en'] || {};
          const completedLessons = progress.completedLessons || {};
          
          const lessons = Object.keys(completedLessons)
            .map(key => {
              const [chapterId, lessonId] = key.split('_');
              const chapter = DEMO_CHAPTERS.find(c => c.id === chapterId);
              const lesson = chapter?.lessons.find(l => l.id === lessonId);
              if (chapter && lesson) {
                return {
                  id: key,
                  title: lesson.title,
                  chapterTitle: chapter.title,
                  completedDate: completedLessons[key].date || new Date().toISOString(),
                  score: completedLessons[key].score || 0,
                  xpEarned: completedLessons[key].xp || 0,
                  color: chapter.color
                };
              }
              return null;
            })
            .filter(item => item !== null)
            .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))
            .slice(0, 4);
          
          recentReviewsData = lessons;
        }
      }
      
      if (recentReviewsData.length === 0) {
        recentReviewsData = [
          {
            id: '1',
            title: 'Salutations de base',
            chapterTitle: 'Les salutations',
            completedDate: new Date(Date.now() - 86400000).toISOString(),
            score: 85,
            xpEarned: 50,
            color: '#FF6B6B'
          },
          {
            id: '2',
            title: 'Nombres 1-20',
            chapterTitle: 'Les nombres',
            completedDate: new Date(Date.now() - 172800000).toISOString(),
            score: 92,
            xpEarned: 60,
            color: '#4ECDC4'
          }
        ];
      }
      
      setRecentReviews(recentReviewsData);
      
    } catch (error) {
      console.error('Error loading recent reviews:', error);
      loadFallbackRecentReviews();
    }
  };

  const loadRecommendedChapters = async () => {
    try {
      let recommended = [];
      const userLevel = userProgress?.level || 1;
      
      // Filtrer les chapitres par niveau
      recommended = DEMO_CHAPTERS
        .filter(chapter => chapter.level <= userLevel + 1)
        .slice(0, 3);
      
      // Si l'utilisateur n'a pas de progression, recommander les bases
      if (recommended.length === 0) {
        recommended = DEMO_CHAPTERS.slice(0, 3);
      }
      
      setRecommendedChapters(recommended);
      
    } catch (error) {
      console.error('Error loading recommended chapters:', error);
      setRecommendedChapters(DEMO_CHAPTERS.slice(0, 3));
    }
  };

  const loadAchievements = async () => {
    try {
      const achievementsData = [
        {
          id: 'first_lesson',
          name: 'Première leçon',
          description: 'Compléter votre première leçon',
          icon: 'trophy',
          color: '#FFD166',
          unlocked: stats.lessonsCompleted > 0,
          progress: stats.lessonsCompleted > 0 ? 100 : 0
        },
        {
          id: 'streak_3',
          name: 'Série de 3 jours',
          description: 'Apprendre 3 jours consécutifs',
          icon: 'fire',
          color: '#FF6B6B',
          unlocked: userStreak >= 3,
          progress: Math.min((userStreak / 3) * 100, 100)
        },
        {
          id: 'vocab_50',
          name: '50 mots appris',
          description: 'Maîtriser 50 mots de vocabulaire',
          icon: 'book',
          color: '#118AB2',
          unlocked: stats.wordsLearned >= 50,
          progress: Math.min((stats.wordsLearned / 50) * 100, 100)
        },
        {
          id: 'xp_500',
          name: '500 XP',
          description: 'Atteindre 500 points d\'expérience',
          icon: 'star',
          color: '#06D6A0',
          unlocked: totalXP >= 500,
          progress: Math.min((totalXP / 500) * 100, 100)
        }
      ];
      
      setAchievements(achievementsData);
      
    } catch (error) {
      console.error('Error loading achievements:', error);
      setAchievements([]);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Données simulées pour le classement
      const leaderboardData = [
        { id: '1', name: 'Marie', xp: 1250, avatar: '👑', rank: 1 },
        { id: '2', name: 'Pierre', xp: 980, avatar: '🚀', rank: 2 },
        { id: '3', name: 'Sophie', xp: 760, avatar: '⭐', rank: 3 },
        { id: '4', name: userName || 'Vous', xp: totalXP || 450, avatar: '😊', rank: 4 }
      ].sort((a, b) => b.xp - a.xp)
       .map((item, index) => ({ ...item, rank: index + 1 }));
      
      setLeaderboard(leaderboardData.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const loadFallbackContent = () => {
    loadFallbackDailyLesson();
    loadFallbackRecentReviews();
    setRecommendedChapters(DEMO_CHAPTERS.slice(0, 3));
    loadAchievements();
    loadLeaderboard();
  };

  const loadFallbackDailyLesson = () => {
    if (DEMO_CHAPTERS.length > 0 && DEMO_CHAPTERS[0].lessons.length > 0) {
      const chapter = DEMO_CHAPTERS[0];
      const lesson = chapter.lessons[0];
      setDailyLesson({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        description: `Apprenez à saluer en ${selectedLanguage?.name || 'Anglais'}`,
        duration: lesson.duration,
        wordCount: lesson.words?.length || 0,
        color: chapter.color,
        chapter: chapter,
        lesson: lesson
      });
    }
  };

  const loadFallbackRecentReviews = () => {
    setRecentReviews([
      {
        id: '1',
        title: 'Les salutations',
        chapterTitle: 'Salutations de base',
        score: 85
      }
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('Vocabulary', { 
      selectedLanguage,
      category: category.id
    });
  };

  return (
    <View style={styles.container}>
      {/* Header compact */}
      <LinearGradient
        colors={['#4A6FA5', '#976ce5ff']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile', { 
              selectedLanguage,
              isGuest 
            })}
          >
            <View style={styles.profileAvatar}>
              <Icon name="account" size={24} color="#4A6FA5" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>
              {userName || (isGuest ? 'Invité' : 'Apprenant')}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.translateButton}
            onPress={() => navigation.navigate('Translation')}
          >
            <Icon name="translate" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          
          {selectedLanguage && (
            <View style={styles.languageBadge}>
              <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
              <Text style={styles.languageName}>{selectedLanguage.name}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadDynamicContent}
            colors={['#4A6FA5']}
            tintColor="#4A6FA5"
          />
        }
      >

        {/* BOUTON "COMMENCER" */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Vocabulary', { selectedLanguage })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7751e8ff', '#b7a6ebff']}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.startButtonContent}>
                <Icon name="play-circle" size={40} color="#FFFFFF" />
                <View style={styles.startButtonTextContainer}>
                  <Text style={styles.startButtonTitle}>Commencer à apprendre</Text>
                  <Text style={styles.startButtonSubtitle}>
                    Accéder à toutes les leçons et exercices
                  </Text>
                </View>
                <Icon name="chevron-right" size={30} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* LEÇON DU JOUR */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leçon du jour</Text>
            {dailyLesson && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadDynamicContent}
              >
                <Icon name="refresh" size={20} color="#6484b4ff" />
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#4A6FA5" />
              <Text style={styles.loadingText}>Chargement de la leçon...</Text>
            </View>
          ) : dailyLesson ? (
            <TouchableOpacity 
              style={styles.dailyLessonCard}
              onPress={() => {
                if (dailyLesson.chapter && dailyLesson.lesson) {
                  navigation.navigate('LessonDetail', {
                    selectedLanguage,
                    chapter: dailyLesson.chapter,
                    lesson: dailyLesson.lesson,
                  });
                } else {
                  navigation.navigate('Vocabulary', { selectedLanguage });
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[dailyLesson.color || '#FF6B6B', `${dailyLesson.color || '#FF6B6B'}CC`]}
                style={styles.lessonCardContent}
              >
                <View style={styles.lessonHeader}>
                  <View>
                    <Text style={styles.lessonChapter}>{dailyLesson.chapterTitle}</Text>
                    <Text style={styles.lessonTitle}>{dailyLesson.lessonTitle}</Text>
                    <Text style={styles.lessonDescription}>
                      {dailyLesson.description}
                    </Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <View style={styles.dailyBadge}>
                      <Icon name="calendar-today" size={14} color="#FFFFFF" />
                      <Text style={styles.dailyBadgeText}>Du jour</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.lessonStats}>
                  <View style={styles.lessonStat}>
                    <Icon name="clock-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.lessonStatText}>{dailyLesson.duration} min</Text>
                  </View>
                  <View style={styles.lessonStat}>
                    <Icon name="book-open-variant" size={16} color="#FFFFFF" />
                    <Text style={styles.lessonStatText}>{dailyLesson.wordCount} mots</Text>
                  </View>
                  <View style={styles.lessonStat}>
                    <Icon name="star" size={16} color="#FFFFFF" />
                    <Text style={styles.lessonStatText}>
                      {dailyLesson.lesson?.xp || 50} XP
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.noLessonCard}>
              <Icon name="book-off" size={40} color="#CCCCCC" />
              <Text style={styles.noLessonText}>
                Aucune leçon disponible pour aujourd'hui
              </Text>
            </View>
          )}
        </View>

        {/* CHAPITRES RECOMMANDÉS */}
        {recommendedChapters.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('Vocabulary', { selectedLanguage })}
              >
                <Text style={styles.seeAllText}>Tout voir</Text>
                <Icon name="chevron-right" size={20} color="#4A6FA5" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.recommendedScroll}
            >
              {recommendedChapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={styles.recommendedCard}
                  onPress={() => {
                    if (chapter.lessons.length > 0) {
                      navigation.navigate('LessonDetail', {
                        selectedLanguage,
                        chapter,
                        lesson: chapter.lessons[0],
                      });
                    } else {
                      navigation.navigate('Vocabulary', { 
                        selectedLanguage,
                        chapterId: chapter.id 
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.recommendedIcon, { backgroundColor: chapter.color }]}>
                    <Text style={styles.recommendedIconText}>{chapter.icon}</Text>
                  </View>
                  <Text style={styles.recommendedTitle}>{chapter.title}</Text>
                  <Text style={styles.recommendedDescription} numberOfLines={2}>
                    {chapter.description}
                  </Text>
                  <View style={styles.recommendedMeta}>
                    <View style={styles.recommendedMetaItem}>
                      <Icon name="book-open" size={12} color="#666666" />
                      <Text style={styles.recommendedMetaText}>
                        {chapter.lessons.length} leçons
                      </Text>
                    </View>
                    <View style={styles.recommendedMetaItem}>
                      <Icon name="chart-bar" size={12} color="#666666" />
                      <Text style={styles.recommendedMetaText}>
                        Niveau {chapter.level}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}


        {/* DERNIÈRES RÉVISIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières révisions</Text>
            {recentReviews.length > 0 && (
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('Vocabulary', { 
                  selectedLanguage,
                  showReviews: true 
                })}
              >
                <Text style={styles.seeAllText}>Historique</Text>
                <Icon name="chevron-right" size={20} color="#4A6FA5" />
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingList}>
              {[1, 2].map((item) => (
                <View key={item} style={styles.reviewItemSkeleton}>
                  <View style={styles.skeletonIcon} />
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonSubtitle} />
                  </View>
                </View>
              ))}
            </View>
          ) : recentReviews.length > 0 ? (
            <View style={styles.reviewList}>
              {recentReviews.map((review, index) => (
                <TouchableOpacity 
                  key={review.id || index} 
                  style={styles.reviewItem}
                  onPress={() => {
                    const chapter = DEMO_CHAPTERS.find(c => 
                      c.lessons.some(l => l.title === review.title || l.id === review.id)
                    );
                    
                    if (chapter) {
                      const lesson = chapter.lessons.find(l => 
                        l.title === review.title || l.id === review.id
                      );
                      
                      if (lesson) {
                        navigation.navigate('LessonDetail', {
                          selectedLanguage,
                          chapter,
                          lesson,
                          isReview: true
                        });
                      }
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reviewIcon, { backgroundColor: `${review.color}20` }]}>
                    <Icon name="refresh" size={20} color={review.color} />
                  </View>
                  <View style={styles.reviewContent}>
                    <Text style={styles.reviewTitle}>{review.title}</Text>
                    <Text style={styles.reviewSubtitle}>{review.chapterTitle}</Text>
                    <View style={styles.reviewMeta}>
                      <View style={styles.reviewMetaItem}>
                        <Icon name="calendar" size={12} color="#666666" />
                        <Text style={styles.reviewMetaText}>
                          {formatDate(review.completedDate)}
                        </Text>
                      </View>
                      {review.score > 0 && (
                        <View style={styles.reviewMetaItem}>
                          <Icon name="chart-line" size={12} color="#666666" />
                          <Text style={styles.reviewMetaText}>{review.score}%</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noReviewsCard}>
              <Icon name="history" size={40} color="#CCCCCC" />
              <Text style={styles.noReviewsText}>
                Vous n'avez pas encore révisé de leçons
              </Text>
            </View>
          )}
        </View>
        
        {/* Espace en bas */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileButton: {
    padding: 5,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  translateButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  languageFlag: {
    fontSize: 14,
    marginRight: 5,
  },
  languageName: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  refreshButton: {
    padding: 5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 13,
    color: '#4A6FA5',
    marginRight: 2,
  },
  // Statistiques
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  // Bouton Commencer
  startButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  startButtonGradient: {
    padding: 18,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  startButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  startButtonSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  // Catégories
  categoriesScroll: {
    marginHorizontal: -15,
    paddingLeft: 15,
  },
  categoryCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  // Leçon du jour
  dailyLessonCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
  },
  lessonCardContent: {
    padding: 18,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  lessonChapter: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  dailyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lessonStats: {
    flexDirection: 'row',
    gap: 15,
  },
  lessonStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lessonStatText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  // États vides
  noLessonCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 12,
    elevation: 1,
  },
  noLessonText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
  },
  // Chapitres recommandés
  recommendedScroll: {
    marginHorizontal: -15,
    paddingLeft: 15,
  },
  recommendedCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
  },
  recommendedIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recommendedIconText: {
    fontSize: 24,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  recommendedDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 16,
  },
  recommendedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recommendedMetaText: {
    fontSize: 10,
    color: '#666666',
  },
  // Succès
  achievementsContainer: {
    gap: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 6,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666666',
    minWidth: 30,
  },
  // Classement
  leaderboardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  currentUserItem: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  leaderboardRank: {
    width: 40,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  rankFirst: {
    color: '#FFD700',
  },
  rankSecond: {
    color: '#C0C0C0',
  },
  rankThird: {
    color: '#CD7F32',
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
  },
  leaderboardInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  currentUserName: {
    color: '#4A6FA5',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#666666',
  },
  // Dernières révisions
  reviewList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewContent: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  reviewSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewMetaText: {
    fontSize: 10,
    color: '#666666',
  },
  // États vides
  noReviewsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 12,
    elevation: 1,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
  },
  // Chargement
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 12,
    elevation: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666666',
  },
  loadingList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  reviewItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});