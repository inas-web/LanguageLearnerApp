import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  signOut, 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  updateProfile 
} from 'firebase/auth';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation, route }) {
  const { selectedLanguage, isGuest } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMode, setEditMode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserData = async () => {
    if (auth.currentUser && !isGuest) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData(prev => ({
            ...prev,
            name: data.name || '',
            email: data.email || auth.currentUser.email || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Erreur', 'Impossible de charger les données du profil');
      }
    }
    setLoading(false);
  };

  const handleEditOption = (mode) => {
    setEditMode(mode);
    setFormErrors({});
    
    switch (mode) {
      case 'name':
        setFormData(prev => ({
          ...prev,
          name: userData?.name || '',
          email: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        break;
      case 'email':
        setFormData(prev => ({
          ...prev,
          name: '',
          email: userData?.email || auth.currentUser?.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        break;
      case 'password':
        setFormData(prev => ({
          ...prev,
          name: '',
          email: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        break;
    }
    
    setEditModalVisible(true);
  };

  const validateForm = () => {
    const errors = {};
    
    switch (editMode) {
      case 'name':
        if (!formData.name.trim()) {
          errors.name = 'Le nom est requis';
        }
        break;
        
      case 'email':
        if (!formData.email.trim()) {
          errors.email = 'L\'email est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Email invalide';
        }
        if (!formData.currentPassword) {
          errors.currentPassword = 'Le mot de passe actuel est requis';
        }
        break;
        
      case 'password':
        if (!formData.currentPassword) {
          errors.currentPassword = 'Le mot de passe actuel est requis';
        }
        if (!formData.newPassword) {
          errors.newPassword = 'Le nouveau mot de passe est requis';
        } else if (formData.newPassword.length < 6) {
          errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
        }
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Veuillez confirmer le mot de passe';
        } else if (formData.newPassword !== formData.confirmPassword) {
          errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!auth.currentUser || isGuest) {
      Alert.alert('Erreur', 'Connectez-vous pour modifier votre profil');
      return;
    }
    
    setIsSaving(true);
    
    try {
      switch (editMode) {
        case 'name':
          await updateUserName();
          break;
        case 'email':
          await updateUserEmail();
          break;
        case 'password':
          await updateUserPassword();
          break;
      }
      
      Alert.alert('Succès', `Votre ${editMode === 'name' ? 'nom' : editMode === 'email' ? 'email' : 'mot de passe'} a été mis à jour avec succès!`);
      setEditModalVisible(false);
      await fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Une erreur est survenue';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Veuillez vous reconnecter pour effectuer cette action';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe est trop faible';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const updateUserName = async () => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: formData.name.trim(),
      });
      
      await updateProfile(auth.currentUser, {
        displayName: formData.name.trim(),
      });
      
      setUserData(prev => ({ ...prev, name: formData.name.trim() }));
    } catch (error) {
      throw error;
    }
  };

  const updateUserEmail = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        formData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updateEmail(auth.currentUser, formData.email.trim());
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        email: formData.email.trim(),
      });
      
      setUserData(prev => ({ ...prev, email: formData.email.trim() }));
    } catch (error) {
      throw error;
    }
  };

  const updateUserPassword = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        formData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, formData.newPassword);
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Welcome');
            } catch (error) {
              console.error('Erreur de déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const renderEditModal = () => {
    const getModalConfig = () => {
      switch (editMode) {
        case 'name':
          return {
            title: 'Modifier votre nom',
            fields: [
              {
                key: 'name',
                label: 'Nom complet',
                placeholder: 'Votre nom',
                value: formData.name,
                secureTextEntry: false,
                autoCapitalize: 'words',
              },
            ],
          };
        case 'email':
          return {
            title: 'Changer votre email',
            fields: [
              {
                key: 'email',
                label: 'Nouvel email',
                placeholder: 'nouveau@email.com',
                value: formData.email,
                secureTextEntry: false,
                autoCapitalize: 'none',
                keyboardType: 'email-address',
              },
              {
                key: 'currentPassword',
                label: 'Mot de passe actuel',
                placeholder: 'Entrez votre mot de passe actuel',
                value: formData.currentPassword,
                secureTextEntry: true,
                autoCapitalize: 'none',
              },
            ],
          };
        case 'password':
          return {
            title: 'Changer votre mot de passe',
            fields: [
              {
                key: 'currentPassword',
                label: 'Mot de passe actuel',
                placeholder: 'Entrez votre mot de passe actuel',
                value: formData.currentPassword,
                secureTextEntry: true,
                autoCapitalize: 'none',
              },
              {
                key: 'newPassword',
                label: 'Nouveau mot de passe',
                placeholder: 'Minimum 6 caractères',
                value: formData.newPassword,
                secureTextEntry: true,
                autoCapitalize: 'none',
              },
              {
                key: 'confirmPassword',
                label: 'Confirmer le mot de passe',
                placeholder: 'Confirmez le nouveau mot de passe',
                value: formData.confirmPassword,
                secureTextEntry: true,
                autoCapitalize: 'none',
              },
            ],
          };
        default:
          return { title: '', fields: [] };
      }
    };

    const { title, fields } = getModalConfig();

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => !isSaving && setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity 
                onPress={() => !isSaving && setEditModalVisible(false)}
                disabled={isSaving}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {fields.map((field) => (
                <View key={field.key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.formInput,
                        formErrors[field.key] && styles.formInputError,
                      ]}
                      placeholder={field.placeholder}
                      placeholderTextColor="#9CA3AF"
                      value={formData[field.key]}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, [field.key]: text }));
                        if (formErrors[field.key]) {
                          setFormErrors(prev => ({ ...prev, [field.key]: '' }));
                        }
                      }}
                      secureTextEntry={field.secureTextEntry}
                      autoCapitalize={field.autoCapitalize}
                      keyboardType={field.keyboardType}
                      editable={!isSaving}
                    />
                  </View>
                  {formErrors[field.key] && (
                    <Text style={styles.formError}>{formErrors[field.key]}</Text>
                  )}
                </View>
              ))}
              
              {editMode === 'email' && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                  <Text style={styles.infoText}>
                    Pour changer votre email, vous devez confirmer votre mot de passe actuel
                  </Text>
                </View>
              )}
              
              {editMode === 'password' && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                  <Text style={styles.infoText}>
                    Votre nouveau mot de passe doit contenir au moins 6 caractères
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, isSaving && styles.buttonDisabled]}
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderProgressStats = () => {
  if (!userData?.progress || isGuest) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIconCircle}>
          <Ionicons name="person-outline" size={48} color="#6366F1" />
        </View>
        <Text style={styles.guestTitle}>Mode Invité</Text>
        <Text style={styles.guestMessage}>
          Connectez-vous pour sauvegarder votre progression et débloquer toutes les fonctionnalités
        </Text>
        <TouchableOpacity
          style={styles.guestLoginButton}
          onPress={() => navigation.navigate('Auth', { selectedLanguage })}
        >
          <Text style={styles.guestLoginText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = userData.progress[selectedLanguage?.id || 'en'] || {};
  const level = progress.level || 1;
  const xp = progress.xp || 0;
  const lessonsCompleted = progress.lessonsCompleted || 0;
  const streak = progress.streakDays || 0;

  const xpForCurrentLevel = xp % 1000;
  const progressPercentage = Math.min(Math.round((xpForCurrentLevel / 1000) * 100), 100);

  return (
    <View style={styles.progressContainer}>
      {/* Grille de stats compacte sur une seule ligne */}
      <View style={styles.statsGridCompact}>
        <View style={[styles.statCardCompact, styles.statCardRed]}>
          <View style={styles.statIconContainerCompact}>
            <Ionicons name="flame" size={20} color="#EF4444" />
          </View>
          <Text style={styles.statNumberCompact}>{streak}</Text>
          <Text style={styles.statLabelCompact}>Jours</Text>
        </View>
        
        <View style={[styles.statCardCompact, styles.statCardBlue]}>
          <View style={styles.statIconContainerCompact}>
            <Ionicons name="book-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statNumberCompact}>{lessonsCompleted}</Text>
          <Text style={styles.statLabelCompact}>Leçons</Text>
        </View>
        
        <View style={[styles.statCardCompact, styles.statCardPurple]}>
          <View style={styles.statIconContainerCompact}>
            <Ionicons name="time-outline" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statNumberCompact}>{Math.floor(lessonsCompleted * 15)}</Text>
          <Text style={styles.statLabelCompact}>Min</Text>
        </View>
        
        <View style={[styles.statCardCompact, styles.statCardYellow]}>
          <View style={styles.statIconContainerCompact}>
            <Ionicons name="star" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statNumberCompact}>{xp}</Text>
          <Text style={styles.statLabelCompact}>XP</Text>
        </View>
      </View>

      {/* Carte Niveau avec couleur moderne */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelBadge}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.levelLabel}>NIVEAU ACTUEL</Text>
        </View>
        
        <View style={styles.levelContent}>
          <Text style={styles.levelNumber}>{level}</Text>
          <View style={styles.levelProgress}>
            <Text style={styles.xpText}>{xpForCurrentLevel}/1000 XP</Text>
            <Text style={styles.xpNextLevel}>Niveau {level + 1}</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>
    </View>
  );
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FA5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec LinearGradient */}
      <LinearGradient
        colors={['#F8F9FA', '#F8F9FA']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Profil</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section avatar flottante */}

        {renderProgressStats()}

        {!isGuest && (
          <View style={styles.optionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={20} color="#4B5563" />
              <Text style={styles.sectionTitle}>Paramètres du compte</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleEditOption('name')}
            >
              <View style={styles.optionIconContainer}>
                <View style={[styles.optionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="person-outline" size={22} color="#0EA5E9" />
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Modifier le nom</Text>
                <Text style={styles.optionSubtitle}>Changez votre nom d'affichage</Text>
              </View>
              <View style={styles.optionArrow}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleEditOption('email')}
            >
              <View style={styles.optionIconContainer}>
                <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="mail-outline" size={22} color="#F59E0B" />
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Changer l'email</Text>
                <Text style={styles.optionSubtitle}>Mettez à jour votre adresse email</Text>
              </View>
              <View style={styles.optionArrow}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleEditOption('password')}
            >
              <View style={styles.optionIconContainer}>
                <View style={[styles.optionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="lock-closed-outline" size={22} color="#22C55E" />
                </View>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Changer le mot de passe</Text>
                <Text style={styles.optionSubtitle}>Sécurisez votre compte</Text>
              </View>
              <View style={styles.optionArrow}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

          </View>
        )}

        {!isGuest ? (
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={() => navigation.navigate('Auth', { selectedLanguage })}
            activeOpacity={0.8}
          >
            <View style={styles.loginIconContainer}>
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.loginPromptText}>Créer un compte</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 Language Learner</Text>
        </View>
      </ScrollView>

      {renderEditModal()}
    </SafeAreaView>
  );
}

// Fonction pour générer une couleur d'avatar basée sur le nom
const getAvatarColor = (name) => {
  const colors = [
    '#4A6FA5', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#976ce5ff', // Purple
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  userName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statCardCompact: {
  flex: 1,
  minHeight: 80,
  borderRadius: 20,
  padding: 12,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
},
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  guestContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  guestMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestLoginButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  guestLoginText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statsGridCompact: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 20,
  gap: 8,
},
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statIconContainerCompact: {
  marginBottom: 6,
},
statNumberCompact: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 2,
  letterSpacing: -0.5,
},
statLabelCompact: {
  fontSize: 11,
  color: '#6B7280',
  textAlign: 'center',
  fontWeight: '500',
},
  levelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  levelContent: {
    marginBottom: 16,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -2,
  },
  levelProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A6FA5',
  },
  xpNextLevel: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 100) / 2,
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  statCardPurple: {
    backgroundColor: '#F5F3FF',
    borderColor: '#EDE9FE',
  },
  statCardYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionsSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionIconContainer: {
    marginRight: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  optionArrow: {
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 16,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIconContainer: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A6FA5',
    paddingVertical: 16,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginIconContainer: {
    marginRight: 8,
  },
  loginPromptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFAFA',
  },
  formInputError: {
    borderColor: '#FF6B6B',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  formError: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4A6FA5',
    marginLeft: 8,
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#4A6FA5',
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});