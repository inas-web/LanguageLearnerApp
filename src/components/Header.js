// Header.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const Header = ({ title, onBack, rightComponent }) => {
  return (
    <LinearGradient
      colors={['#4A6FA5', '#6B93D6']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 34,
  },
});

// LanguageCard.js
export const LanguageCard = ({ language, onPress, selected }) => {
  return (
    <TouchableOpacity
      style={[
        cardStyles.container,
        selected && cardStyles.containerSelected,
      ]}
      onPress={() => onPress(language)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          selected
            ? [language.color, '#4A6FA5']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 249, 250, 0.95)']
        }
        style={cardStyles.gradient}
      >
        <Text style={cardStyles.flag}>{language.flag}</Text>
        <Text
          style={[
            cardStyles.name,
            selected && cardStyles.nameSelected,
          ]}
        >
          {language.name}
        </Text>
        {selected && (
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  containerSelected: {
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  flag: {
    fontSize: 32,
    marginRight: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  nameSelected: {
    color: '#FFFFFF',
  },
});

// LessonCard.js
export const LessonCard = ({ lesson, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        lessonStyles.container,
        lesson.completed && lessonStyles.containerCompleted,
      ]}
      onPress={() => onPress(lesson)}
    >
      <View style={lessonStyles.iconContainer}>
        {lesson.completed ? (
          <Ionicons name="checkmark-circle" size={32} color="#34C759" />
        ) : (
          <Ionicons name="book" size={32} color="#4A90E2" />
        )}
      </View>
      <View style={lessonStyles.content}>
        <Text style={lessonStyles.title}>{lesson.title}</Text>
        {lesson.description && (
          <Text style={lessonStyles.description}>{lesson.description}</Text>
        )}
        <View style={lessonStyles.footer}>
          <Text style={lessonStyles.type}>
            {lesson.type === 'vocabulary' ? 'Vocabulaire' : 
             lesson.type === 'quiz' ? 'Test' : 'Leçon'}
          </Text>
          {lesson.completed && (
            <View style={lessonStyles.score}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={lessonStyles.scoreText}>
                {lesson.score}/{lesson.maxScore}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const lessonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  containerCompleted: {
    backgroundColor: '#F0FFF4',
    borderColor: '#C6F6D5',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});

// ProgressBar.js
export const ProgressBar = ({ progress, total, label }) => {
  const percentage = Math.round((progress / total) * 100);
  
  return (
    <View style={progressStyles.container}>
      {label && (
        <View style={progressStyles.header}>
          <Text style={progressStyles.label}>{label}</Text>
          <Text style={progressStyles.percentage}>{percentage}%</Text>
        </View>
      )}
      <View style={progressStyles.barContainer}>
        <View 
          style={[
            progressStyles.barFill, 
            { width: `${percentage}%` }
          ]} 
        />
      </View>
      {!label && (
        <Text style={progressStyles.stats}>
          {progress} / {total} complété
        </Text>
      )}
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  percentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  stats: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
});

// Button.js
export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon,
  disabled = false,
  loading = false
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return ['#4A90E2', '#357ABD'];
      case 'secondary':
        return ['#FF9500', '#FFB340'];
      case 'success':
        return ['#34C759', '#28A745'];
      case 'danger':
        return ['#FF3B30', '#DC3545'];
      default:
        return ['#4A90E2', '#357ABD'];
    }
  };

  return (
    <TouchableOpacity
      style={[
        buttonStyles.container,
        disabled && buttonStyles.containerDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getColors()}
        style={buttonStyles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            {icon && (
              <Ionicons 
                name={icon} 
                size={20} 
                color="#FFFFFF" 
                style={buttonStyles.icon}
              />
            )}
            <Text style={buttonStyles.text}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Export all components
export default {
  Header,
  LanguageCard,
  LessonCard,
  ProgressBar,
  Button,
};