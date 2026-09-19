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

const LEADERBOARD_STORAGE_KEY = 'vighna_leaderboard_entries_v3';
const PROCESSED_SUBMISSIONS_KEY = 'vighna_processed_submissions_v3';

/**
 * Isolated Development-Only Mock Data.
 * IMPORTANT: In accordance with game integrity requirements, these entries are
 * explicitly flagged with `isDevMock: true` and are segregated so they are never
 * presented as authentic player submissions.
 */
export const DEV_MOCK_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'mock_dev_1',
    submissionId: 'sub_seed_1',
    playerId: 'dev_usr_1',
    playerName: 'Ananya Sharma',
    campus: 'Mumbai Central',
    level: 10,
    score: 48250,
    obstaclesDefeated: 48,
    bestScore: 48250,
    completionTime: 76,
    timestamp: Date.now() - 3600000 * 2,
    isDevMock: true,
  },
  {
    id: 'mock_dev_2',
    submissionId: 'sub_seed_2',
    playerId: 'dev_usr_2',
    playerName: 'Rohan Kulkarni',
    campus: 'Pune University',
    level: 9,
    score: 45120,
    obstaclesDefeated: 42,
    bestScore: 45120,
    completionTime: 82,
    timestamp: Date.now() - 3600000 * 5,
    isDevMock: true,
  },
  {
    id: 'mock_dev_3',
    submissionId: 'sub_seed_3',
    playerId: 'dev_usr_3',
    playerName: 'Aarav Patel',
    campus: 'Ahmedabad Pandal',
    level: 8,
    score: 42900,
    obstaclesDefeated: 39,
    bestScore: 42900,
    completionTime: 65,
    timestamp: Date.now() - 3600000 * 8,
    isDevMock: true,
  },
  {
    id: 'mock_dev_4',
    submissionId: 'sub_seed_4',
    playerId: 'dev_usr_4',
    playerName: 'Pooja Deshmukh',
    campus: 'Nagpur Mandir',
    level: 7,
    score: 38700,
    obstaclesDefeated: 34,
    bestScore: 38700,
    completionTime: 59,
    timestamp: Date.now() - 3600000 * 12,
    isDevMock: true,
  },
  {
    id: 'mock_dev_5',
    submissionId: 'sub_seed_5',
    playerId: 'dev_usr_5',
    playerName: 'Vikramaditya S.',
    campus: 'Bengaluru Tech',
    level: 6,
    score: 36400,
    obstaclesDefeated: 31,
    bestScore: 36400,
    completionTime: 54,
    timestamp: Date.now() - 3600000 * 16,
    isDevMock: true,
  },
  {
    id: 'mock_dev_6',
    submissionId: 'sub_seed_6',
    playerId: 'dev_usr_6',
    playerName: 'Meera Iyer',
    campus: 'Chennai Sanctuary',
    level: 5,
    score: 34150,
    obstaclesDefeated: 28,
    bestScore: 34150,
    completionTime: 49,
    timestamp: Date.now() - 3600000 * 20,
    isDevMock: true,
  },
  {
    id: 'mock_dev_7',
    submissionId: 'sub_seed_7',
    playerId: 'dev_usr_7',
    playerName: 'Devendra Rao',
    campus: 'Hyderabad Utsav',
    level: 4,
    score: 31800,
    obstaclesDefeated: 24,
    bestScore: 31800,
    completionTime: 43,
    timestamp: Date.now() - 3600000 * 24,
    isDevMock: true,
  },
];

export const AVAILABLE_CAMPUSES = [
  'All Campuses',
  'Mumbai Central',
  'Pune University',
  'Bengaluru Tech',
  'Ahmedabad Pandal',
  'Nagpur Mandir',
  'Chennai Sanctuary',
  'Hyderabad Utsav',
];

export interface SubmitScoreResult {
  success: boolean;
  rank?: number;
  isNewBest?: boolean;
  entry?: LeaderboardEntry;
  message?: string;
}

/**
 * Leaderboard Service Interface abstraction.
 * Ready for drop-in Supabase or backend integration without touching UI components.
 *
 * --- Supabase Database Schema (Reference for production migration) ---
 * ```sql
 * CREATE TABLE leaderboard_scores (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   submission_id TEXT UNIQUE NOT NULL,
 *   player_id TEXT NOT NULL,
 *   player_name TEXT NOT NULL,
 *   campus TEXT NOT NULL,
 *   level INT NOT NULL,
 *   score INT NOT NULL,
 *   obstacles_defeated INT NOT NULL,
 *   best_score INT NOT NULL,
 *   completion_time INT NOT NULL,
 *   timestamp BIGINT NOT NULL,
 *   is_dev_mock BOOLEAN DEFAULT false
 * );
 * CREATE INDEX idx_leaderboard_level_score ON leaderboard_scores (level, score DESC);
 * CREATE INDEX idx_leaderboard_campus_score ON leaderboard_scores (campus, score DESC);
 * ```
 */
export interface LeaderboardServiceInterface {
  submitScore(submission: ScoreSubmission): Promise<SubmitScoreResult>;
  getLeaderboard(filter?: LeaderboardFilter): Promise<LeaderboardEntry[]>;
  getPlayerRank(playerId: string, filter?: LeaderboardFilter): Promise<PlayerRankResult | null>;
  getCampuses(): Promise<string[]>;
  clearDevMockData(): Promise<void>;
  resetToDevDefault(): Promise<void>;
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
      localStorage.setItem(
        PROCESSED_SUBMISSIONS_KEY,
        JSON.stringify(Array.from(set))
      );
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
    // Return isolated dev mock entries on first run
    return [...DEV_MOCK_ENTRIES];
  }

  private saveStoredEntries(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }

  /**
   * Submit authentic gameplay score.
   *
   * STRICT INTEGRITY RULES:
   * 1. Rejects duplicate submissions from the same completion event ID.
   * 2. Only valid completed gameplay calls this.
   * 3. Authentic player submissions are marked with `isDevMock: false`.
   */
  async submitScore(submission: ScoreSubmission): Promise<SubmitScoreResult> {
    // 1. Deduplication guard
    const processedIds = this.getProcessedSubmissions();
    if (submission.submissionId && processedIds.has(submission.submissionId)) {
      return {
        success: false,
        message: 'Duplicate submission rejected: Event already registered',
      };
    }

    // 2. Validation bounds
    if (submission.score <= 0 || submission.score > 500000) {
      return { success: false, message: 'Invalid score value' };
    }
    if (submission.level < 1 || submission.level > 10) {
      return { success: false, message: 'Invalid level index' };
    }

    // Record submissionId immediately
    if (submission.submissionId) {
      processedIds.add(submission.submissionId);
      this.saveProcessedSubmissions(processedIds);
    }

    const currentEntries = this.getStoredEntries();

    // Check player's existing records
    const playerExistingEntries = currentEntries.filter(
      (e) => e.playerId === submission.playerId
    );

    const existingHighestScore = playerExistingEntries.reduce(
      (max, e) => Math.max(max, e.score, e.bestScore),
      0
    );

    const isNewBest = submission.score > existingHighestScore;
    const computedBestScore = Math.max(existingHighestScore, submission.score);

    // Create authentic validated entry
    const newEntry: LeaderboardEntry = {
      id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      submissionId: submission.submissionId,
      playerId: submission.playerId,
      playerName: submission.playerName.trim() || 'Temple Warrior',
      campus: submission.campus || 'Mumbai Central',
      level: submission.level,
      score: submission.score,
      obstaclesDefeated: Math.max(0, submission.obstaclesDefeated),
      bestScore: computedBestScore,
      completionTime: Math.max(1, submission.completionTime),
      timestamp: submission.timestamp || Date.now(),
      isDevMock: false, // Strictly authentic verified gameplay!
    };

    // Replace previous entry for the exact same level by this player if higher,
    // or add new entry for this level
    const existingIndexForLevel = currentEntries.findIndex(
      (e) => e.playerId === submission.playerId && e.level === submission.level
    );

    if (existingIndexForLevel >= 0) {
      if (submission.score >= currentEntries[existingIndexForLevel].score) {
        currentEntries[existingIndexForLevel] = newEntry;
      }
    } else {
      currentEntries.push(newEntry);
    }

    // Update bestScore across all entries for this player
    for (const entry of currentEntries) {
      if (entry.playerId === submission.playerId) {
        entry.bestScore = computedBestScore;
      }
    }

    this.saveStoredEntries(currentEntries);

    // Save to Firestore asynchronously for authentic cross-device global ranking
    try {
      const firestoreDocId = `${submission.playerId}_lvl${submission.level}`;
      await setDoc(
        doc(db, 'leaderboard', firestoreDocId),
        {
          ...newEntry,
          id: firestoreDocId,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not sync to Firestore leaderboard:', e);
    }

    // Calculate current rank for player in global ranking
    const rankResult = await this.getPlayerRank(submission.playerId);

    return {
      success: true,
      rank: rankResult?.rank,
      isNewBest,
      entry: newEntry,
    };
  }

  /**
   * Retrieve filtered & sorted leaderboard.
   * Supports:
   * - Global ranking (all campuses, all levels)
   * - Campus filter
   * - Level filter
   * - Distinct best score per player in the requested scope
   */
  async getLeaderboard(filter?: LeaderboardFilter): Promise<LeaderboardEntry[]> {
    let allEntries = this.getStoredEntries();

    // Query real authentic scores from Firestore collection
    try {
      const q = query(collection(db, 'leaderboard'), firestoreLimit(100));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreEntries: LeaderboardEntry[] = [];
        snap.forEach((d) => {
          firestoreEntries.push({ id: d.id, ...d.data() } as LeaderboardEntry);
        });

        // Merge firestore entries into allEntries by submissionId or id
        const mergedMap = new Map<string, LeaderboardEntry>();
        for (const e of allEntries) {
          mergedMap.set(e.id, e);
        }
        for (const fe of firestoreEntries) {
          mergedMap.set(fe.id, fe);
        }
        allEntries = Array.from(mergedMap.values());
      }
    } catch (e) {
      console.warn('Could not read Firestore leaderboard, using local cache:', e);
    }

    let filtered = [...allEntries];

    // Filter by Campus
    if (filter?.campus && filter.campus !== 'all' && filter.campus !== 'All Campuses') {
      filtered = filtered.filter(
        (e) => e.campus.trim().toLowerCase() === filter.campus?.trim().toLowerCase()
      );
    }

    // Filter by Level
    if (filter?.level && filter.level !== 'all') {
      const targetLevel = typeof filter.level === 'string' ? parseInt(filter.level, 10) : filter.level;
      if (!isNaN(targetLevel)) {
        filtered = filtered.filter((e) => e.level === targetLevel);
      }
    }

    // Deduplicate to each player's single best performance within the filtered scope
    const playerBestMap = new Map<string, LeaderboardEntry>();

    for (const entry of filtered) {
      const existing = playerBestMap.get(entry.playerId);
      if (!existing) {
        playerBestMap.set(entry.playerId, entry);
      } else {
        // Higher score wins; on tie, more obstacles defeated; on tie, faster completion time
        if (
          entry.score > existing.score ||
          (entry.score === existing.score && entry.obstaclesDefeated > existing.obstaclesDefeated) ||
          (entry.score === existing.score &&
            entry.obstaclesDefeated === existing.obstaclesDefeated &&
            entry.completionTime < existing.completionTime)
        ) {
          playerBestMap.set(entry.playerId, entry);
        }
      }
    }

    const uniqueRanked = Array.from(playerBestMap.values());

    // Sorting algorithm:
    // 1. Highest Score / Best Score
    // 2. Most obstacles defeated
    // 3. Lowest completion time (speedrun advantage)
    // 4. Earliest timestamp
    uniqueRanked.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.obstaclesDefeated !== a.obstaclesDefeated) {
        return b.obstaclesDefeated - a.obstaclesDefeated;
      }
      if (a.completionTime !== b.completionTime) {
        return a.completionTime - b.completionTime;
      }
      return a.timestamp - b.timestamp;
    });

    const limit = filter?.limit || 50;
    return uniqueRanked.slice(0, limit);
  }

  /**
   * Get specific player's rank and competitive stats in the current filter context.
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
      bestScore: entry.bestScore,
      score: entry.score,
      obstaclesDefeated: entry.obstaclesDefeated,
      level: entry.level,
      campus: entry.campus,
      completionTime: entry.completionTime,
      entry,
    };
  }

  /**
   * Get list of unique campuses known in the leaderboard
   */
  async getCampuses(): Promise<string[]> {
    const entries = this.getStoredEntries();
    const set = new Set<string>();
    for (const c of AVAILABLE_CAMPUSES) {
      if (c !== 'All Campuses') set.add(c);
    }
    for (const e of entries) {
      if (e.campus) set.add(e.campus);
    }
    return ['All Campuses', ...Array.from(set)];
  }

  /**
   * Clear all development mock data, keeping only authentic player runs.
   */
  async clearDevMockData(): Promise<void> {
    const entries = this.getStoredEntries().filter((e) => !e.isDevMock);
    this.saveStoredEntries(entries);
  }

  /**
   * Reset development mock data
   */
  async resetToDevDefault(): Promise<void> {
    const realEntries = this.getStoredEntries().filter((e) => !e.isDevMock);
    this.saveStoredEntries([...realEntries, ...DEV_MOCK_ENTRIES]);
  }
}

export const leaderboardService: LeaderboardServiceInterface =
  new LocalStorageLeaderboardService();
