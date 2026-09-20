import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Screen, PlayerProfile, LevelConfig, GameNotification } from './types';
import { INITIAL_PLAYER, INITIAL_LEVELS } from './data/gameData';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { WorldMapScreen } from './components/WorldMapScreen';
import { BattlefieldScreen } from './components/BattlefieldScreen';
import { VictoryModal } from './components/VictoryModal';
import { PowersScreen } from './components/PowersScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { RewardsScreen } from './components/RewardsScreen';
import { AuthScreen } from './components/AuthScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileModal } from './components/ProfileModal';
import { SocialModal } from './components/SocialModal';
import { NotificationsModal } from './components/NotificationsModal';
import { Toast } from './components/Toast';
import { playSound } from './utils/sound';
import { storageService } from './services/storageService';
import { leaderboardService } from './services/leaderboardService';
import { authService } from './services/authService';
import { playerService, DEFAULT_PLAYER_STATS } from './services/playerService';
import { socialService } from './services/socialService';

const EMPTY_PLAYER: PlayerProfile = {
  id: '',
  name: 'Temple Warrior',
  displayName: 'Temple Warrior',
  ...DEFAULT_PLAYER_STATS,
};

export default function App() {
  // Authentication & Loading State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Core Game State
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [player, setPlayer] = useState<PlayerProfile>(() => storageService.loadPlayer());
  const [levels, setLevels] = useState<LevelConfig[]>(() => storageService.loadLevels());
  const [activeLevelId, setActiveLevelId] = useState<number>(3);
  const [battleLevelId, setBattleLevelId] = useState<number>(3);

  // Social & Notifications State
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);

  const showToast = useCallback((message: string, icon: string = 'check_circle') => {
    setToast({ message, icon });
  }, []);

  // Victory Dialog state
  const [victoryData, setVictoryData] = useState<{
    isOpen: boolean;
    score: number;
    movesLeft: number;
    stars: number;
  }>({
    isOpen: false,
    score: 0,
    movesLeft: 0,
    stars: 3,
  });

  // Daily quest state
  const [questProgress, setQuestProgress] = useState<number>(18);
  const [questClaimed, setQuestClaimed] = useState<boolean>(false);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh notifications callback
  const refreshNotifications = useCallback(async () => {
    if (!player.id) return;
    try {
      const notifs = await socialService.getNotifications(player.id);
      setNotifications(notifs);
    } catch (e) {
      console.warn('Could not fetch notifications:', e);
    }
  }, [player.id]);

  // Load player profile and levels from Firestore for the given user
  const loadPlayerDataFromFirestore = useCallback(async (user: User) => {
    try {
      // 1. Fetch player profile from Firestore
      let profile = await playerService.getPlayerProfile(user.uid);
      if (!profile) {
        // Retry a few times in case registerPlayer is currently writing the profile document
        for (let i = 0; i < 4 && !profile; i++) {
          await new Promise((res) => setTimeout(res, 350));
          profile = await playerService.getPlayerProfile(user.uid);
        }
      }
      if (!profile) {
        // First-time player record initialization fallback
        profile = await playerService.createPlayerProfile(
          user.uid,
          user.displayName || 'Temple Warrior',
          user.email || ''
        );
      }

      setPlayer(profile);
      storageService.savePlayer(profile);

      // 2. Fetch player's level progress
      const loadedLevels = await playerService.loadLevelsForPlayer(user.uid);
      setLevels(loadedLevels);
      storageService.saveLevels(loadedLevels);

      // 3. Set active level to player's current unlocked level
      const currentHighest = Math.min(10, profile.currentLevel || 1);
      setActiveLevelId(currentHighest);
      setBattleLevelId(currentHighest);

      // 4. Fetch notifications
      const notifs = await socialService.getNotifications(user.uid);
      setNotifications(notifs);
    } catch (e) {
      console.error('Error loading player data from Firestore:', e);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadPlayerDataFromFirestore(user);
      } else {
        // Clear local storage and reset in-memory state for fresh account isolation
        storageService.clearProgress();
        setPlayer(EMPTY_PLAYER);
        setLevels(INITIAL_LEVELS.map((l) => ({ ...l, isUnlocked: l.id === 1, starsEarned: 0, highScore: 0 })));
        setNotifications([]);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [loadPlayerDataFromFirestore]);

  // Fallback local persistence
  useEffect(() => {
    if (player.id) {
      storageService.savePlayer(player);
    }
  }, [player]);

  useEffect(() => {
    storageService.saveLevels(levels);
  }, [levels]);

  // Handle successful login or registration from AuthScreen
  const handleAuthSuccess = async (authenticatedPlayer: PlayerProfile) => {
    setPlayer(authenticatedPlayer);
    storageService.savePlayer(authenticatedPlayer);
    if (authenticatedPlayer.id) {
      const loadedLevels = await playerService.loadLevelsForPlayer(authenticatedPlayer.id);
      setLevels(loadedLevels);
      storageService.saveLevels(loadedLevels);
      setActiveLevelId(authenticatedPlayer.currentLevel || 1);
      setBattleLevelId(authenticatedPlayer.currentLevel || 1);
      const notifs = await socialService.getNotifications(authenticatedPlayer.id);
      setNotifications(notifs);
    }
    setCurrentScreen('home');
  };

  // Handle Logout
  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsAuthLoading(true);
    try {
      await authService.logout();
      storageService.clearProgress();
      setPlayer(EMPTY_PLAYER);
      setLevels(INITIAL_LEVELS.map((l) => ({ ...l, isUnlocked: l.id === 1, starsEarned: 0, highScore: 0 })));
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Start battle on specific level
  const handleStartBattle = (levelId: number) => {
    setBattleLevelId(levelId);
    setActiveLevelId(levelId);
    setCurrentScreen('battle');
  };

  // Victory callback from Battlefield
  const handleBattleVictory = async (
    finalScore: number,
    movesLeft: number,
    starsEarned: number,
    obstaclesDefeatedCount?: number,
    completionTimeSeconds?: number
  ) => {
    // Determine power unlock progression based on cleared level
    const newPowers = [...(player.unlockedPowers || ['trident'])];
    if (battleLevelId >= 2 && !newPowers.includes('mushak')) {
      newPowers.push('mushak');
    }
    if (battleLevelId >= 4 && !newPowers.includes('lotus')) {
      newPowers.push('lotus');
    }
    if (battleLevelId >= 6 && !newPowers.includes('diya')) {
      newPowers.push('diya');
    }
    if (battleLevelId >= 9 && !newPowers.includes('chant')) {
      newPowers.push('chant');
    }

    const calculatedBestScore = Math.max(player.highScore || 0, finalScore);
    const obstaclesCount =
      obstaclesDefeatedCount ??
      (levels.find((l) => l.id === battleLevelId)?.vighnasToDefeat || 3);
    const timeTaken = completionTimeSeconds ?? 45;
    const uniqueSubmissionId = `sub_lvl${battleLevelId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Prepare updated player state
    const updatedPlayer: PlayerProfile = {
      ...player,
      coins: player.coins + 250,
      stars: Math.min(30, player.stars + starsEarned),
      highScore: calculatedBestScore,
      totalScore: (player.totalScore || 0) + finalScore,
      currentLevel: Math.max(player.currentLevel, battleLevelId + 1),
      unlockedPowers: newPowers,
    };

    setPlayer(updatedPlayer);

    // Prepare updated level configurations
    const updatedLevels = levels.map((lvl) => {
      if (lvl.id === battleLevelId) {
        return {
          ...lvl,
          starsEarned: Math.max(lvl.starsEarned, starsEarned),
          highScore: Math.max(lvl.highScore, finalScore),
        };
      }
      if (lvl.id === battleLevelId + 1) {
        return { ...lvl, isUnlocked: true };
      }
      return lvl;
    });

    setLevels(updatedLevels);

    // Save to Firestore permanently under player's cloud profile
    if (player.id) {
      playerService.recordLevelVictory(
        player.id,
        battleLevelId,
        finalScore,
        starsEarned,
        updatedLevels,
        updatedPlayer
      );
    }

    // Submit authentic score to Firestore Leaderboard
    leaderboardService.submitScore({
      submissionId: uniqueSubmissionId,
      playerId: player.id || 'player_temp',
      playerName: player.displayName || player.name || 'Temple Warrior',
      level: battleLevelId,
      score: finalScore,
      obstaclesDefeated: obstaclesCount,
      bestScore: calculatedBestScore,
      completionTime: timeTaken,
    });

    // Update quest progress
    setQuestProgress((q) => Math.min(25, q + 8));

    // Show celebratory modal
    setVictoryData({
      isOpen: true,
      score: finalScore,
      movesLeft,
      stars: starsEarned,
    });
  };

  // Next level from victory modal
  const handleNextLevel = () => {
    setVictoryData((prev) => ({ ...prev, isOpen: false }));
    const nextId = Math.min(10, battleLevelId + 1);
    setBattleLevelId(nextId);
    setActiveLevelId(nextId);
    setCurrentScreen('battle');
  };

  // Replay current battle
  const handleReplay = () => {
    setVictoryData((prev) => ({ ...prev, isOpen: false }));
    setCurrentScreen('battle');
  };

  // Return to home/map from victory
  const handleVictoryClose = () => {
    setVictoryData((prev) => ({ ...prev, isOpen: false }));
    setCurrentScreen('map');
  };

  // Defeat handler
  const handleBattleDefeat = () => {
    const newLives = Math.max(0, player.lives - 1);
    setPlayer((prev) => ({ ...prev, lives: newLives }));
    if (player.id) {
      playerService.deductLife(player.id, player.lives);
    }
    setCurrentScreen('map');
  };

  // Toggle sound
  const handleToggleSound = () => {
    setPlayer((prev) => {
      const next = !prev.soundEnabled;
      if (prev.id) {
        playerService.savePlayerProfile(prev.id, { soundEnabled: next });
      }
      return { ...prev, soundEnabled: next };
    });
  };

  // Toggle motion
  const handleToggleMotion = () => {
    setPlayer((prev) => {
      const next = !prev.reducedMotion;
      if (next) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
      if (prev.id) {
        playerService.savePlayerProfile(prev.id, { reducedMotion: next });
      }
      return { ...prev, reducedMotion: next };
    });
  };

  // Upgrade power
  const handleUpgradePower = (powerKey: string, cost: number) => {
    if (player.coins >= cost) {
      const newCoins = player.coins - cost;
      setPlayer((prev) => {
        const updated = { ...prev, coins: newCoins };
        if (prev.id) {
          playerService.savePlayerProfile(prev.id, { coins: newCoins });
        }
        return updated;
      });
    }
  };

  // Add coins
  const handleAddCoins = (amount: number) => {
    setPlayer((prev) => {
      const newCoins = prev.coins + amount;
      const updated = { ...prev, coins: newCoins };
      storageService.savePlayer(updated);
      if (prev.id) {
        playerService.savePlayerProfile(prev.id, { coins: newCoins });
      }
      return updated;
    });
  };

  // Claim one-time reward tier and persist to storage and Firestore
  const handleClaimReward = (tierId: string, coins: number, hearts: number = 0) => {
    setPlayer((prev) => {
      const currentClaimed = prev.claimedRewards || [];
      if (currentClaimed.includes(tierId)) {
        return prev;
      }
      const updatedClaimed = [...currentClaimed, tierId];
      const newCoins = prev.coins + coins;
      const newLives = Math.min(prev.maxLives, prev.lives + hearts);
      const updated: PlayerProfile = {
        ...prev,
        coins: newCoins,
        lives: newLives,
        claimedRewards: updatedClaimed,
      };
      storageService.savePlayer(updated);
      if (prev.id) {
        playerService.savePlayerProfile(prev.id, {
          coins: newCoins,
          lives: newLives,
          claimedRewards: updatedClaimed,
        });
      }
      return updated;
    });
    showToast(`Prasadam Claimed! +${coins} Coins`, 'card_giftcard');
  };

  // Handle free spin completion and persist 24h cooldown timestamp
  const handleSpinComplete = (prizeCoins: number, spinTimestamp: number) => {
    setPlayer((prev) => {
      const newCoins = prev.coins + prizeCoins;
      const updated: PlayerProfile = {
        ...prev,
        coins: newCoins,
        lastSpinTime: spinTimestamp,
      };
      storageService.savePlayer(updated);
      if (prev.id) {
        playerService.savePlayerProfile(prev.id, {
          coins: newCoins,
          lastSpinTime: spinTimestamp,
        });
      }
      return updated;
    });
  };

  // Claim daily quest
  const handleClaimQuest = () => {
    if (!questClaimed && questProgress >= 25) {
      setQuestClaimed(true);
      handleAddCoins(100);
    }
  };

  // 1. Initial Authentication & Profile Loading Screen
  if (isAuthLoading) {
    return (
      <LoadingScreen
        message="CONNECTING SACRED PANDAL... 🪔"
        subMessage="Syncing your player journey with Cloud Firestore..."
      />
    );
  }

  // 2. Unauthenticated Screen -> Show AuthScreen
  if (!currentUser) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        soundEnabled={player.soundEnabled}
      />
    );
  }

  const currentLevelConfig = levels.find((l) => l.id === battleLevelId) || levels[2];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isFreeSpinAvailable =
    !player.lastSpinTime || Date.now() - player.lastSpinTime >= 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen w-full bg-[#140120] text-[#fff9ef] flex flex-col items-center relative overflow-x-hidden font-body touch-pan-y">
      {/* Background Decorative Temple Halo */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_15%,#3a0e4f_0%,#180126_60%,#0e0017_100%)] z-0" />

      {/* Screen Frame Container */}
      <div className="relative z-10 w-full max-w-[480px] min-h-screen min-h-[100dvh] flex flex-col bg-[#1c012d] shadow-[0_0_60px_rgba(0,0,0,0.9)] border-x border-[#ff6f00]/20 touch-pan-y">
        {/* Global Header */}
        {currentScreen !== 'battle' && (
          <Header
            currentScreen={currentScreen}
            onNavigate={(s) => setCurrentScreen(s)}
            player={player}
            onToggleSound={handleToggleSound}
            onToggleMotion={handleToggleMotion}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenSocial={() => setIsSocialOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadCount={unreadCount}
            isOnline={isOnline}
          />
        )}

        {/* Main Content View Switcher */}
        <main className={`flex-1 flex flex-col w-full touch-pan-y ${currentScreen !== 'battle' ? 'pt-[calc(3.5rem+max(env(safe-area-inset-top,0px),12px))] sm:pt-[calc(4rem+max(env(safe-area-inset-top,0px),12px))]' : ''}`}>
          {currentScreen === 'home' && (
            <HomeScreen
              player={player}
              activeLevel={currentLevelConfig}
              onStartBattle={handleStartBattle}
              onNavigate={(s) => setCurrentScreen(s)}
              onClaimQuest={handleClaimQuest}
              questClaimed={questClaimed}
              questProgress={questProgress}
            />
          )}

          {currentScreen === 'map' && (
            <WorldMapScreen
              levels={levels}
              activeLevelId={activeLevelId}
              player={player}
              onSelectLevel={(id) => setActiveLevelId(id)}
              onStartBattle={handleStartBattle}
            />
          )}

          {currentScreen === 'battle' && (
            <BattlefieldScreen
              level={currentLevelConfig}
              player={player}
              onVictory={handleBattleVictory}
              onDefeat={handleBattleDefeat}
              onExit={() => setCurrentScreen('map')}
            />
          )}

          {currentScreen === 'powers' && (
            <PowersScreen player={player} onUpgradePower={handleUpgradePower} />
          )}

          {currentScreen === 'ranks' && <LeaderboardScreen player={player} />}

          {currentScreen === 'rewards' && (
            <RewardsScreen
              player={player}
              onAddCoins={handleAddCoins}
              onClaimReward={handleClaimReward}
              onSpinComplete={handleSpinComplete}
            />
          )}
        </main>

        {/* Global Bottom Navigation Bar */}
        {currentScreen !== 'battle' && (
          <Navbar
            currentScreen={currentScreen}
            onNavigate={(s) => setCurrentScreen(s)}
            soundEnabled={player.soundEnabled}
            isFreeSpinAvailable={isFreeSpinAvailable}
          />
        )}

        {/* Victory Celebration Modal */}
        {victoryData.isOpen && (
          <VictoryModal
            score={victoryData.score}
            movesLeft={victoryData.movesLeft}
            starsEarned={victoryData.stars}
            soundEnabled={player.soundEnabled}
            onNextLevel={handleNextLevel}
            onReplay={handleReplay}
            onGoHome={handleVictoryClose}
          />
        )}

        {/* Player Profile Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          player={player}
          onUpdatePlayer={(updated) => setPlayer(updated)}
          onLogout={handleLogout}
        />

        {/* Social & Friends Modal */}
        <SocialModal
          isOpen={isSocialOpen}
          onClose={() => setIsSocialOpen(false)}
          player={player}
          onShowToast={showToast}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          player={player}
          notifications={notifications}
          onRefreshNotifications={refreshNotifications}
          onUpdatePlayer={(updated) => setPlayer(updated)}
          onShowToast={showToast}
        />

        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            icon={toast.icon}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
