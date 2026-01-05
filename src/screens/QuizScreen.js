import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { auth } from '../services/firebase';
import { completeChapterTest } from '../services/database';
import { generateQuizQuestions, validateAnswer, getWordAudioUrl, checkPronunciation } from '../services/api';

const { width } = Dimensions.get('window');

export default function QuizScreen({ navigation, route }) {
  const { selectedLanguage, chapter, lesson } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState(null);

  useEffect(() => {
    generateQuiz();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (loading || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, quizCompleted]);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      
      const allWords = [];
      chapter.lessons.forEach(l => {
        if (l.type === 'vocabulary' && l.words) {
          allWords.push(...l.words);
        }
      });

      if (allWords.length === 0) {
        Alert.alert('Erreur', 'Aucun mot disponible pour le quiz');
        navigation.goBack();
        return;
      }

      const tempLesson = {
        words: allWords.slice(0, 15),
      };

      const result = await generateQuizQuestions(tempLesson, selectedLanguage.code || selectedLanguage.id);

      if (result.success) {
        // Ajouter une question de prononciation
        const pronunciationQuestion = {
          id: 'pronunciation_1',
          type: 'pronunciation',
          question: 'Prononcez le mot suivant',
          word: allWords[Math.floor(Math.random() * allWords.length)].word,
          points: 25,
          audioLang: selectedLanguage.code || selectedLanguage.id,
        };

        setQuestions([...result.questions, pronunciationQuestion]);
        setTotalPoints(result.totalPoints + pronunciationQuestion.points);
      } else {
        throw new Error('Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      Alert.alert('Erreur', 'Impossible de générer le quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePlayListening = async (audioText, audioLang) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      setIsPlaying(true);
      
      const audioUrl = getWordAudioUrl(audioText, audioLang);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing listening question:', error);
      setIsPlaying(false);
      Alert.alert('Audio', `Mot: ${audioText}`);
    }
  };

  const handlePronunciationPractice = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.type !== 'pronunciation') return;

    try {
      setIsRecording(true);
      setPronunciationScore(null);

      // Simulation d'enregistrement et vérification
      setTimeout(async () => {
        setIsRecording(false);
        
        const result = await checkPronunciation(currentQuestion.word, 'recorded_audio_simulation');
        
        if (result.success) {
          setPronunciationScore(result.score);
          
          // Points pour la prononciation
          const pointsEarned = Math.floor((result.score / 100) * currentQuestion.points);
          
          setScore(prev => prev + pointsEarned);
          setAnswers([
            ...answers,
            {
              questionId: currentQuestion.id,
              type: 'pronunciation',
              word: currentQuestion.word,
              score: result.score,
              pointsEarned,
              feedback: result.feedback,
            },
          ]);
          
          Alert.alert(
            '🎤 Prononciation',
            `Score: ${result.score}%\n${result.feedback}\n\n+${pointsEarned} points`,
            [{ text: 'Continuer', onPress: goToNextQuestion }]
          );
        }
      }, 3000);

    } catch (error) {
      console.error('Pronunciation practice error:', error);
      setIsRecording(false);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la prononciation');
    }
  };

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.type === 'pronunciation') {
      Alert.alert('Info', 'Veuillez utiliser le bouton "Pratiquer la prononciation"');
      return;
    }

    let isCorrect = false;
    let pointsEarned = 0;

    if (currentQuestion.type === 'multiple_choice') {
      isCorrect = selectedOption === currentQuestion.correctAnswer;
      pointsEarned = isCorrect ? currentQuestion.points : 0;
    } else if (currentQuestion.type === 'translate' || currentQuestion.type === 'listening') {
      const validation = validateAnswer(userAnswer, currentQuestion.correctAnswer, currentQuestion.type);
      isCorrect = validation.correct;
      pointsEarned = isCorrect ? Math.floor((validation.score / 100) * currentQuestion.points) : 0;
    }

    setScore(prev => prev + pointsEarned);
    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        userAnswer: currentQuestion.type === 'multiple_choice' ? selectedOption : userAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        pointsEarned,
      },
    ]);

    if (isCorrect) {
      Alert.alert('✅ Correct !', `+${pointsEarned} points`, [{ text: 'Continuer', onPress: goToNextQuestion }]);
    } else {
      Alert.alert(
        '❌ Incorrect',
        `La bonne réponse était: "${currentQuestion.correctAnswer}"`,
        [{ text: 'Continuer', onPress: goToNextQuestion }]
      );
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption(null);
      setIsPlaying(false);
      setPronunciationScore(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= (lesson.passingScore || 70);

    if (passed && auth.currentUser) {
      try {
        const result = await completeChapterTest(
          auth.currentUser.uid,
          selectedLanguage.id,
          chapter.id,
          score,
          totalPoints
        );

        Alert.alert(
          '🎉 Test réussi !',
          `Score: ${percentage}%\n${
            result.nextChapterUnlocked
              ? `\n🔓 Nouveau chapitre débloqué !\n+${result.xpEarned} XP`
              : ''
          }`,
          [
            {
              text: 'Voir les résultats',
              onPress: () => {
                navigation.replace('QuizResults', {
                  score,
                  totalScore: totalPoints,
                  percentage,
                  questions: answers,
                  selectedLanguage,
                  chapterId: chapter.id,
                  passed: true,
                });
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error saving quiz results:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder vos résultats');
      }
    } else {
      Alert.alert(
        '📚 Continuez à pratiquer',
        `Score: ${percentage}%\n\nVous devez obtenir au moins ${lesson.passingScore || 70}% pour réussir`,
        [
          {
            text: 'Réessayer',
            onPress: () => {
              setCurrentQuestionIndex(0);
              setScore(0);
              setAnswers([]);
              setUserAnswer('');
              setSelectedOption(null);
              setQuizCompleted(false);
              setTimeLeft(600);
              setIsPlaying(false);
              setPronunciationScore(null);
            },
          },
          {
            text: 'Retour',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Génération du quiz...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Aucune question disponible</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Test - Chapitre {chapter.id}</Text>
            <Text style={styles.headerSubtitle}>{chapter.title}</Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statChip}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.statText}>{score} pts</Text>
        </View>
        <View style={styles.statChip}>
          <Ionicons name="trophy-outline" size={16} color="#3B82F6" />
          <Text style={styles.statText}>
            {Math.round((score / totalPoints) * 100) || 0}%
          </Text>
        </View>
        {currentQuestion.type === 'pronunciation' && pronunciationScore !== null && (
          <View style={styles.statChip}>
            <Ionicons name="mic-outline" size={16} color="#9C27B0" />
            <Text style={styles.statText}>{pronunciationScore}%</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {currentQuestion.type === 'translate'
                  ? 'Traduction'
                  : currentQuestion.type === 'multiple_choice'
                  ? 'QCM'
                  : currentQuestion.type === 'listening'
                  ? 'Écoute'
                  : 'Prononciation'}
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{currentQuestion.points} pts</Text>
            </View>
          </View>

          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {/* Affichage du mot pour la prononciation */}
          {currentQuestion.type === 'pronunciation' && (
            <View style={styles.pronunciationWordContainer}>
              <Text style={styles.pronunciationWord}>{currentQuestion.word}</Text>
              <TouchableOpacity 
                style={styles.listenButton}
                onPress={() => handlePlayListening(currentQuestion.word, currentQuestion.audioLang)}
                disabled={isPlaying}
              >
                {isPlaying ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Ionicons name="volume-high-outline" size={24} color="#3B82F6" />
                )}
                <Text style={styles.listenButtonText}>
                  {isPlaying ? 'Écoute en cours...' : 'Écouter le mot'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bouton d'écoute pour les questions listening */}
          {currentQuestion.type === 'listening' && (
            <TouchableOpacity 
              style={[styles.listenButton, isPlaying && styles.listenButtonActive]} 
              onPress={() => handlePlayListening(currentQuestion.audioText, currentQuestion.audioLang)}
              disabled={isPlaying}
            >
              {isPlaying ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="volume-high-outline" size={24} color="#3B82F6" />
              )}
              <Text style={styles.listenButtonText}>
                {isPlaying ? 'Écoute en cours...' : 'Écouter le mot'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Bouton d'écoute pour les questions avec audioText */}
          {currentQuestion.audioText && currentQuestion.type !== 'listening' && currentQuestion.type !== 'pronunciation' && (
            <TouchableOpacity 
              style={styles.smallListenButton}
              onPress={() => handlePlayListening(currentQuestion.audioText, currentQuestion.audioLang)}
            >
              <Ionicons name="volume-medium-outline" size={18} color="#3B82F6" />
              <Text style={styles.smallListenText}>Écouter</Text>
            </TouchableOpacity>
          )}

          {/* Interface de prononciation */}
          {currentQuestion.type === 'pronunciation' && (
            <View style={styles.pronunciationContainer}>
              <TouchableOpacity
                style={[
                  styles.pronunciationButton,
                  isRecording && styles.pronunciationButtonActive
                ]}
                onPress={handlePronunciationPractice}
                disabled={isRecording || pronunciationScore !== null}
              >
                {isRecording ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <Ionicons name="mic" size={40} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              <Text style={styles.pronunciationInstruction}>
                {isRecording 
                  ? 'Parlez maintenant...' 
                  : pronunciationScore !== null
                    ? `Score: ${pronunciationScore}%`
                    : 'Appuyez pour enregistrer votre prononciation'
                }
              </Text>

              {pronunciationScore !== null && (
                <View style={styles.pronunciationFeedback}>
                  <Text style={styles.feedbackText}>
                    {pronunciationScore >= 85 ? '🎉 Excellente prononciation!' :
                     pronunciationScore >= 70 ? '👍 Bon travail!' :
                     '💪 Continuez à pratiquer!'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Réponses selon le type de question */}
          {currentQuestion.type === 'multiple_choice' ? (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOption === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedOption(option)}
                >
                  <View style={[
                    styles.optionRadio,
                    selectedOption === option && styles.optionRadioSelected
                  ]}>
                    {selectedOption === option && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : currentQuestion.type !== 'pronunciation' ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Votre réponse..."
                placeholderTextColor="#9CA3AF"
                value={userAnswer}
                onChangeText={setUserAnswer}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          {/* Bouton soumettre (pas pour la prononciation) */}
          {currentQuestion.type !== 'pronunciation' && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                (currentQuestion.type === 'multiple_choice' ? !selectedOption : !userAnswer.trim()) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitAnswer}
              disabled={
                currentQuestion.type === 'multiple_choice' ? !selectedOption : !userAnswer.trim()
              }
            >
              <Text style={styles.submitButtonText}>Valider</Text>
            </TouchableOpacity>
          )}

          {/* Bouton suivant pour la prononciation après enregistrement */}
          {currentQuestion.type === 'pronunciation' && pronunciationScore !== null && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={goToNextQuestion}
            >
              <Text style={styles.nextButtonText}>Question suivante</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Conseil */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.tipText}>
            {currentQuestion.type === 'pronunciation' 
              ? 'Parlez clairement et à vitesse modérée pour de meilleurs résultats'
              : 'Écoutez bien les mots pour les questions d\'écoute'}
          </Text>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  timerText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  pronunciationWordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pronunciationWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
    textAlign: 'center',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  listenButtonActive: {
    opacity: 0.6,
  },
  listenButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  smallListenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  smallListenText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
  },
  pronunciationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pronunciationButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 5,
  },
  pronunciationButtonActive: {
    backgroundColor: '#E91E63',
  },
  pronunciationInstruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  pronunciationFeedback: {
    backgroundColor: '#F3E5F5',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  feedbackText: {
    fontSize: 15,
    color: '#6B1B9A',
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: '#3B82F6',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
});
