import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Audio from 'expo-audio';
import { auth } from '../services/firebase';
import { completLesson } from '../services/database'; 
import { playPronunciation, simulateAudioPlayback } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function LessonDetailScreen({ navigation, route }) {
  const { selectedLanguage, chapter, lesson } = route.params;
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translations, setTranslations] = useState([]);
  const [loadingTranslations, setLoadingTranslations] = useState(true);
  const [score, setScore] = useState(0);
  const [answeredWords, setAnsweredWords] = useState(new Set());
  const [earnedXP, setEarnedXP] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  
  const soundRef = useRef(null);

  useEffect(() => {
    loadTranslations();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (translations.length > 0 && currentWordIndex < translations.length) {
      playCurrentWordAudio();
    }
  }, [currentWordIndex, translations]);

  const loadTranslations = async () => {
    try {
      setLoadingTranslations(true);
      
      if (lesson.words && lesson.words.length > 0) {
        setTranslations(lesson.words);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      Alert.alert('Erreur', 'Impossible de charger les mots');
    } finally {
      setLoadingTranslations(false);
    }
  };

  const playCurrentWordAudio = async () => {
    const currentWord = translations[currentWordIndex];
    if (!currentWord) return;

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      setIsPlaying(true);
      setAudioError(false);
      
      try {
        const result = await playPronunciation(
          currentWord.word,
          selectedLanguage.code || selectedLanguage.id
        );
        
        if (!result.success) {
          throw new Error('TTS failed');
        }
        
      } catch (ttsError) {
        console.log('TTS failed, trying simulation:', ttsError);
        
        await simulateAudioPlayback(
          currentWord.word,
          selectedLanguage.code || selectedLanguage.id
        );
        
        Alert.alert(
          'Prononciation',
          `Mot: ${currentWord.word}\nPrononciation: ${currentWord.phonetic || 'Non disponible'}`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioError(true);
      
      Alert.alert(
        'Prononciation',
        `Mot: ${currentWord.word}\nPrononciation: ${currentWord.phonetic || 'Non disponible'}`
      );
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlayPronunciation = async () => {
    await playCurrentWordAudio();
  };

  const handleWordReveal = () => {
    if (!showTranslation) {
      setShowTranslation(true);
      setScore(prev => prev + 5);
    }
  };

  const handleWordKnown = () => {
    const currentWord = translations[currentWordIndex];
    if (currentWord && !answeredWords.has(currentWordIndex)) {
      setAnsweredWords(new Set([...answeredWords, currentWordIndex]));
      setScore(prev => prev + 10);
      setEarnedXP(prev => prev + 10);
    }
    goToNextWord();
  };

  const handleWordUnknown = () => {
    const currentWord = translations[currentWordIndex];
    if (currentWord && !answeredWords.has(currentWordIndex)) {
      setAnsweredWords(new Set([...answeredWords, currentWordIndex]));
      setScore(prev => prev + 3);
      setEarnedXP(prev => prev + 5);
    }
    goToNextWord();
  };

  const goToNextWord = () => {
    if (currentWordIndex < translations.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setShowTranslation(false);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    try {
      const maxPossibleScore = translations.length * 10;
      const percentage = Math.round((score / maxPossibleScore) * 100);
      
      let totalXP = earnedXP;
      
      if (percentage >= 90) {
        totalXP += 30;
      } else if (percentage >= 70) {
        totalXP += 20;
      } else if (percentage >= 50) {
        totalXP += 10;
      }
      
      totalXP += lesson.xp || 0;

      if (auth.currentUser) {
        const result = await completLesson(
          auth.currentUser.uid,
          selectedLanguage.id || 'en',
          lesson.id,
          percentage,
          totalXP
        );
        
        if (!result.success) {
          console.error('Failed to save lesson:', result.error);
          Alert.alert(
            'Attention',
            'Votre progression a été enregistrée localement, mais il y a eu un problème avec la synchronisation.'
          );
        }
      }

      Alert.alert(
        'Leçon terminée ! 🎉',
        `Score: ${percentage}%\nXP gagnés: ${totalXP}\nMots révisés: ${translations.length}`,
        [
          {
            text: 'Retour',
            onPress: () => {
              navigation.navigate('Vocabulary', { selectedLanguage });
            },
          },
          {
            text: 'Leçon suivante',
            onPress: () => {
              const lessonIndex = chapter.lessons.findIndex(l => l.id === lesson.id);
              if (lessonIndex < chapter.lessons.length - 1) {
                const nextLesson = chapter.lessons[lessonIndex + 1];
                navigation.replace('LessonDetail', {
                  selectedLanguage,
                  chapter,
                  lesson: nextLesson,
                });
              } else {
                navigation.navigate('Vocabulary', { selectedLanguage });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error completing lesson:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder votre progression. Votre score est: ' + score
      );
    }
  };

  if (loadingTranslations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Chargement de la leçon...</Text>
      </View>
    );
  }

  const currentWord = translations[currentWordIndex];

  if (!currentWord) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Aucun mot disponible</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header minimaliste */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.progressText}>
              {currentWordIndex + 1} / {translations.length}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        {/* Barre de progression fine */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentWordIndex + 1) / translations.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte du mot épurée */}
        <View style={styles.wordCard}>
          <View style={styles.wordHeader}>
            <View style={styles.languageBadge}>
              <Text style={styles.languageText}>{selectedLanguage.flag}</Text>
            </View>
          </View>

          <Text style={styles.wordText}>{currentWord.word}</Text>

          {currentWord.phonetic && (
            <Text style={styles.phoneticText}>[{currentWord.phonetic}]</Text>
          )}

          {/* Bouton d'écoute minimaliste */}
          <TouchableOpacity 
            style={[styles.audioButton, isPlaying && styles.audioButtonActive]} 
            onPress={handlePlayPronunciation}
            disabled={isPlaying}
          >
            <View style={styles.audioIconContainer}>
              {isPlaying ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="volume-high-outline" size={28} color="#3B82F6" />
              )}
            </View>
            <Text style={styles.audioButtonText}>
              {isPlaying ? 'Lecture en cours' : 'Écouter la prononciation'}
            </Text>
          </TouchableOpacity>

          {/* Zone de traduction */}
          {showTranslation ? (
            <View style={styles.translationBox}>
              <View style={styles.translationHeader}>
                <Ionicons name="language-outline" size={16} color="#6B7280" />
                <Text style={styles.translationLabel}>Traduction</Text>
              </View>
              <Text style={styles.translationText}>{currentWord.translation}</Text>
              
              {audioError && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#F59E0B" />
                  <Text style={styles.warningText}>Audio indisponible</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.revealButton} onPress={handleWordReveal}>
              <Ionicons name="eye-outline" size={18} color="#6B7280" />
              <Text style={styles.revealText}>Afficher la traduction</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Boutons d'action redessinés */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsSectionTitle}>Connaissez-vous ce mot ?</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.actionCardSuccess]} 
              onPress={handleWordKnown}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>Je connais</Text>
              <Text style={styles.actionSubtitle}>+10 XP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardWarning]}
              onPress={handleWordUnknown}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="book-outline" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>À réviser</Text>
              <Text style={styles.actionSubtitle}>+5 XP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicateur de progression */}
        <View style={styles.progressIndicator}>
          <Text style={styles.progressIndicatorTitle}>Progression du vocabulaire</Text>
          <View style={styles.dotsContainer}>
            {translations.map((word, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setCurrentWordIndex(index);
                  setShowTranslation(false);
                }}
                style={styles.dotWrapper}
              >
                <View
                  style={[
                    styles.dot,
                    index === currentWordIndex && styles.dotActive,
                    answeredWords.has(index) && styles.dotCompleted,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#E5E7EB' }]} />
              <Text style={styles.statLabel}>À faire</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statLabel}>En cours</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statLabel}>Terminé</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 0,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  scoreText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 13,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  languageBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageText: {
    fontSize: 22,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  phoneticText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  audioButtonActive: {
    opacity: 0.6,
  },
  audioIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  translationBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  translationLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  revealText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  actionCardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF08A',
  },
  actionIconBox: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressIndicator: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressIndicatorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dotWrapper: {
    padding: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});