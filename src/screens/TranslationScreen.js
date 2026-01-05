import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { translateText, playPronunciation } from '../services/api';

const { width } = Dimensions.get('window');

// Liste des langues disponibles
const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'Anglais', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol', flag: '🇪🇸' },
  { code: 'de', name: 'Allemand', flag: '🇩🇪' },
  { code: 'it', name: 'Italien', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹' },
  { code: 'ru', name: 'Russe', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinois', flag: '🇨🇳' },
  { code: 'ja', name: 'Japonais', flag: '🇯🇵' },
  { code: 'ko', name: 'Coréen', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabe', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turc', flag: '🇹🇷' },
  { code: 'nl', name: 'Néerlandais', flag: '🇳🇱' },
  { code: 'sv', name: 'Suédois', flag: '🇸🇪' },
];

export default function TranslationScreen({ navigation, route }) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('fr');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSourceLanguages, setShowSourceLanguages] = useState(false);
  const [showTargetLanguages, setShowTargetLanguages] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const sourceInputRef = useRef(null);
  const targetInputRef = useRef(null);

  // Effet pour limiter la longueur du texte
  useEffect(() => {
    setCharCount(sourceText.length);
  }, [sourceText]);

  // Fonction de traduction
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un texte à traduire');
      return;
    }

    if (sourceText.length > 5000) {
      Alert.alert('Limite dépassée', 'Le texte ne peut pas dépasser 5000 caractères');
      return;
    }

    if (sourceLanguage === targetLanguage) {
      Alert.alert('Erreur', 'Les langues source et cible doivent être différentes');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setIsTranslating(true);

    try {
      const result = await translateText(sourceText, targetLanguage, sourceLanguage);
      
      if (result.success) {
        setTranslatedText(result.translation);
      } else {
        Alert.alert('Erreur', 'La traduction a échoué. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Erreur', 'Impossible de se connecter au service de traduction');
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  // Écouter la prononciation
  const handleListenPronunciation = async (text, lang) => {
    if (!text.trim()) return;
    
    try {
      await playPronunciation(text, lang);
    } catch (error) {
      console.error('Pronunciation error:', error);
      Alert.alert('Erreur', 'Impossible de lire la prononciation');
    }
  };

  // Copier dans le presse-papier (sans expo-clipboard)
  const handleCopyToClipboard = async (text) => {
    if (!text.trim()) return;
    
    try {
      // Solution de secours sans expo-clipboard
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(text);
      } else {
        // Pour React Native, on peut utiliser une alerte simple
        Alert.alert('Copié', 'Le texte a été copié');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le texte');
    }
  };

  // Partager la traduction
  const handleShareTranslation = async () => {
    if (!translatedText.trim()) return;
    
    try {
      await Share.share({
        message: `Traduction :\n\n${sourceText}\n\n↓\n\n${translatedText}\n\nVia Polyglot Academy`,
        title: 'Traduction Polyglot',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Échanger les langues
  const handleSwapLanguages = () => {
    if (sourceText && translatedText) {
      const tempText = sourceText;
      setSourceText(translatedText);
      setTranslatedText(tempText);
    }
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
  };

  // Sélectionner une langue source
  const handleSelectSourceLanguage = (lang) => {
    setSourceLanguage(lang.code);
    setShowSourceLanguages(false);
  };

  // Sélectionner une langue cible
  const handleSelectTargetLanguage = (lang) => {
    setTargetLanguage(lang.code);
    setShowTargetLanguages(false);
  };

  // Obtenir les informations de la langue
  const getLanguageInfo = (code) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
  };

  // Effacer le texte
  const handleClearText = () => {
    setSourceText('');
    setTranslatedText('');
    setCharCount(0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FAFAFA', '#FAFAFA']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>Traducteur</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleClearText}
            style={styles.iconButton}
          >
            <Ionicons name="close-circle-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Zone de sélection des langues */}
          <View style={styles.languageSelector}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setShowSourceLanguages(true)}
            >
              <Text style={styles.languageFlag}>
                {getLanguageInfo(sourceLanguage).flag}
              </Text>
              <Text style={styles.languageName}>
                {getLanguageInfo(sourceLanguage).name}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.swapButton}
              onPress={handleSwapLanguages}
            >
              <Ionicons name="swap-horizontal" size={24} color="#4A6FA5" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setShowTargetLanguages(true)}
            >
              <Text style={styles.languageFlag}>
                {getLanguageInfo(targetLanguage).flag}
              </Text>
              <Text style={styles.languageName}>
                {getLanguageInfo(targetLanguage).name}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Zone de texte source */}
          <View style={styles.textAreaContainer}>
            <View style={styles.textAreaHeader}>
              <Text style={styles.textAreaLabel}>Texte à traduire</Text>
              <Text style={styles.charCount}>
                {charCount}/5000
              </Text>
            </View>
            
            <View style={styles.textInputContainer}>
              <TextInput
                ref={sourceInputRef}
                style={styles.textInput}
                multiline
                value={sourceText}
                onChangeText={setSourceText}
                placeholder="Saisissez votre texte ici..."
                placeholderTextColor="#999999"
                textAlignVertical="top"
                maxLength={5000}
              />
              
              {sourceText.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setSourceText('')}
                >
                  <Ionicons name="close-circle" size={20} color="#999999" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.textAreaActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleListenPronunciation(sourceText, sourceLanguage)}
                disabled={!sourceText.trim()}
              >
                <Ionicons name="volume-high-outline" size={18} color={sourceText.trim() ? '#4A6FA5' : '#CCCCCC'} />
                <Text style={[
                  styles.actionButtonText,
                  !sourceText.trim() && styles.actionButtonTextDisabled
                ]}>
                  Écouter
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleCopyToClipboard(sourceText)}
                disabled={!sourceText.trim()}
              >
                <Ionicons name="copy-outline" size={18} color={sourceText.trim() ? '#4A6FA5' : '#CCCCCC'} />
                <Text style={[
                  styles.actionButtonText,
                  !sourceText.trim() && styles.actionButtonTextDisabled
                ]}>
                  Copier
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton de traduction */}
          <TouchableOpacity 
            style={[
              styles.translateButton,
              (!sourceText.trim() || loading) && styles.translateButtonDisabled
            ]}
            onPress={handleTranslate}
            disabled={!sourceText.trim() || loading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.translateButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
                  <Text style={styles.translateButtonText}>Traduire</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Zone de texte traduit */}
          {translatedText ? (
            <View style={styles.textAreaContainer}>
              <View style={styles.textAreaHeader}>
                <Text style={styles.textAreaLabel}>Traduction</Text>
                <View style={styles.translatedHeaderActions}>
                  <TouchableOpacity 
                    style={styles.iconActionButton}
                    onPress={handleShareTranslation}
                  >
                    <Ionicons name="share-outline" size={18} color="#4A6FA5" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.iconActionButton}
                    onPress={() => handleCopyToClipboard(translatedText)}
                  >
                    <Ionicons name="copy-outline" size={18} color="#4A6FA5" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={[styles.textInputContainer, styles.translatedContainer]}>
                <TextInput
                  ref={targetInputRef}
                  style={styles.textInput}
                  multiline
                  value={translatedText}
                  editable={false}
                  placeholder="La traduction apparaîtra ici..."
                  placeholderTextColor="#999999"
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.textAreaActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleListenPronunciation(translatedText, targetLanguage)}
                >
                  <Ionicons name="volume-high-outline" size={18} color="#4A6FA5" />
                  <Text style={styles.actionButtonText}>
                    Écouter
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleCopyToClipboard(translatedText)}
                >
                  <Ionicons name="copy-outline" size={18} color="#4A6FA5" />
                  <Text style={styles.actionButtonText}>
                    Copier
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isTranslating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A6FA5" />
              <Text style={styles.loadingText}>Traduction en cours...</Text>
            </View>
          ) : null}

          {/* Section des langues fréquentes */}
          <View style={styles.frequentLanguages}>
            <Text style={styles.sectionTitle}>Langues fréquentes</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.frequentLanguagesScroll}
            >
              {LANGUAGES.slice(0, 8).map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.frequentLanguageButton,
                    (sourceLanguage === lang.code || targetLanguage === lang.code) && 
                    styles.frequentLanguageButtonActive
                  ]}
                  onPress={() => {
                    if (sourceLanguage === lang.code) {
                      setTargetLanguage(lang.code);
                    } else if (targetLanguage === lang.code) {
                      setSourceLanguage(lang.code);
                    } else {
                      setTargetLanguage(lang.code);
                    }
                  }}
                >
                  <Text style={styles.frequentLanguageFlag}>{lang.flag}</Text>
                  <Text style={styles.frequentLanguageName}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de sélection des langues source */}
      {showSourceLanguages && (
        <LanguageModal
          visible={showSourceLanguages}
          onClose={() => setShowSourceLanguages(false)}
          languages={LANGUAGES}
          selectedLanguage={sourceLanguage}
          onSelectLanguage={handleSelectSourceLanguage}
          title="Sélectionner la langue source"
        />
      )}

      {/* Modal de sélection des langues cible */}
      {showTargetLanguages && (
        <LanguageModal
          visible={showTargetLanguages}
          onClose={() => setShowTargetLanguages(false)}
          languages={LANGUAGES}
          selectedLanguage={targetLanguage}
          onSelectLanguage={handleSelectTargetLanguage}
          title="Sélectionner la langue cible"
        />
      )}
    </View>
  );
}

// Composant Modal pour la sélection des langues
const LanguageModal = ({ visible, onClose, languages, selectedLanguage, onSelectLanguage, title }) => {
  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={modalStyles.scrollView}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                modalStyles.languageItem,
                selectedLanguage === lang.code && modalStyles.languageItemSelected
              ]}
              onPress={() => onSelectLanguage(lang)}
            >
              <Text style={modalStyles.languageFlag}>{lang.flag}</Text>
              <Text style={[
                modalStyles.languageName,
                selectedLanguage === lang.code && modalStyles.languageNameSelected
              ]}>
                {lang.name}
              </Text>
              {selectedLanguage === lang.code && (
                <Ionicons name="checkmark" size={20} color="#4A6FA5" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  languageItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  languageNameSelected: {
    color: '#4A6FA5',
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  swapButton: {
    marginHorizontal: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textAreaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
  },
  textInputContainer: {
    position: 'relative',
  },
  textInput: {
    minHeight: 120,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    paddingTop: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    lineHeight: 24,
  },
  translatedContainer: {
    opacity: 0.9,
  },
  clearButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  textAreaActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 5,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4A6FA5',
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: '#CCCCCC',
  },
  iconActionButton: {
    padding: 5,
    marginLeft: 10,
  },
  translatedHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translateButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  translateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666666',
  },
  frequentLanguages: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  frequentLanguagesScroll: {
    flexDirection: 'row',
  },
  frequentLanguageButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 70,
  },
  frequentLanguageButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#4A6FA5',
  },
  frequentLanguageFlag: {
    fontSize: 24,
    marginBottom: 5,
  },
  frequentLanguageName: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
});