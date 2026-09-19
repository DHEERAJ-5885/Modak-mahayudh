import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  LeaderboardEntry,
  LeaderboardFilter,
  ScoreSubmission,
  PlayerRankResult,
} from '../types';

const LEADERBOARD_STORAGE_KEY = 'vighna_global_leaderboard_v4';
const PROCESSED_SUBMISSIONS_KEY = 'vighna_processed_submissions_v4';

/**
 * Standard Global Seed Entries.
 * Designed to seamlessly connect to backend services like Supabase or Firebase.
 */
export const GLOBAL_LEADERBOARD_SEEDS: LeaderboardEntry[] = [
  {
    id: 'lead_seed_1',
    submissionId: 'sub_seed_1',
    playerId: 'usr_aarav',
    playerName: 'Aarav Patel',
    playerAvatar: 'ganesha',
    level: 10,
    score: 48250,
    bestScore: 48250,
    obstaclesDefeated: 48,
    completionTime: 76,
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'lead_seed_2',
    submissionId: 'sub_seed_2',
    playerId: 'usr_rohan',
    playerName: 'Rohan Kulkarni',
    playerAvatar: 'mushak',
    level: 9,
    score: 45120,
    bestScore: 45120,
    obstaclesDefeated: 42,
    completionTime: 82,
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: 'lead_seed_3',
    submissionId: 'sub_seed_3',
    playerId: 'usr_rahul',
    playerName: 'Rahul Sharma',
    playerAvatar: 'lotus',
    level: 8,
    score: 42900,
    bestScore: 42900,
    obstaclesDefeated: 39,
    completionTime: 65,
    timestamp: Date.now() - 3600000 * 8,
  },
  {
    id: 'lead_seed_4',
    submissionId: 'sub_seed_4',
    playerId: 'usr_ananya',
    playerName: 'Ananya Deshmukh',
    playerAvatar: 'diya',
    level: 7,
    score: 38700,
    bestScore: 38700,
    obstaclesDefeated: 34,
    completionTime: 59,
    timestamp: Date.now() - 3600000 * 12,
  },
  {
    id: 'lead_seed_5',
    submissionId: 'sub_seed_5',
    playerId: 'usr_vikram',
    playerName: 'Vikramaditya S.',
    playerAvatar: 'trident',
    level: 6,
    score: 36400,
    bestScore: 36400,
    obstaclesDefeated: 31,
    completionTime: 54,
    timestamp: Date.now() - 3600000 * 16,
  },
  {
    id: 'lead_seed_6',
    submissionId: 'sub_seed_6',
    playerId: 'usr_meera',
    playerName: 'Meera Iyer',
    playerAvatar: 'ganesha',
    level: 5,
    score: 34150,
    bestScore: 34150,
    obstaclesDefeated: 28,
    completionTime: 49,
    timestamp: Date.now() - 3600000 * 20,
  },
  {
    id: 'lead_seed_7',
    submissionId: 'sub_seed_7',
    playerId: 'usr_devendra',
    playerName: 'Devendra Rao',
    playerAvatar: 'mushak',
    level: 4,
    score: 31800,
    bestScore: 31800,
    obstaclesDefeated: 24,
    completionTime: 43,
    timestamp: Date.now() - 3600000 * 24,
  },
  {
    id: 'lead_seed_8',
    submissionId: 'sub_seed_8',
    playerId: 'usr_pooja',
    playerName: 'Pooja Verma',
    playerAvatar: 'lotus',
    level: 3,
    score: 29500,
    bestScore: 29500,
    obstaclesDefeated: 20,
    completionTime: 38,
    timestamp: Date.now() - 3600000 * 28,
  },
];

export interface SubmitScoreResult {
  success: boolean;
  rank?: number;
  isNewBest?: boolean;
  entry?: LeaderboardEntry;
  message?: string;
}

export interface LeaderboardServiceInterface {
  submitScore(submission: ScoreSubmission): Promise<SubmitScoreResult>;
  getLeaderboard(filter?: LeaderboardFilter): Promise<LeaderboardEntry[]>;
  getPlayerRank(playerId: string, filter?: LeaderboardFilter): Promise<PlayerRankResult | null>;
  resetToDefault(): Promise<void>;
}

class LocalStorageLeaderboardService implements LeaderboardServiceInterface {
  private getProcessedSubmissions(): Set<string> {
    try {
      const data = localStorage.getItem(PROCESSED_SUBMISSIONS_KEY);
      if (data) {
        return new Set(JSON.parse(data));
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  }

  private saveProcessedSubmissions(set: Set<string>): void {
    try {
      localStorage.setItem(PROCESSED_SUBMISSIONS_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }

  private getStoredEntries(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (raw) {
        const parsed: LeaderboardEntry[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [...GLOBAL_LEADERBOARD_SEEDS];
  }

  private saveStoredEntries(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }

  /**
   * Submit or update a player score on the global leaderboard.
   * Keeps each player's highest score.
   */
  async submitScore(submission: ScoreSubmission): Promise<SubmitScoreResult> {
    const processedIds = this.getProcessedSubmissions();
    if (submission.submissionId && processedIds.has(submission.submissionId)) {
      return {
        success: false,
        message: 'Duplicate submission rejected: Event already registered',
      };
    }

    if (submission.score <= 0 || submission.score > 1000000) {
      return { success: false, message: 'Invalid score value' };
    }

    if (submission.submissionId) {
      processedIds.add(submission.submissionId);
      this.saveProcessedSubmissions(processedIds);
    }

    const currentEntries = this.getStoredEntries();
    const existingIndex = currentEntries.findIndex((e) => e.playerId === submission.playerId);

    let isNewBest = false;
    let entry: LeaderboardEntry;

    if (existingIndex >= 0) {
      const existing = currentEntries[existingIndex];
      const highest = Math.max(existing.score, existing.bestScore, submission.score);
      isNewBest = submission.score > existing.score;

      entry = {
        ...existing,
        playerName: submission.playerName || existing.playerName,
        playerAvatar: submission.playerAvatar || existing.playerAvatar || 'ganesha',
        level: Math.max(existing.level, submission.level),
        score: highest,
        bestScore: highest,
        obstaclesDefeated: Math.max(existing.obstaclesDefeated || 0, submission.obstaclesDefeated || 0),
        timestamp: Date.now(),
      };
      currentEntries[existingIndex] = entry;
    } else {
      isNewBest = true;
      entry = {
        id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        submissionId: submission.submissionId,
        playerId: submission.playerId,
        playerName: submission.playerName.trim() || 'Temple Warrior',
        playerAvatar: submission.playerAvatar || 'ganesha',
        level: submission.level,
        score: submission.score,
        bestScore: submission.score,
        obstaclesDefeated: submission.obstaclesDefeated,
        completionTime: submission.completionTime,
        timestamp: Date.now(),
      };
      currentEntries.push(entry);
    }

    this.saveStoredEntries(currentEntries);

    // Sync to Firestore if online
    try {
      const firestoreDocId = submission.playerId;
      await setDoc(
        doc(db, 'leaderboard', firestoreDocId),
        {
          ...entry,
          id: firestoreDocId,
        },
        { merge: true }
      );
    } catch (e) {
      // Offline fallback is already saved
    }

    const rankResult = await this.getPlayerRank(submission.playerId);

    return {
      success: true,
      rank: rankResult?.rank,
      isNewBest,
      entry,
    };
  }

  /**
   * Retrieve global leaderboard sorted descending by score.
   */
  async getLeaderboard(filter?: LeaderboardFilter): Promise<LeaderboardEntry[]> {
    let allEntries = this.getStoredEntries();

    // Query Firestore if available to get other players
    try {
      const q = query(collection(db, 'leaderboard'), firestoreLimit(100));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreEntries: LeaderboardEntry[] = [];
        snap.forEach((d) => {
          firestoreEntries.push({ id: d.id, ...d.data() } as LeaderboardEntry);
        });

        const mergedMap = new Map<string, LeaderboardEntry>();
        for (const e of allEntries) {
          mergedMap.set(e.playerId, e);
        }
        for (const fe of firestoreEntries) {
          const existing = mergedMap.get(fe.playerId);
          if (!existing || fe.score > existing.score) {
            mergedMap.set(fe.playerId, fe);
          }
        }
        allEntries = Array.from(mergedMap.values());
      }
    } catch (e) {
      // Local fallback used
    }

    // Sort descending by highest score
    allEntries.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return (b.level || 0) - (a.level || 0);
    });

    const limit = filter?.limit || 50;
    return allEntries.slice(0, limit);
  }

  /**
   * Get specific player's rank on the global leaderboard.
   */
  async getPlayerRank(
    playerId: string,
    filter?: LeaderboardFilter
  ): Promise<PlayerRankResult | null> {
    const rankedList = await this.getLeaderboard(filter);
    const index = rankedList.findIndex((e) => e.playerId === playerId);

    if (index === -1) {
      return null;
    }

    const entry = rankedList[index];
    return {
      rank: index + 1,
      totalPlayers: rankedList.length,
      bestScore: entry.bestScore || entry.score,
      score: entry.score,
      obstaclesDefeated: entry.obstaclesDefeated || 0,
      level: entry.level || 1,
      completionTime: entry.completionTime || 0,
      entry,
    };
  }

  async resetToDefault(): Promise<void> {
    this.saveStoredEntries([...GLOBAL_LEADERBOARD_SEEDS]);
  }
}

export const leaderboardService: LeaderboardServiceInterface =
  new LocalStorageLeaderboardService();
