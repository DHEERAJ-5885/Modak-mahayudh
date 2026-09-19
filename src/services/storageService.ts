import { PlayerProfile, LevelConfig } from '../types';
import { INITIAL_PLAYER, INITIAL_LEVELS } from '../data/gameData';

const STORAGE_KEYS = {
  PLAYER: 'vighna_player_profile_v2',
  LEVELS: 'vighna_levels_data_v2',
  SCORES: 'vighna_high_scores_v2',
};

export const storageService = {
  loadPlayer(): PlayerProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PLAYER,
          ...parsed,
          unlockedPowers: parsed.unlockedPowers || INITIAL_PLAYER.unlockedPowers,
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_PLAYER;
  },

  savePlayer(player: PlayerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
    } catch {
      // ignore
    }
  },

  loadLevels(): LevelConfig[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEVELS);
      if (saved) {
        const parsed: Partial<LevelConfig>[] = JSON.parse(saved);
        return INITIAL_LEVELS.map((initLvl) => {
          const match = parsed.find((p) => p.id === initLvl.id);
          if (match) {
            return {
              ...initLvl,
              isUnlocked: initLvl.id === 1 ? true : (match.isUnlocked ?? initLvl.isUnlocked),
              starsEarned: match.starsEarned ?? initLvl.starsEarned,
              highScore: match.highScore ?? initLvl.highScore,
            };
          }
          return initLvl;
        });
      }
    } catch {
      // fallback
    }
    return INITIAL_LEVELS;
  },

  saveLevels(levels: LevelConfig[]): void {
    try {
      const slim = levels.map((l) => ({
        id: l.id,
        isUnlocked: l.isUnlocked,
        starsEarned: l.starsEarned,
        highScore: l.highScore,
      }));
      localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(slim));
    } catch {
      // ignore
    }
  },

  clearProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PLAYER);
      localStorage.removeItem(STORAGE_KEYS.LEVELS);
    } catch {
      // ignore
    }
  },
};
