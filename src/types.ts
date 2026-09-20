export type Screen = 'home' | 'map' | 'battle' | 'powers' | 'ranks' | 'rewards';

export type ModakType = 
  | 'kesar'      // Golden saffron flame
  | 'gulab'      // Rose lotus pink
  | 'tulsi'      // Sacred green basil
  | 'neel'       // Sapphire blue chakra/cyclone
  | 'manek'      // Purple amethyst diamond
  | 'surya'      // Yellow sun
  | 'special_chakra'   // 4-match 4-way beam / row-col clear
  | 'special_trishul'  // 5-match rainbow modak
  | 'special_surya_blast'; // L/T match area blast

export interface ModakTile {
  id: string;
  row: number;
  col: number;
  type: ModakType;
  isMatched?: boolean;
  isSpecial?: boolean;
  specialType?: 'chakra' | 'trishul' | 'blast';
  isRooted?: boolean;
  isClearing?: boolean;
  dropDistance?: number;
}

export type VighnaDistance = 'far' | 'med' | 'close' | 'boundary';

export interface VighnaEnemy {
  id: string;
  name: string;
  type: 'wisp' | 'thorn' | 'captain' | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  distance: VighnaDistance;
  img: string;
  isShielded?: boolean;
  isDefeated?: boolean;
  progress: number; // 0 (far right portal) to 100 (pandal boundary)
  lane: number; // 0, 1, 2 for vertical lane separation
  attackPower?: number; // Pandal protection damage per strike
  isAttacking?: boolean;
  attackCooldown?: number;
}

export type ObjectiveType = 
  | 'defeat_obstacles'
  | 'score'
  | 'create_specials'
  | 'defeat_strong'
  | 'move_limit'
  | 'survive'
  | 'boss'
  | 'boss_defeat'
  | 'clear_roots';

export interface LevelConfig {
  id: number;
  levelNumber: number;
  boardSize: number;
  targetScore: number;
  obstaclesRequired: number;
  vighnasToDefeat: number;
  obstacleHealth: number;
  obstacleSpeed: 'slow' | 'medium' | 'fast' | number;
  maxMoves: number;
  moveLimit: number;
  timeLimit: number;
  availablePowers: string[];
  objectiveType: ObjectiveType;
  specialsRequired?: number;
  title: string;
  subtitle: string;
  landmarkTitle: string;
  landmarkSub: string;
  isBossLevel?: boolean;
  isMiniBoss?: boolean;
  hasRootedTiles?: boolean;
  allowedColors?: ModakType[];
  starsEarned: number; // 0-3
  highScore: number;
  isUnlocked: boolean;
  description: string;
  bannerImg: string;
  powerUnlockName?: string;
}

export interface PlayerProfile {
  id?: string;
  name: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  lives: number;
  maxLives: number;
  coins: number;
  stars: number;
  currentLevel: number;
  highestLevel: number;
  totalScore: number;
  streakDays: number;
  pranaEnergy: number;
  maxPrana: number;
  highScore: number;
  unlockedPowers: string[]; // ['trident', 'mushak', 'lotus', 'diya', 'chant']
  tridentLevel: number;
  lotusLevel: number;
  mushakLevel: number;
  diyaLevel: number;
  soundEnabled: boolean;
  reducedMotion: boolean;
  achievements?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LevelProgressRecord {
  id?: string;
  playerId: string;
  levelId: number;
  completed: boolean;
  stars: number;
  bestScore: number;
  highScore: number;
  unlocked: boolean;
  bestCombo?: number;
  updatedAt?: string;
}

export interface FriendRecord {
  id: string;
  playerId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  friendLevel?: number;
  friendStars?: number;
  highScore?: number;
  isOnline?: boolean;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface LifeRequest {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  senderId?: string; // backwards compatibility
  senderName: string;
  receiverId?: string; // backwards compatibility
  receiverName: string;
  type?: 'life';
  status: 'pending' | 'sent' | 'claimed' | 'ignored';
  createdAt: string;
}

export interface FriendInvite {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  toPlayerName: string;
  toPlayerAvatar?: string;
  status: 'invited' | 'accepted';
  createdAt: string;
}

export interface GameNotification {
  id: string;
  recipientId: string;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'life_request'
    | 'life_sent'
    | 'friend_invite'
    | 'achievement'
    | 'high_score'
    | 'power_unlocked';
  message: string;
  read: boolean;
  relatedPlayerId?: string;
  relatedPlayerName?: string;
  relatedGameData?: any;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  submissionId?: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  level: number;
  score: number;
  bestScore: number;
  obstaclesDefeated?: number;
  completionTime?: number; // in seconds
  timestamp?: number;
  isDevMock?: boolean;
}

export interface LeaderboardFilter {
  level?: number | 'all'; // 'all' or 1..10
  limit?: number;
}

export interface ScoreSubmission {
  submissionId: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  level: number;
  score: number;
  obstaclesDefeated: number;
  bestScore: number;
  completionTime: number; // in seconds
  timestamp?: number;
}

export interface PlayerRankResult {
  rank: number;
  totalPlayers: number;
  bestScore: number;
  score: number;
  obstaclesDefeated: number;
  level: number;
  completionTime: number;
  entry?: LeaderboardEntry;
}
