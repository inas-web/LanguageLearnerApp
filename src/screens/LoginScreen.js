import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithCredential 
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { getGoogleConfig } from '../services/googleConfig';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

// Configurer WebBrowser pour Google Auth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation, route }) {
  const { selectedLanguage } = route.params || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Configurer Google Auth
 const config = getGoogleConfig();
const [request, response, promptAsync] = Google.useAuthRequest(config);

// AJOUTER ce log pour déboguer
useEffect(() => {
  console.log('Google Config:', config);
  console.log('Platform:', Platform.OS);
}, []);

  useEffect(() => {
    // Charger les informations enregistrées
    loadSavedCredentials();
  }, []);

  useEffect(() => {
    // Gérer la réponse Google
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      Alert.alert('Erreur Google', 'Échec de la connexion avec Google');
      setIsGoogleLoading(false);
    }
  }, [response]);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('remembered_email');
      const savedPassword = await AsyncStorage.getItem('remembered_password');
      const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
      if (savedEmail && savedPassword && savedRememberMe === 'true') {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Erreur de chargement des identifiants:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('remembered_email', email);
        await AsyncStorage.setItem('remembered_password', password);
        await AsyncStorage.setItem('remember_me', 'true');
      } else {
        await AsyncStorage.removeItem('remembered_email');
        await AsyncStorage.removeItem('remembered_password');
        await AsyncStorage.setItem('remember_me', 'false');
      }
    } catch (error) {
      console.error('Erreur de sauvegarde des identifiants:', error);
    }
  };

  const clearCredentials = async () => {
    try {
      await AsyncStorage.removeItem('remembered_email');
      await AsyncStorage.removeItem('remembered_password');
      await AsyncStorage.setItem('remember_me', 'false');
    } catch (error) {
      console.error('Erreur de suppression des identifiants:', error);
    }
  };

  const handleLogin = async () => {
    // Validation des champs
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Sauvegarder les identifiants si "Se souvenir de moi" est coché
      if (rememberMe) {
        await saveCredentials();
      } else {
        await clearCredentials();
      }
      
      // Succès
      Alert.alert(
        'Connexion réussie',
        'Vous êtes maintenant connecté!',
        [
          {
            text: 'Continuer',
            onPress: () => navigation.navigate('Home', { selectedLanguage })
          }
        ]
      );
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Traduction des erreurs Firebase
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'L\'adresse email n\'est pas valide';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte utilisateur a été désactivé';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cette adresse email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Le mot de passe est incorrect';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Identifiants incorrects';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives échouées. Veuillez réessayer plus tard';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'La connexion par email/mot de passe n\'est pas activée';
          break;
        default:
          errorMessage = error.message || 'Erreur de connexion';
      }
      
      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Information', 'Veuillez d\'abord entrer votre adresse email');
      return;
    }

    Alert.alert(
      'Réinitialisation du mot de passe',
      `Voulez-vous recevoir un email de réinitialisation à l'adresse ${email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          style: 'default',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email);
              Alert.alert(
                'Email envoyé',
                'Un email de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.'
              );
            } catch (error) {
              console.error('Erreur d\'envoi d\'email:', error);
              
              let errorMessage = 'Impossible d\'envoyer l\'email de réinitialisation';
              switch (error.code) {
                case 'auth/user-not-found':
                  errorMessage = 'Aucun compte trouvé avec cette adresse email';
                  break;
                case 'auth/invalid-email':
                  errorMessage = 'Adresse email invalide';
                  break;
                case 'auth/too-many-requests':
                  errorMessage = 'Trop de demandes. Veuillez réessayer plus tard';
                  break;
                case 'auth/network-request-failed':
                  errorMessage = 'Erreur de connexion réseau';
                  break;
              }
              
              Alert.alert('Erreur', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Lancer la connexion Google
      const result = await promptAsync();
      
      if (result?.type !== 'success') {
        setIsGoogleLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('Erreur Google Auth:', error);
      Alert.alert('Erreur', 'Impossible de se connecter avec Google');
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      if (response.authentication?.accessToken) {
        // Créer les credentials Google
        const credential = GoogleAuthProvider.credential(
          response.authentication.idToken,
          response.authentication.accessToken
        );
        
        // Se connecter avec Firebase
        await signInWithCredential(auth, credential);
        
        // Navigation vers Home
        Alert.alert(
          'Connexion réussie',
          'Vous êtes maintenant connecté avec Google!',
          [
            {
              text: 'Continuer',
              onPress: () => navigation.navigate('Home', { selectedLanguage })
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur de connexion Google:', error);
      
      let errorMessage = 'Échec de la connexion avec Google';
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Un compte existe déjà avec cet email';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Connexion annulée';
          break;
      }
      
      Alert.alert('Erreur Google', errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' }}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.85)', 'rgba(118, 75, 162, 0.9)']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={loading || isGoogleLoading}
              >
                <Icon name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Connexion</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>Bienvenue de retour !</Text>
              <Text style={styles.subtitleText}>
                Connectez-vous pour continuer votre apprentissage
              </Text>

              <View style={styles.inputContainer}>
                <Icon name="email-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading && !isGoogleLoading}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading && !isGoogleLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading || isGoogleLoading}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <View style={styles.rememberContainer}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    disabled={loading || isGoogleLoading}
                    trackColor={{ false: '#767577', true: '#4A6FA5' }}
                    thumbColor={rememberMe ? '#FFFFFF' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                  />
                  <Text style={styles.rememberText}>Se souvenir de moi</Text>
                </View>

                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  disabled={loading || isGoogleLoading}
                >
                  <Text style={styles.forgotPasswordText}>
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, (loading || isGoogleLoading) && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading || isGoogleLoading}
              >
                <LinearGradient
                  colors={['#4A6FA5', '#6B93D6']}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      Se connecter
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Ou continuer avec</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
                onPress={handleGoogleLogin}
                disabled={!request || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#DB4437" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text style={styles.googleButtonText}>
                      Se connecter avec Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Pas encore de compte ? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Signup', { selectedLanguage })}
                  disabled={loading || isGoogleLoading}
                >
                  <Text style={styles.signupLink}>S'inscrire</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.guestContainer}>
                <Text style={styles.guestText}>Vous souhaitez juste explorer ? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Home', { 
                    selectedLanguage,
                    isGuest: true 
                  })}
                  disabled={loading || isGoogleLoading}
                >
                  <Text style={styles.guestLink}>Continuer en tant qu'invité</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitleText: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    color: '#E0E0E0',
    fontSize: 14,
    marginLeft: 10,
  },
  forgotPasswordText: {
    color: '#E0E0E0',
    fontSize: 14,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#E0E0E0',
    marginHorizontal: 15,
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 15,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  signupText: {
    color: '#E0E0E0',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  signupLink: {
    color: '#4A6FA5',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  guestContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  guestText: {
    color: '#E0E0E0',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  guestLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});