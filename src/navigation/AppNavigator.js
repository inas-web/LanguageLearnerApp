import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importer tous les écrans
import WelcomeScreen from '../screens/WelcomeScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import VocabularyScreen from '../screens/VocabularyScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResultsScreen from '../screens/QuizResultsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TranslationScreen from '../screens/TranslationScreen';
import ChapterLessonsScreen from '../screens/ChapterLessonsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      {/* Écrans d'accueil et authentification */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      
      {/* Écrans principaux */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
      <Stack.Screen name="Translation" component={TranslationScreen} />

      {/* ChapterLessons*/}
      <Stack.Screen 
        name="ChapterLessons" 
        component={ChapterLessonsScreen}
        options={{ headerShown: false }}
      />

      {/* Alias pour Learn qui pointe vers Vocabulary */}
      <Stack.Screen 
        name="Learn" 
        component={VocabularyScreen}
        options={{ title: 'Apprendre' }}
      />
    </Stack.Navigator>
  );
}