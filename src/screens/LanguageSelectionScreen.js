import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const languages = [
  { id: 'en', name: 'Anglais', flag: '🇬🇧', color: '#4169E1' },
  { id: 'es', name: 'Espagnol', flag: '🇪🇸', color: '#FFD700' },
  { id: 'zh', name: 'Chinois', flag: '🇨🇳', color: '#DC143C' },
  { id: 'tr', name: 'Turc', flag: '🇹🇷', color: '#E30A17' },
  { id: 'de', name: 'Allemand', flag: '🇩🇪', color: '#000000' },
  { id: 'ja', name: 'Japonais', flag: '🇯🇵', color: '#BC002D' },
  { id: 'ko', name: 'Coréen', flag: '🇰🇷', color: '#003478' },
  { id: 'it', name: 'Italien', flag: '🇮🇹', color: '#009246', code: 'it-IT' },
  { id: 'ru', name: 'Russe', flag: '🇷🇺', color: '#D52B1E', code: 'ru-RU' },
];

export default function LanguageSelectionScreen({ navigation }) {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    // Naviguer vers l'authentification après 0.5s
    setTimeout(() => {
      navigation.navigate('Auth', { selectedLanguage: language });
    }, 500);
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' }}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Choisissez votre langue</Text>
          <Text style={styles.subtitle}>
            Sélectionnez la langue que vous souhaitez apprendre
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.languagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageCard,
                selectedLanguage?.id === language.id && styles.selectedCard,
              ]}
              onPress={() => handleLanguageSelect(language)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  selectedLanguage?.id === language.id
                    ? [language.color, '#4A6FA5']
                    : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 249, 250, 0.95)']
                }
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.languageContent}>
                  <Text style={styles.flag}>{language.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      selectedLanguage?.id === language.id && styles.selectedText,
                    ]}
                  >
                    {language.name}
                  </Text>
                  <View
                    style={[
                      styles.selectionIndicator,
                      selectedLanguage?.id === language.id &&
                        styles.selectedIndicator,
                    ]}
                  >
                    {selectedLanguage?.id === language.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedLanguage && (
          <View style={styles.selectedLanguageContainer}>
            <LinearGradient
              colors={['rgba(74, 111, 165, 0.9)', 'rgba(107, 147, 214, 0.9)']}
              style={styles.selectedGradient}
            >
              <Text style={styles.selectedText}>
                Vous avez choisi : {selectedLanguage.flag} {selectedLanguage.name}
              </Text>
              <Text style={styles.selectedSubtext}>
                Appuyez sur n'importe où pour continuer
              </Text>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  languagesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  languageCard: {
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  selectedCard: {
    transform: [{ scale: 1.03 }],
    elevation: 12,
  },
  cardGradient: {
    padding: 20,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginLeft: 15,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  selectedIndicator: {
    borderColor: '#FFFFFF',
    backgroundColor: '#4A6FA5',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedLanguageContainer: {
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 8,
  },
  selectedGradient: {
    padding: 15,
    alignItems: 'center',
  },
  selectedSubtext: {
    color: '#E0E0E0',
    fontSize: 12,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});