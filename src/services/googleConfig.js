// services/googleConfig.js
import { Platform } from 'react-native';

export const getGoogleConfig = () => {
  const webClientId = '337106122658-r9bh4evd7aacd8kuvotb35rvdhk2i28q.apps.googleusercontent.com';
  
  // Pour le développement avec Expo Go, utilisez le webClientId aussi pour Android
  if (__DEV__ && Platform.OS === 'android') {
    // Pour Expo Go sur Android, nous devons utiliser le webClientId comme androidClientId
    return {
      webClientId,
      androidClientId: webClientId,
      expoClientId: webClientId,
    };
  }
  
  // Configuration de base
  return {
    webClientId,
    expoClientId: webClientId,
  };
};