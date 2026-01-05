import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebase';
import { getCurriculumWithProgress, getUserStats } from '../services/database';

const { width } = Dimensions.get('window');

// Palette de couleurs harmonieuses et modernes
const COLORS = {
  primary: '#4A6FA5', // Bleu principal doux
  secondary: '#6D8BC8', // Bleu secondaire
  accent: '#4ECDC4', // Turquoise
  success: '#77DD77', // Vert doux
  warning: '#FFD166', // Jaune doré
  danger: '#FF6B6B', // Rouge corail
  dark: '#2D3748', // Gris foncé
  light: '#F7FAFC', // Gris très clair
  white: '#FFFFFF',
  gray: '#CBD5E0',
  gradient1: ['#4A6FA5', '#6D8BC8'],
  gradient2: ['#77DD77', '#4ECDC4'],
  gradient3: ['#FFD166', '#FFB347'],
  gradient4: ['#A78BFA', '#C084FC'],
};

// Gradients doux pour les chapitres
const CHAPTER_GRADIENTS = [
  ['#667EEA', '#4A6FA5'], // Bleu
  ['#5ebc9eff', '#4ECDC4'], // Turquoise
  ['#FFD166', '#FFB347'], // Orange doré
  ['#A78BFA', '#8B5CF6'], // Violet
  ['#FF9A9E', '#FF6B6B'], // Rose corail
  ['#93C5FD', '#60A5FA'], // Bleu clair
  ['#86D6A1', '#77DD77'], // Vert
  ['#d6bd69ff', '#FBBF24'], // Jaune
];

export default function VocabularyScreen({ navigation, route }) {
  const { selectedLanguage = { id: 'en', name: 'Anglais', flag: '🇬🇧' } } = route.params || {};
  const [curriculum, setCurriculum] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCurriculumAndProgress();
  }, [selectedLanguage]);

  const loadCurriculumAndProgress = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour accéder aux leçons');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      const curriculumResult = await getCurriculumWithProgress(
        auth.currentUser.uid,
        selectedLanguage.id
      );

      if (curriculumResult.success) {
        setCurriculum(curriculumResult.curriculum);
      }

      const statsResult = await getUserStats(
        auth.currentUser.uid,
        selectedLanguage.id
      );

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading curriculum:', error);
      Alert.alert('Erreur', 'Impossible de charger les leçons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleChapterPress = (chapter) => {
    if (chapter.locked) {
      Alert.alert(
        'Chapitre verrouillé 🔒',
        `Terminez le chapitre ${chapter.requiredChapter} pour débloquer celui-ci`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Naviguer vers la page des leçons du chapitre
    navigation.navigate('ChapterLessons', {
      selectedLanguage,
      chapter,
      chapterId: chapter.id,
    });
  };

  const handleLessonPress = (chapter, lesson) => {
    if (chapter.locked) {
      Alert.alert(
        'Chapitre verrouillé 🔒',
        `Terminez le chapitre ${chapter.requiredChapter} pour débloquer celui-ci`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (lesson.type === 'vocabulary') {
      navigation.navigate('LessonDetail', {
        selectedLanguage,
        chapter,
        lesson,
      });
    } else if (lesson.type === 'chapter_test') {
      const regularLessons = chapter.lessons.filter(l => l.type !== 'chapter_test');
      const allLessonsCompleted = regularLessons.every(l => l.completed);

      if (!allLessonsCompleted) {
        Alert.alert(
          'Test non disponible',
          'Vous devez terminer toutes les leçons du chapitre avant de passer le test',
          [{ text: 'OK' }]
        );
        return;
      }

      navigation.navigate('Quiz', {
        selectedLanguage,
        chapter,
        lesson,
      });
    }
  };

  const getChapterGradient = (index) => {
    return CHAPTER_GRADIENTS[index % CHAPTER_GRADIENTS.length];
  };

  const renderChapterCard = (chapter, index) => {
    const chapterGradient = getChapterGradient(index);
    
    // Calculer le pourcentage de progression
    const completedLessons = chapter.lessons.filter(l => l.completed).length;
    const progress = chapter.lessons.length > 0 
      ? (completedLessons / chapter.lessons.length) * 100 
      : 0;
    
    return (
      <TouchableOpacity
        key={chapter.id}
        style={styles.chapterCardWrapper}
        onPress={() => handleChapterPress(chapter)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={chapterGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.chapterCard,
            chapter.locked && styles.chapterCardLocked,
          ]}
        >
          {/* Overlay pour les chapitres verrouillés */}
          {chapter.locked && (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={32} color={COLORS.white} />
            </View>
          )}
          
          <View style={styles.chapterCardContent}>
            {/* En-tête du chapitre */}
            <View style={styles.chapterHeader}>
              <View style={styles.chapterIconContainer}>
                <LinearGradient
                  colors={[COLORS.white, 'rgba(255,255,255,0.8)']}
                  style={styles.chapterIconBackground}
                >
                  <Text style={styles.chapterIcon}>{chapter.icon}</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.chapterInfo}>
                <View style={styles.chapterTitleRow}>
                  <Text style={styles.chapterTitle} numberOfLines={1}>
                    {chapter.title}
                  </Text>
                  <View style={styles.chapterStatus}>
                    {chapter.completed && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      </View>
                    )}
                  </View>
                </View>
                
                <Text style={styles.chapterDescription} numberOfLines={2}>
                  {chapter.description}
                </Text>
              </View>
            </View>
            
            {/* Statistiques du chapitre */}
            <View style={styles.chapterStats}>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statText}>{chapter.lessons.length} leçons</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="bar-chart-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statText}>Niveau {chapter.level}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statText}>
                  {Math.floor(chapter.lessons.reduce((sum, l) => sum + (l.duration || 0), 0))} min
                </Text>
              </View>
            </View>
            
            {/* Barre de progression */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  Progression: {completedLessons}/{chapter.lessons.length}
                </Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
              </View>
              
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#FFFFFF', 'rgba(255,255,255,0.7)']}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des leçons...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header comme ProfileScreen */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Chapitres</Text>
          </View>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              setRefreshing(true);
              loadCurriculumAndProgress();
            }}
          >
            <Ionicons name="refresh" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={null}
      >

        {/* Liste des chapitres */}
        <View style={styles.chaptersSection}>
          <View style={styles.chaptersGrid}>
            {curriculum.map((chapter, index) => renderChapterCard(chapter, index))}
          </View>
        </View>

        {/* Message pour tous les chapitres terminés */}
        {curriculum.length > 0 && curriculum.every(c => c.completed) && (
          <LinearGradient
            colors={[COLORS.success, '#63C7A9']}
            style={styles.congratsContainer}
          >
            <View style={styles.congratsContent}>
              <View style={styles.congratsIconContainer}>
                <Ionicons name="trophy" size={48} color={COLORS.white} />
              </View>
              <Text style={styles.congratsTitle}>🎉 Félicitations !</Text>
              <Text style={styles.congratsText}>
                Vous avez terminé tous les chapitres disponibles en {selectedLanguage.name}
              </Text>
            </View>
          </LinearGradient>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  // Header style comme ProfileScreen
  header: {
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSubtitleContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  welcomeBanner: {
    margin: 20,
    marginTop: 25,
    borderRadius: 20,
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.dark,
    opacity: 0.8,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 111, 165, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  statCardNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  chaptersSection: {
    marginHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  chaptersGrid: {
    gap: 12,
     marginTop: 20,
  },
  chapterCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  chapterCard: {
    padding: 20,
  },
  chapterCardLocked: {
    opacity: 0.7,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  chapterCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chapterIconContainer: {
    marginRight: 15,
  },
  chapterIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterIcon: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
    marginRight: 10,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  chapterDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  chapterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  congratsContainer: {
    margin: 20,
    marginTop: 25,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  congratsContent: {
    padding: 25,
    alignItems: 'center',
  },
  congratsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  backButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
});