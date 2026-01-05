import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const QuizResultsScreen = ({ navigation, route }) => {
  const { 
    score, 
    totalScore, 
    percentage, 
    questions = [],
    selectedLanguage,
    chapterId,
    streak = 0
  } = route.params;

  const getPerformanceMessage = () => {
    if (percentage >= 90) return 'Excellent !';
    if (percentage >= 70) return 'Très bon travail !';
    if (percentage >= 50) return 'Bon effort !';
    return 'Continuez à pratiquer !';
  };

  const getPerformanceColor = () => {
    if (percentage >= 90) return '#10B981';
    if (percentage >= 70) return '#3B82F6';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getPerformanceIcon = () => {
    if (percentage >= 90) return 'trophy';
    if (percentage >= 70) return 'checkmark-circle';
    if (percentage >= 50) return 'star';
    return 'book';
  };

  const calculateXP = () => {
    return Math.floor(score * 10);
  };

  const xpEarned = calculateXP();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Résultats du quiz</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score principal */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCard}>
            <View style={[styles.iconCircle, { backgroundColor: getPerformanceColor() + '20' }]}>
              <Ionicons name={getPerformanceIcon()} size={48} color={getPerformanceColor()} />
            </View>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.scoreText}>{score} / {totalScore} points</Text>
            <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor() + '15' }]}>
              <Text style={[styles.performanceText, { color: getPerformanceColor() }]}>
                {getPerformanceMessage()}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{xpEarned}</Text>
              <Text style={styles.statLabel}>XP gagnés</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame-outline" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>Serie</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{Math.round(percentage)}%</Text>
              <Text style={styles.statLabel}>Précision</Text>
            </View>
          </View>
        </View>

        {/* Détail des questions */}
        {questions.length > 0 && (
          <View style={styles.questionsContainer}>
            <Text style={styles.sectionTitle}>Détail des questions</Text>
            
            {questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumberBadge}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                  </View>
                  <View style={styles.questionPointsBadge}>
                    <Text style={styles.pointsText}>{question.pointsEarned || 0} / {question.points || 0} pts</Text>
                  </View>
                  <View style={[
                    styles.statusIcon,
                    { backgroundColor: question.isCorrect ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Ionicons 
                      name={question.isCorrect ? 'checkmark' : 'close'} 
                      size={14} 
                      color={question.isCorrect ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                </View>
                <Text style={styles.questionText} numberOfLines={2}>
                  {question.question || 'Question'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.navigate('Quiz', {
              selectedLanguage,
              chapterId,
            })}
          >
            <Ionicons name="refresh" size={20} color="#3B82F6" />
            <Text style={styles.retryButtonText}>Réessayer le quiz</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => navigation.navigate('Learn', { selectedLanguage })}
          >
            <Text style={styles.continueButtonText}>Continuer les leçons</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scoreContainer: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  percentageText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -2,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  performanceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  performanceText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  questionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  questionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  questionNumberBadge: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  questionPointsBadge: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    gap: 8,
  },
  retryButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  continueButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  homeButton: {
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default QuizResultsScreen;