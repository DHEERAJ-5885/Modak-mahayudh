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
} from 'firebase/firestore';
import { db } from './firebase';
import { PlayerProfile, LevelConfig, LevelProgressRecord } from '../types';
import { INITIAL_LEVELS } from '../data/gameData';

export const DEFAULT_PLAYER_STATS: Omit<PlayerProfile, 'id' | 'name' | 'displayName' | 'email'> = {
  avatar: 'ganesha',
  campus: 'Mumbai Central',
  lives: 5,
  maxLives: 5,
  coins: 1000,
  stars: 0,
  currentLevel: 1,
  highestLevel: 1,
  totalScore: 0,
  streakDays: 1,
  pranaEnergy: 100,
  maxPrana: 100,
  highScore: 0,
  unlockedPowers: ['trident'],
  tridentLevel: 1,
  lotusLevel: 1,
  mushakLevel: 1,
  diyaLevel: 1,
  soundEnabled: true,
  reducedMotion: false,
  achievements: ['first_login'],
};

export const playerService = {
  /**
   * Fetch player profile from Firestore
   */
  async getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
    try {
      const playerRef = doc(db, 'players', userId);
      const snapshot = await getDoc(playerRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          ...DEFAULT_PLAYER_STATS,
          ...data,
          id: userId,
          name: data.displayName || data.name || 'Temple Warrior',
          displayName: data.displayName || data.name || 'Temple Warrior',
          unlockedPowers: Array.isArray(data.unlockedPowers) && data.unlockedPowers.length > 0
            ? data.unlockedPowers
            : ['trident'],
          achievements: Array.isArray(data.achievements) && data.achievements.length > 0
            ? data.achievements
            : ['first_login'],
        } as PlayerProfile;
      }
      return null;
    } catch (err) {
      console.error('Error getting player profile:', err);
      return null;
    }
  },

  /**
   * Create or initialize a new player profile
   */
  async createPlayerProfile(
    userId: string,
    displayName: string,
    email: string,
    migratedData?: Partial<PlayerProfile>
  ): Promise<PlayerProfile> {
    const playerRef = doc(db, 'players', userId);
    const nowIso = new Date().toISOString();

    const newProfile: PlayerProfile = {
      ...DEFAULT_PLAYER_STATS,
      ...migratedData,
      id: userId,
      name: displayName,
      displayName,
      email,
      avatar: migratedData?.avatar || 'ganesha',
      campus: migratedData?.campus || 'Mumbai Central',
      lives: migratedData?.lives !== undefined ? migratedData.lives : 5,
      maxLives: 5,
      coins: migratedData?.coins !== undefined ? migratedData.coins : 1000,
      stars: migratedData?.stars !== undefined ? migratedData.stars : 0,
      currentLevel: migratedData?.currentLevel !== undefined ? migratedData.currentLevel : 1,
      highestLevel: migratedData?.highestLevel !== undefined ? migratedData.highestLevel : 1,
      totalScore: migratedData?.totalScore !== undefined ? migratedData.totalScore : 0,
      highScore: migratedData?.highScore !== undefined ? migratedData.highScore : 0,
      unlockedPowers: migratedData?.unlockedPowers?.length
        ? migratedData.unlockedPowers
        : ['trident'],
      achievements: migratedData?.achievements?.length
        ? migratedData.achievements
        : ['first_login'],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(playerRef, {
      ...newProfile,
      updatedAtServer: serverTimestamp(),
    }, { merge: true });

    // Initialize level 1 as unlocked
    await this.initializeLevelRecords(userId, newProfile.highestLevel);

    return newProfile;
  },

  /**
   * Save / sync full or partial player profile updates
   */
  async savePlayerProfile(userId: string, updates: Partial<PlayerProfile>): Promise<void> {
    try {
      const playerRef = doc(db, 'players', userId);
      await setDoc(
        playerRef,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedAtServer: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error updating player profile:', err);
      throw err;
    }
  },

  /**
   * Initialize or sync level progress records for 10 levels
   */
  async initializeLevelRecords(userId: string, highestUnlockedLevel: number = 1): Promise<void> {
    try {
      await Promise.all(
        INITIAL_LEVELS.map(async (lvl) => {
          const docId = `${userId}_${lvl.id}`;
          const levelDocRef = doc(db, 'level_progress', docId);
          const existing = await getDoc(levelDocRef);

          if (!existing.exists()) {
            await setDoc(levelDocRef, {
              id: docId,
              playerId: userId,
              levelId: lvl.id,
              completed: false,
              stars: 0,
              bestScore: 0,
              highScore: 0,
              unlocked: lvl.id <= Math.max(1, highestUnlockedLevel),
              updatedAt: new Date().toISOString(),
            });
          }
        })
      );
    } catch (err) {
      console.error('Error initializing level records:', err);
    }
  },

  /**
   * Load all level progress records for a player and merge into LevelConfig[]
   */
  async loadLevelsForPlayer(userId: string): Promise<LevelConfig[]> {
    try {
      const q = query(
        collection(db, 'level_progress'),
        where('playerId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const progressMap = new Map<number, LevelProgressRecord>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as LevelProgressRecord;
        progressMap.set(data.levelId, data);
      });

      return INITIAL_LEVELS.map((baseLvl) => {
        const record = progressMap.get(baseLvl.id);
        if (record) {
          return {
            ...baseLvl,
            isUnlocked: baseLvl.id === 1 ? true : record.unlocked,
            starsEarned: record.stars || 0,
            highScore: Math.max(record.bestScore || 0, record.highScore || 0),
          };
        }
        return {
          ...baseLvl,
          isUnlocked: baseLvl.id === 1,
          starsEarned: 0,
          highScore: 0,
        };
      });
    } catch (err) {
      console.error('Error loading level progress for player:', err);
      return INITIAL_LEVELS.map((l) => ({
        ...l,
        isUnlocked: l.id === 1,
        starsEarned: 0,
        highScore: 0,
      }));
    }
  },

  /**
   * Record level victory with strictly non-downgrading best score and stars!
   */
  async recordLevelVictory(
    userId: string,
    levelId: number,
    finalScore: number,
    starsEarned: number,
    currentLevels: LevelConfig[],
    player: PlayerProfile
  ): Promise<{
    updatedPlayer: PlayerProfile;
    updatedLevels: LevelConfig[];
    isNewBest: boolean;
  }> {
    const docId = `${userId}_${levelId}`;
    const levelDocRef = doc(db, 'level_progress', docId);

    // Read previous record for this level
    let previousBest = 0;
    let previousStars = 0;
    try {
      const snap = await getDoc(levelDocRef);
      if (snap.exists()) {
        const d = snap.data();
        previousBest = d.bestScore || d.highScore || 0;
        previousStars = d.stars || 0;
      }
    } catch (e) {
      console.warn('Could not read previous level best:', e);
    }

    const isNewBest = finalScore > previousBest;
    const computedBestScore = Math.max(previousBest, finalScore);
    const computedStars = Math.max(previousStars, starsEarned);

    // Update level progress doc
    await setDoc(
      levelDocRef,
      {
        id: docId,
        playerId: userId,
        levelId,
        completed: true,
        stars: computedStars,
        bestScore: computedBestScore,
        highScore: computedBestScore,
        unlocked: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Unlock next level doc
    const nextLevelId = Math.min(10, levelId + 1);
    const nextDocId = `${userId}_${nextLevelId}`;
    const nextLevelDocRef = doc(db, 'level_progress', nextDocId);
    await setDoc(
      nextLevelDocRef,
      {
        id: nextDocId,
        playerId: userId,
        levelId: nextLevelId,
        unlocked: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update local levels state
    const updatedLevels = currentLevels.map((lvl) => {
      if (lvl.id === levelId) {
        return {
          ...lvl,
          starsEarned: computedStars,
          highScore: computedBestScore,
        };
      }
      if (lvl.id === nextLevelId) {
        return { ...lvl, isUnlocked: true };
      }
      return lvl;
    });

    // Calculate total stars across all levels
    const totalStars = updatedLevels.reduce((sum, l) => sum + (l.starsEarned || 0), 0);
    const newHighestLevel = Math.max(player.highestLevel || 1, nextLevelId);
    const overallHighScore = Math.max(player.highScore || 0, finalScore);
    const newTotalScore = (player.totalScore || 0) + finalScore;

    // Check power unlocks according to level progression
    const newPowers = [...(player.unlockedPowers || ['trident'])];
    if (nextLevelId >= 2 && !newPowers.includes('mushak')) newPowers.push('mushak');
    if (nextLevelId >= 4 && !newPowers.includes('lotus')) newPowers.push('lotus');
    if (nextLevelId >= 6 && !newPowers.includes('diya')) newPowers.push('diya');
    if (nextLevelId >= 9 && !newPowers.includes('chant')) newPowers.push('chant');

    const newAchievements = [...(player.achievements || ['first_login'])];
    if (!newAchievements.includes('first_win')) newAchievements.push('first_win');
    if (starsEarned === 3 && !newAchievements.includes('three_stars')) newAchievements.push('three_stars');
    if (nextLevelId >= 2 && !newAchievements.includes('power_unlocked')) newAchievements.push('power_unlocked');

    const updatedPlayer: PlayerProfile = {
      ...player,
      stars: totalStars,
      currentLevel: nextLevelId,
      highestLevel: newHighestLevel,
      highScore: overallHighScore,
      totalScore: newTotalScore,
      coins: (player.coins || 0) + 250,
      unlockedPowers: newPowers,
      achievements: newAchievements,
      updatedAt: new Date().toISOString(),
    };

    // Persist to players/{userId}
    await this.savePlayerProfile(userId, {
      stars: updatedPlayer.stars,
      currentLevel: updatedPlayer.currentLevel,
      highestLevel: updatedPlayer.highestLevel,
      highScore: updatedPlayer.highScore,
      totalScore: updatedPlayer.totalScore,
      coins: updatedPlayer.coins,
      unlockedPowers: updatedPlayer.unlockedPowers,
      achievements: updatedPlayer.achievements,
    });

    return { updatedPlayer, updatedLevels, isNewBest };
  },

  /**
   * Deduct 1 life in Firestore
   */
  async deductLife(userId: string, currentLives: number): Promise<number> {
    const newLives = Math.max(0, currentLives - 1);
    await this.savePlayerProfile(userId, { lives: newLives });
    return newLives;
  },

  /**
   * Add 1 life in Firestore (e.g. from life request or reward)
   */
  async addLife(userId: string, currentLives: number, maxLives: number = 5): Promise<number> {
    const newLives = Math.min(maxLives, currentLives + 1);
    await this.savePlayerProfile(userId, { lives: newLives });
    return newLives;
  },
};
