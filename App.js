import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, View, Text, StyleSheet, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/services/auth';
import * as Audio from 'expo-audio';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulation du chargement des ressources
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    
    // Configurer l'audio
    setupAudio();
  }, []);

const setupAudio = async () => {
  try {
    await Audio.requestPermissionsAsync();
  } catch (error) {
    console.warn('Audio permissions warning:', error);
  }
};
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#4A6FA5"
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  splashSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});