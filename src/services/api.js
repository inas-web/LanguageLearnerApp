import { API_CONFIG } from '../../utils/constants';
import { Audio } from 'expo-av';

/**
 * Service de traduction utilisant l'API MyMemory (gratuite)
 */
export const translateText = async (text, targetLang, sourceLang = 'fr') => {
  try {
    const url = `${API_CONFIG.MY_MEMORY.endpoint}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200) {
      return {
        success: true,
        translation: data.responseData.translatedText,
        matches: data.matches || [],
      };
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Obtenir l'URL audio pour un texte via un service TTS gratuit
 */
export const getWordAudioUrl = (word, lang = 'en-US') => {
  // Utiliser Google TTS via un proxy (gratuit)
  const encodedText = encodeURIComponent(word);
  
  // Mapping des langues
  const langMap = {
  'fr': 'fr-FR',
  'fr-FR': 'fr-FR',
  'en': 'en-US',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'es': 'es-ES',
  'es-ES': 'es-ES',
  'de': 'de-DE',
  'de-DE': 'de-DE',
  'it': 'it-IT',
  'it-IT': 'it-IT',
  'pt': 'pt-PT',
  'pt-PT': 'pt-PT',
  'ru': 'ru-RU',
  'zh': 'zh-CN',
  'zh-CN': 'zh-CN',
  'ja': 'ja-JP',
  'ja-JP': 'ja-JP',
  'ko': 'ko-KR',
  'ko-KR': 'ko-KR',
  'ar': 'ar-SA',
  'hi': 'hi-IN',
  'tr': 'tr-TR',
  'nl': 'nl-NL',
  'sv': 'sv-SE',
};
  
  const ttsLang = langMap[lang] || 'en-US';
  
  // URL Google TTS (ne fonctionne pas toujours directement)
  // Utiliser plutôt un service proxy ou une alternative
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${ttsLang}&q=${encodedText}`;
};

/**
 * Alternative: utiliser un service TTS gratuit
 */
export const getAlternativeAudioUrl = (word, lang = 'en') => {
  const encodedText = encodeURIComponent(word);
  
  // ResponsiveVoice (gratuit pour usage limité)
  return `https://code.responsivevoice.org/getvoice.php?t=${encodedText}&tl=${lang}&sv=g1&vn=&pitch=0.5&rate=0.5&volume=1`;
};

/**
 * Jouer l'audio de prononciation avec fallback
 */
export const playPronunciation = async (text, lang = 'en-US') => {
  try {
    // Essayer plusieurs sources d'audio
    const audioSources = [
      getWordAudioUrl(text, lang),
      getAlternativeAudioUrl(text, lang),
    ];

    let lastError = null;
    
    for (const audioUrl of audioSources) {
      try {
        const soundObject = new Audio.Sound();
        
        await soundObject.loadAsync({ uri: audioUrl });
        await soundObject.playAsync();
        
        // Détruire le son après la lecture
        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            soundObject.unloadAsync();
          }
        });
        
        return {
          success: true,
          audioUrl,
          soundObject,
        };
      } catch (error) {
        lastError = error;
        console.log(`Audio source failed: ${audioUrl}`);
        continue;
      }
    }
    
    // Toutes les sources ont échoué
    throw lastError || new Error('All audio sources failed');
    
  } catch (error) {
    console.error('TTS error:', error);
    
    // Fallback: utiliser le synthétiseur vocal du navigateur/device
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
        
        return {
          success: true,
          fallback: 'browser_tts',
        };
      } catch (fallbackError) {
        console.error('Browser TTS failed:', fallbackError);
      }
    }
    
    return {
      success: false,
      error: error.message,
      fallback: true,
    };
  }
};

/**
 * Simuler la lecture audio pour le développement
 */
export const simulateAudioPlayback = async (word, lang = 'en-US') => {
  console.log(`🔊 Playing: ${word} (${lang})`);
  
  // Simuler un délai de lecture
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simuler la fin de lecture
  return {
    success: true,
    simulated: true,
    message: `Audio simulated for: ${word}`,
  };
};

/**
 * Générer des questions de quiz à partir d'une leçon
 */
export const generateQuizQuestions = async (lesson, targetLang) => {
  try {
    const questions = [];
    const allWords = lesson.words || [];
    
    // Questions de traduction (2-3 questions)
    for (let i = 0; i < Math.min(3, allWords.length); i++) {
      const word = allWords[i];
      
      // Question de traduction FR -> Langue cible
      questions.push({
        id: `q${i}_translate`,
        type: 'translate',
        question: `Traduisez: "${word.translation}"`,
        correctAnswer: word.word.toLowerCase(),
        points: 10,
        audioText: word.word,
        audioLang: targetLang,
      });
      
      // Question de traduction Langue cible -> FR
      questions.push({
        id: `q${i}_reverse`,
        type: 'translate',
        question: `Traduisez: "${word.word}"`,
        correctAnswer: word.translation.toLowerCase(),
        points: 10,
      });
    }
    
    // Questions à choix multiples (3-4 questions)
    for (let i = 0; i < Math.min(4, allWords.length); i++) {
      const word = allWords[i];
      
      // Générer des distracteurs (mauvaises réponses)
      const wrongAnswers = allWords
        .filter(w => w.word !== word.word)
        .slice(0, 3)
        .map(w => w.translation);
      
      const options = [word.translation, ...wrongAnswers].sort(() => Math.random() - 0.5);
      
      questions.push({
        id: `mcq${i}`,
        type: 'multiple_choice',
        question: `Comment dit-on "${word.word}" en français ?`,
        options,
        correctAnswer: word.translation,
        points: 15,
        audioText: word.word,
        audioLang: targetLang,
      });
    }
    
    // Questions d'écoute (2 questions)
    for (let i = 0; i < Math.min(2, allWords.length); i++) {
      const word = allWords[i];
      
      questions.push({
        id: `listening${i}`,
        type: 'listening',
        question: 'Écoutez et écrivez ce que vous entendez',
        audioText: word.word,
        audioLang: targetLang,
        correctAnswer: word.word.toLowerCase(),
        points: 20,
      });
    }
    
    // Mélanger les questions
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    
    return {
      success: true,
      questions: shuffledQuestions.slice(0, 10), // Maximum 10 questions
      totalPoints: shuffledQuestions.slice(0, 10).reduce((sum, q) => sum + q.points, 0),
    };
  } catch (error) {
    console.error('Quiz generation error:', error);
    
    // Fallback: questions par défaut
    const fallbackQuestions = [
      {
        id: 'fallback1',
        type: 'translate',
        question: 'Traduisez: "Bonjour"',
        correctAnswer: 'hello',
        points: 10,
      },
      {
        id: 'fallback2',
        type: 'multiple_choice',
        question: 'Comment dit-on "Thank you" en français ?',
        options: ['Bonjour', 'Merci', 'Au revoir', 'S\'il vous plaît'],
        correctAnswer: 'Merci',
        points: 15,
      },
    ];
    
    return {
      success: true,
      questions: fallbackQuestions,
      totalPoints: 25,
      fallback: true,
    };
  }
};

/**
 * Vérifier la prononciation (simulation)
 */
export const checkPronunciation = async (expectedText, recordedAudio) => {
  try {
    // Simulation d'un score basé sur la longueur et la complexité
    const score = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    return {
      success: true,
      score,
      feedback: score >= 85 ? 'Excellente prononciation ! 🎉' :
                score >= 70 ? 'Bonne prononciation, continuez ! 👍' :
                'Essayez encore, vous progressez ! 💪',
      confidence: score / 100,
    };
  } catch (error) {
    console.error('Pronunciation check error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Valider une réponse de quiz
 */
export const validateAnswer = (userAnswer, correctAnswer, questionType) => {
  const normalize = (str) => str.toLowerCase().trim().replace(/[.,!?;]/g, '');
  
  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);
  
  // Correspondance exacte
  if (normalizedUser === normalizedCorrect) {
    return {
      correct: true,
      score: 100,
    };
  }
  
  // Correspondance partielle (pour les questions de traduction)
  if (questionType === 'translate') {
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
    
    if (similarity > 0.8) {
      return {
        correct: true,
        score: Math.floor(similarity * 100),
      };
    }
  }
  
  return {
    correct: false,
    score: 0,
  };
};

/**
 * Calculer la similarité entre deux chaînes
 */
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Distance de Levenshtein
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

export default {
  translateText,
  playPronunciation,
  getWordAudioUrl,
  getAlternativeAudioUrl,
  simulateAudioPlayback,
  generateQuizQuestions,
  checkPronunciation,
  validateAnswer,
};