import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

// Utiliser les mêmes couleurs que VocabularyScreen
const COLORS = {
  primary: '#4A6FA5',
  secondary: '#6D8BC8',
  accent: '#4ECDC4',
  success: '#77DD77',
  warning: '#FFD166',
  danger: '#FF6B6B',
  dark: '#2D3748',
  light: '#F7FAFC',
  white: '#FFFFFF',
  gray: '#CBD5E0',
};

export default function ChapterLessonsScreen({ navigation, route }) {
  const { selectedLanguage, chapter } = route.params;
  const [loading] = useState(false);

  const handleLessonPress = (lesson) => {
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

  const renderLessonIcon = (lesson) => {
    if (lesson.completed) {
      return (
        <LinearGradient
          colors={['#77DD77', '#4ECDC4']}
          style={styles.lessonIcon}
        >
          <Ionicons name="checkmark" size={22} color={COLORS.white} />
        </LinearGradient>
      );
    }

    switch (lesson.type) {
      case 'vocabulary':
        return (
          <LinearGradient
            colors={['#4A6FA5', '#6D8BC8']}
            style={styles.lessonIcon}
          >
            <Ionicons name="book-outline" size={22} color={COLORS.white} />
          </LinearGradient>
        );
      case 'chapter_test':
        return (
          <LinearGradient
            colors={['#FFD166', '#FFB347']}
            style={styles.lessonIcon}
          >
            <Ionicons name="trophy-outline" size={22} color={COLORS.white} />
          </LinearGradient>
        );
      default:
        return (
          <View style={[styles.lessonIcon, { backgroundColor: COLORS.gray }]}>
            <Ionicons name="play-outline" size={22} color={COLORS.dark} />
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
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
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerText} numberOfLines={1}>
              {chapter.title}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
        
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Liste des leçons */}
        <View style={styles.lessonsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leçons du chapitre</Text>
            <Text style={styles.sectionSubtitle}>
              {chapter.lessons.filter(l => l.completed).length} terminées sur {chapter.lessons.length}
            </Text>
          </View>

          <View style={styles.lessonsList}>
            {chapter.lessons.map((lesson, index) => {
              const isTest = lesson.type === 'chapter_test';
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    lesson.completed && styles.lessonCardCompleted,
                    isTest && styles.lessonCardTest,
                  ]}
                  onPress={() => handleLessonPress(lesson)}
                  activeOpacity={0.7}
                >
                  <View style={styles.lessonContent}>
                    {renderLessonIcon(lesson)}
                    
                    <View style={styles.lessonInfo}>
                      <View style={styles.lessonHeader}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        {isTest && (
                          <View style={styles.testBadge}>
                            <Text style={styles.testBadgeText}>TEST</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.lessonMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                          <Text style={styles.metaText}>{lesson.duration} min</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="star" size={14} color="#FFD166" />
                          <Text style={styles.metaText}>{lesson.xp} XP</Text>
                        </View>
                      </View>
                    </View>
                    
                    {lesson.completed ? (
                      <View style={styles.completedIndicator}>
                        {lesson.score > 0 && (
                          <Text style={styles.scoreText}>{lesson.score}%</Text>
                        )}
                        <Ionicons name="checkmark-circle" size={24} color="#77DD77" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bouton pour commencer la première leçon */}
        {chapter.lessons.length > 0 && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              const firstIncomplete = chapter.lessons.find(l => !l.completed && l.type !== 'chapter_test');
              if (firstIncomplete) {
                handleLessonPress(firstIncomplete);
              } else {
                handleLessonPress(chapter.lessons[0]);
              }
            }}
          >

          </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  chapterBanner: {
    margin: 20,
    marginTop: 25,
    borderRadius: 20,
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterIconText: {
    fontSize: 32,
    fontWeight: '600',
  },
  bannerTextContainer: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  chapterDescription: {
    fontSize: 15,
    color: COLORS.dark,
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: 12,
  },
  bannerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  bannerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerStatText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  lessonsContainer: {
    marginHorizontal: 20,
     marginTop: 20,
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
  lessonsList: {
    gap: 12,
    marginBottom: 30,
  },
  lessonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lessonCardCompleted: {
    backgroundColor: '#F0F9F0',
    borderColor: '#C6F6D5',
  },
  lessonCardTest: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD166',
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    marginRight: 10,
  },
  testBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD166',
  },
  testBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF8C00',
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#77DD77',
  },
  testInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  testInfoText: {
    fontSize: 13,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  startButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});