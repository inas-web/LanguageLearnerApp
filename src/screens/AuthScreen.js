import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen({ navigation, route }) {
  const { selectedLanguage } = route.params || {};

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Polyglot Academy</Text>
        {selectedLanguage && (
          <View style={styles.languageBadge}>
            <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
            <Text style={styles.languageName}>{selectedLanguage.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Commencez votre voyage linguistique
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate('Login', { selectedLanguage })}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.buttonGradient}
          >
            <Text style={[styles.buttonText, styles.loginText]}>
              Se connecter
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={() => navigation.navigate('Signup', { selectedLanguage })}
        >
          <LinearGradient
            colors={['#4A6FA5', '#6B93D6']}
            style={styles.buttonGradient}
          >
            <Text style={[styles.buttonText, styles.signupText]}>
              Créer un compte
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => navigation.navigate('Home', { 
            selectedLanguage,
            isGuest: true 
          })}
        >
          <Text style={styles.guestText}>
            Continuer en tant qu'invité
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          En vous connectant, vous pourrez sauvegarder votre progression
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
    lineHeight: 32,
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loginText: {
    color: '#4A6FA5',
  },
  signupText: {
    color: '#FFFFFF',
  },
  guestButton: {
    marginTop: 20,
    paddingVertical: 15,
  },
  guestText: {
    color: '#E0E0E0',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#E0E0E0',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});