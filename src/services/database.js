import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { CURRICULUM, XP_VALUES, LEVEL_THRESHOLDS } from '../../utils/constants';

/**
 * Initialiser le profil utilisateur
 */
export const initializeUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      totalXP: 0,
      level: 1,
      streak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Obtenir la progression de l'utilisateur pour une langue
 */
export const getUserProgress = async (userId, languageId) => {
  try {
    const progressRef = doc(db, 'users', userId, 'progress', languageId);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      return {
        success: true,
        progress: progressDoc.data(),
      };
    }
    
    // Initialiser la progression si elle n'existe pas
    const initialProgress = {
      languageId,
      xp: 0,
      level: 1,
      completedLessons: [],
      completedChapters: [],
      unlockedChapters: [1],
      currentChapter: 1,
      streak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    };
    
    await setDoc(progressRef, initialProgress);
    
    return {
      success: true,
      progress: initialProgress,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Marquer une leçon comme terminée
 */
export const completLesson = async (userId, languageId, lessonId, score, earnedXP) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Utiliser increment pour mettre à jour les valeurs
    await updateDoc(userRef, {
      // Mettre à jour XP
      [`progress.${languageId}.xp`]: increment(earnedXP),
      
      // Incrémenter lessonsCompleted
      [`progress.${languageId}.lessonsCompleted`]: increment(1),
      
      // Mettre à jour lastActivity
      [`progress.${languageId}.lastActivity`]: new Date().toISOString(),
      
      // Ajouter la leçon complétée
      [`progress.${languageId}.lessons.${lessonId}`]: {
        score: score,
        completed: true,
        completedAt: new Date().toISOString(),
        xpEarned: earnedXP
      },
      
      // Mettre à jour lastLogin
      lastLogin: new Date().toISOString()
    });
    
    
    // Maintenant, recalculer le niveau
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const progress = userData.progress?.[languageId] || {};
      const currentXP = progress.xp || 0;
      
      // Calculer le nouveau niveau (1000 XP par niveau)
      const newLevel = Math.floor(currentXP / 1000) + 1;
      
      // Si le niveau a changé, le mettre à jour
      if (progress.level !== newLevel) {
        await updateDoc(userRef, {
          [`progress.${languageId}.level`]: newLevel
        });
      }
    }
    
    return { success: true, message: 'Lesson completed successfully' };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Compléter un test de chapitre
 */
export const completeChapterTest = async (userId, languageId, chapterId, score, totalScore) => {
  try {
    const progressRef = doc(db, 'users', userId, 'progress', languageId);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      throw new Error('Progress not found');
    }
    
    const progress = progressDoc.data();
    const percentage = (score / totalScore) * 100;
    
    // Vérifier si le test est passé (70% minimum)
    const passed = percentage >= 70;
    
    if (passed) {
      const completedChapters = progress.completedChapters || [];
      const unlockedChapters = progress.unlockedChapters || [1];
      
      // Ajouter le chapitre aux chapitres terminés
      if (!completedChapters.includes(chapterId)) {
        completedChapters.push(chapterId);
        
        // Débloquer le chapitre suivant
        const nextChapterId = chapterId + 1;
        if (!unlockedChapters.includes(nextChapterId)) {
          unlockedChapters.push(nextChapterId);
        }
        
        const xpBonus = percentage >= 90 ? XP_VALUES.PERFECT_SCORE : XP_VALUES.CHAPTER_TEST_PASSED;
        const newXP = progress.xp + xpBonus;
        const newLevel = calculateLevel(newXP);
        
        await updateDoc(progressRef, {
          completedChapters,
          unlockedChapters,
          currentChapter: nextChapterId,
          xp: newXP,
          level: newLevel,
          lastActivityDate: new Date().toISOString().split('T')[0],
        });
        
        return {
          success: true,
          passed: true,
          xpEarned: xpBonus,
          newLevel,
          nextChapterUnlocked: true,
        };
      }
    }
    
    return {
      success: true,
      passed: false,
      message: 'Vous devez obtenir au moins 70% pour débloquer le chapitre suivant',
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculer le niveau basé sur l'XP
 */
const calculateLevel = (xp) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
};

/**
 * Obtenir les XP nécessaires pour le prochain niveau
 */
export const getXPForNextLevel = (currentXP) => {
  const currentLevel = calculateLevel(currentXP);
  const nextLevelThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  if (nextLevelThreshold) {
    return {
      current: currentXP,
      required: nextLevelThreshold.xp,
      remaining: nextLevelThreshold.xp - currentXP,
    };
  }
  
  return null;
};

/**
 * Mettre à jour le streak (série de jours consécutifs)
 */
const updateStreak = async (userId, languageId) => {
  try {
    const progressRef = doc(db, 'users', userId, 'progress', languageId);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) return;
    
    const progress = progressDoc.data();
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = progress.lastActivityDate;
    
    if (!lastActivity) {
      // Premier jour
      await updateDoc(progressRef, {
        streak: 1,
        lastActivityDate: today,
      });
      return;
    }
    
    const lastDate = new Date(lastActivity);
    const todayDate = new Date(today);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Jour consécutif
      await updateDoc(progressRef, {
        streak: increment(1),
        lastActivityDate: today,
        xp: increment(XP_VALUES.STREAK_BONUS),
      });
    } else if (diffDays > 1) {
      // Streak cassé
      await updateDoc(progressRef, {
        streak: 1,
        lastActivityDate: today,
      });
    }
    // Si diffDays === 0, c'est le même jour, on ne fait rien
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

/**
 * Obtenir les statistiques de l'utilisateur - CORRIGÉ
 */
export const getUserStats = async (userId, languageId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const progress = userData.progress?.[languageId] || {
      xp: 0,
      level: 1,
      lessonsCompleted: 0,
      lastActivity: new Date().toISOString(),
      lessons: {},
      streakDays: 0
    };
    
    // Calculer le streak (série de jours)
    const lastActivity = new Date(progress.lastActivity);
    const today = new Date();
    const diffTime = Math.abs(today - lastActivity);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let streakDays = progress.streakDays || 0;
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1;
    }
    
    // Calculer XP pour le prochain niveau
    const currentXP = progress.xp || 0;
    const nextLevelXP = 1000; // XP requis pour le niveau suivant
    const xpForCurrentLevel = currentXP % nextLevelXP;
    const progressPercentage = Math.round((xpForCurrentLevel / nextLevelXP) * 100);
    
    const stats = {
      xp: currentXP,
      level: progress.level || 1,
      lessonsCompleted: progress.lessonsCompleted || 0,
      streakDays: streakDays,
      nextLevelXP: nextLevelXP,
      currentLevelXP: xpForCurrentLevel,
      progressPercentage: progressPercentage
    };
    
    
    return {
      success: true,
      stats,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Obtenir le curriculum avec l'état de progression - CORRIGÉ
 */
export const getCurriculumWithProgress = async (userId, languageId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const progress = userData.progress?.[languageId] || {};
    const completedLessons = progress.lessons || {};
    
    // Utiliser le curriculum par défaut si pas de configuration
    const defaultCurriculum = [
      {
        id: 1,
        title: 'Les bases',
        description: 'Salutations et expressions essentielles',
        icon: '💷',
        color: '#4A6FA5',
        level: 1,
        lessons: [
          {
            id: 'lesson_1_1',
            title: 'Salutations',
            type: 'vocabulary',
            duration: 10,
            xp: 50,
            words: [
              { word: 'Hello', translation: 'Bonjour', phonetic: 'həˈləʊ' },
              { word: 'Goodbye', translation: 'Au revoir', phonetic: 'ɡʊdˈbaɪ' }
            ]
          },
          {
            id: 'lesson_1_2', 
            title: 'Nombres 1-10',
            type: 'vocabulary',
            duration: 12,
            xp: 60,
            words: [
              { word: 'One', translation: 'Un', phonetic: 'wʌn' },
              { word: 'Two', translation: 'Deux', phonetic: 'tuː' }
            ]
          }
        ]
      }
    ];
    
    const curriculum = CURRICULUM?.[languageId] || defaultCurriculum;
    
    const enrichedCurriculum = curriculum.map(chapter => {
      const chapterLessons = completedLessons ? 
        Object.keys(completedLessons).filter(lessonId => 
          lessonId.startsWith(`lesson_${chapter.id}_`)
        ).length : 0;
      
      const enrichedLessons = chapter.lessons.map(lesson => {
        const lessonProgress = completedLessons?.[lesson.id];
        
        return {
          ...lesson,
          completed: !!lessonProgress,
          score: lessonProgress?.score || 0,
          earnedXP: lessonProgress?.xpEarned || 0,
        };
      });
      
      const completedLessonCount = enrichedLessons.filter(l => l.completed).length;
      const progress = chapter.lessons.length > 0 ? 
        (completedLessonCount / chapter.lessons.length) * 100 : 0;
      
      return {
        ...chapter,
        completed: completedLessonCount === chapter.lessons.length,
        progress: progress,
        lessons: enrichedLessons,
        locked: false // Pour simplifier, on débloque tout
      };
    });
    
    return {
      success: true,
      curriculum: enrichedCurriculum,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  initializeUserProfile,
  getUserProgress,
  completLesson,
  completeChapterTest,
  getUserStats,
  getCurriculumWithProgress,
  getXPForNextLevel,
};