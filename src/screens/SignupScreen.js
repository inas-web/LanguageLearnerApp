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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, googleProvider } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { getGoogleConfig } from '../services/googleConfig'; 
WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen({ navigation, route }) {
  const { selectedLanguage } = route.params || {};
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

const config = getGoogleConfig();
const [request, response, promptAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignup(response);
    } else if (response?.type === 'error') {
      Alert.alert('Erreur Google', 'Échec de l\'inscription avec Google');
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Erreur', 'Veuillez accepter les conditions d\'utilisation');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        selectedLanguage: selectedLanguage?.id || 'en',
        progress: {
          [selectedLanguage?.id || 'en']: {
            level: 1,
            xp: 0,
            lessonsCompleted: 0,
            lastActivity: new Date().toISOString(),
          }
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      Alert.alert('Succès', 'Compte créé avec succès!', [
        { text: 'OK', onPress: () => navigation.navigate('Home', { selectedLanguage }) }
      ]);

    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          Alert.alert('Erreur', 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.');
          break;
        case 'auth/invalid-email':
          Alert.alert('Erreur', 'Email invalide');
          break;
        case 'auth/weak-password':
          Alert.alert('Erreur', 'Le mot de passe est trop faible');
          break;
        case 'auth/operation-not-allowed':
          Alert.alert('Erreur', 'L\'opération n\'est pas autorisée');
          break;
        case 'auth/network-request-failed':
          Alert.alert('Erreur', 'Problème de connexion réseau');
          break;
        default:
          Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await promptAsync();
      
      if (result?.type !== 'success') {
        setIsGoogleLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('Erreur Google Auth:', error);
      Alert.alert('Erreur', 'Impossible de s\'inscrire avec Google');
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      if (response.authentication?.accessToken) {
        const credential = GoogleAuthProvider.credential(
          response.authentication.idToken,
          response.authentication.accessToken
        );
        
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;
        
        // Vérifier si l'utilisateur existe déjà
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Créer un nouveau profil
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || name,
            email: user.email,
            selectedLanguage: selectedLanguage?.id || 'en',
            progress: {
              [selectedLanguage?.id || 'en']: {
                level: 1,
                xp: 0,
                lessonsCompleted: 0,
                lastActivity: new Date().toISOString(),
              }
            },
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            provider: 'google',
          });
        }
        
        Alert.alert(
          'Inscription réussie',
          'Vous êtes maintenant inscrit avec Google!',
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
      let errorMessage = 'Échec de l\'inscription avec Google';
      
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Un compte existe déjà avec cet email';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Inscription annulée';
          break;
      }
      
      Alert.alert('Erreur Google', errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading || isGoogleLoading}
            >
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Inscription</Text>
          </View>

          <View style={styles.formContainer}>
            <TouchableOpacity 
              style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignup}
              disabled={!request || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#DB4437" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                  <Text style={styles.googleButtonText}>
                    S'inscrire avec Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou avec email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading && !isGoogleLoading}
              />
            </View>

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
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe (min. 6 caractères)"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading && !isGoogleLoading}
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

            <View style={styles.inputContainer}>
              <Icon name="lock-check-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading && !isGoogleLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                disabled={loading || isGoogleLoading}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => !loading && !isGoogleLoading && setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
              disabled={loading || isGoogleLoading}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Icon name="check" size={18} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                J'accepte les conditions d'utilisation et la politique de confidentialité
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signupButton, (!acceptedTerms || loading || isGoogleLoading) && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading || !acceptedTerms || isGoogleLoading}
            >
              <LinearGradient
                colors={['#4A6FA5', '#6B93D6']}
                style={styles.buttonGradient}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? 'Inscription...' : 'S\'inscrire'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login', { selectedLanguage })}
                disabled={loading || isGoogleLoading}
              >
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 40,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  formContainer: {
    flex: 1,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkboxChecked: {
    backgroundColor: '#4A6FA5',
    borderColor: '#4A6FA5',
  },
  termsText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
  },
  signupButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 5,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  loginLink: {
    color: '#4A6FA5',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});