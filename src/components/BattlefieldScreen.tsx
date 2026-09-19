import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LevelConfig, PlayerProfile, ModakTile, ModakType, VighnaEnemy } from '../types';
import { ASSETS } from '../data/gameData';
import { playSound, playComboSound, playInvalidSwapSound } from '../utils/sound';
import {
  generateInitialBoard,
  detectMatches,
  applyGravityAndRefill,
  isAdjacent,
  handleSpecialSwap,
  hasLegalMoves,
  shuffleBoard,
  findPossibleMove,
  MatchResult,
} from '../game/matchEngine';
import { createObstacleWave, advanceObstacles } from '../game/obstacles';
import {
  MATCH_SCORES,
  PRANA_ENERGY,
  POWER_ENERGY_COSTS,
  COMBO_MULTIPLIERS,
  OBSTACLE_BREACH_PENALTY,
} from '../game/constants';
import { DefeatModal } from './DefeatModal';
import { AppIcon } from './AppIcon';

interface BattlefieldScreenProps {
  level: LevelConfig;
  player: PlayerProfile;
  onVictory: (
    finalScore: number,
    movesLeft: number,
    starsEarned: number,
    obstaclesDefeated?: number,
    completionTimeSeconds?: number
  ) => void;
  onDefeat: () => void;
  onExit: () => void;
}

export const BattlefieldScreen: React.FC<BattlefieldScreenProps> = ({
  level,
  player,
  onVictory,
  onDefeat,
  onExit,
}) => {
  // Core Game State
  const [score, setScore] = useState<number>(0);
  const [movesLeft, setMovesLeft] = useState<number>(level.moveLimit);
  const [vighnasDefeated, setVighnasDefeated] = useState<number>(0);
  const [pranaEnergy, setPranaEnergy] = useState<number>(35);
  const [protectionAura, setProtectionAura] = useState<number>(100);
  const [comboCount, setComboCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [screenShaking, setScreenShaking] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null);

  // Causality VFX states
  const [ganeshaStatus, setGaneshaStatus] = useState<
    | 'CALM GUARDIAN'
    | 'CHARGING PRANA!'
    | 'UNLEASHING TRIDENT!'
    | 'UNLEASHING DIVINE BLAST!'
    | 'UNLEASHING FESTIVAL LIGHT!'
    | 'GANESHA SMITE!'
    | 'SACRED COMBO!'
    | 'VIGHNA PURGED!'
  >('CALM GUARDIAN');
  const [tridentSurging, setTridentSurging] = useState<boolean>(false);
  const [activeProjectile, setActiveProjectile] = useState<{
    type: 'trident' | 'divine_blast' | 'festival_light';
    targetIds: string[];
  } | null>(null);
  const [hitEnemyIds, setHitEnemyIds] = useState<Set<string>>(new Set());
  const [defeatedEnemyIds, setDefeatedEnemyIds] = useState<Set<string>>(new Set());
  const isActivatingPowerRef = useRef<boolean>(false);
  const battleStartTimeRef = useRef<number>(Date.now());
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const didSwipeRef = useRef<boolean>(false);

  const [impactFloater, setImpactFloater] = useState<{ text: string; pts: string } | null>(null);
  const [pranaParticles, setPranaParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [floatingScores, setFloatingScores] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; icon: string } | null>(null);
  const [specialsCreated, setSpecialsCreated] = useState<number>(0);
  const [idleHint, setIdleHint] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [comboBanner, setComboBanner] = useState<{ level: number; text: string; id: number } | null>(null);

  // Progressive Power Unlocks based on level configuration
  const isTridentUnlocked = level.availablePowers ? level.availablePowers.includes('trident') : true;
  const isDivineBlastUnlocked = level.availablePowers
    ? level.availablePowers.includes('divine_blast')
    : player.currentLevel >= 2 || player.unlockedPowers?.includes('divine_blast');
  const isFestivalLightUnlocked = level.availablePowers
    ? level.availablePowers.includes('festival_light')
    : player.currentLevel >= 3 || player.unlockedPowers?.includes('festival_light');

  // Tile Selection & Swipe Handling
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number; id: string } | null>(null);
  const pointerStartRef = useRef<{ row: number; col: number; x: number; y: number } | null>(null);

  // Real Obstacles State
  const [activeEnemies, setActiveEnemies] = useState<VighnaEnemy[]>([]);
  const enemyWaveQueueRef = useRef<VighnaEnemy[]>([]);

  // 7x7 Modak Board
  const [board, setBoard] = useState<ModakTile[][]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [swapAnimation, setSwapAnimation] = useState<{
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    phase: 'forward' | 'backward';
  } | null>(null);

  // Show Toast Feedback
  const showToast = useCallback((text: string, icon: string = 'info') => {
    setToastMessage({ text, icon });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2000);
  }, []);

  // Initialize Game on level change / start
  const initializeGame = useCallback(() => {
    setScore(0);
    setMovesLeft(level.moveLimit);
    setVighnasDefeated(0);
    setPranaEnergy(0);
    setProtectionAura(100);
    setComboCount(1);
    setIsProcessing(false);
    setGameOver(null);
    setGaneshaStatus('CALM GUARDIAN');
    setTridentSurging(false);
    setActiveProjectile(null);
    setHitEnemyIds(new Set());
    setDefeatedEnemyIds(new Set());
    isActivatingPowerRef.current = false;
    setImpactFloater(null);
    setSelectedTile(null);
    setSwapAnimation(null);
    setIdleHint(null);
    setComboBanner(null);
    lastInteractionTimeRef.current = Date.now();

    // Generate Guaranteed Legal, Non-Matching Initial Board respecting level color pool
    const newBoard = generateInitialBoard(level.hasRootedTiles, level.allowedColors);
    setBoard(newBoard);

    // Initialize Obstacle Wave Queue
    battleStartTimeRef.current = Date.now();
    const fullWave = createObstacleWave(level);
    const initialActive = fullWave.slice(0, 3);
    // Ensure the first active has 'boundary' distance
    if (initialActive.length > 0) {
      initialActive[0].distance = 'boundary';
    }
    if (initialActive.length > 1) {
      initialActive[1].distance = 'med';
    }
    if (initialActive.length > 2) {
      initialActive[2].distance = 'far';
    }
    setActiveEnemies(initialActive);
    enemyWaveQueueRef.current = fullWave.slice(3);

    showToast(`LEVEL ${level.id} • DEFURGE ${level.vighnasToDefeat} VIGHNAS!`, 'temple_hindu');
  }, [level, showToast]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Spawns floating score text at coordinates
  const spawnScoreFloater = (x: number, y: number, text: string) => {
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== id));
    }, 900);
  };

  // Spawns prana particles arcing up from board to Ganesha
  const spawnPranaParticles = () => {
    if (player.reducedMotion) return;
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 130 + (Math.random() * 90 - 45),
      y: 200 + (Math.random() * 40 - 20),
    }));
    setPranaParticles(newParticles);
    setTimeout(() => setPranaParticles([]), 900);
  };

  // Inflict damage to critical enemy
  const damageActiveEnemy = useCallback(
    (damage: number, customLabel?: string) => {
      setActiveEnemies((prevEnemies) => {
        if (prevEnemies.length === 0) return prevEnemies;
        const target = prevEnemies[0];
        const newHp = Math.max(0, target.hp - damage);
        const isShieldShattered = target.isShielded;
        const updatedTarget = { ...target, hp: newHp, isShielded: false };

        if (newHp <= 0) {
          // Obstacle Defeated!
          playSound('impact', player.soundEnabled);
          setImpactFloater({
            text: customLabel || 'VIGHNA PURGED!',
            pts: `+${MATCH_SCORES.OBSTACLE_DEFEAT} PTS`,
          });
          setScore((s) => s + MATCH_SCORES.OBSTACLE_DEFEAT);

          setVighnasDefeated((count) => {
            const nextCount = count + 1;
            if (nextCount >= level.vighnasToDefeat) {
              // Level Victory Condition Met!
              setTimeout(() => {
                setGameOver('won');
                playSound('victory', player.soundEnabled);
                // Calculate stars
                const starScore = score + MATCH_SCORES.OBSTACLE_DEFEAT + movesLeft * MATCH_SCORES.MOVES_REMAINING_BONUS;
                const stars = starScore >= level.targetScore ? 3 : starScore >= level.targetScore * 0.7 ? 2 : 1;
                const completionTime = Math.max(1, Math.round((Date.now() - battleStartTimeRef.current) / 1000));
                onVictory(starScore, movesLeft, stars, nextCount, completionTime);
              }, 1000);
            }
            return nextCount;
          });

          // Next enemy moves into boundary lane from med or queue
          setTimeout(() => {
            setActiveEnemies((cur) => {
              const remaining = cur.slice(1);
              if (remaining.length > 0) {
                remaining[0] = { ...remaining[0], distance: 'boundary' };
              }
              if (enemyWaveQueueRef.current.length > 0) {
                const nextFromQueue = enemyWaveQueueRef.current.shift()!;
                nextFromQueue.distance = 'far';
                remaining.push(nextFromQueue);
              }
              return remaining;
            });
          }, 350);

          return [updatedTarget, ...prevEnemies.slice(1)];
        } else {
          // Damaged but still standing
          playSound('impact', player.soundEnabled);
          setImpactFloater({
            text: isShieldShattered ? 'SHIELD SHATTERED!' : customLabel || 'STRUCK!',
            pts: `-${damage} HP`,
          });
          return [updatedTarget, ...prevEnemies.slice(1)];
        }
      });
    },
    [level.targetScore, level.vighnasToDefeat, movesLeft, onVictory, player.soundEnabled, score]
  );

  // Complete Causality Match Resolution Loop with Gravity & Cascades
  const resolveBoardMatches = useCallback(
    async (currentBoard: ModakTile[][], initialMatch: MatchResult, cascadeLevel: number = 1) => {
      setIsProcessing(true);

      // 1. Matched tiles pop with ascending sound & burst animation
      if (cascadeLevel > 1) {
        playComboSound(cascadeLevel, player.soundEnabled);
      } else {
        playSound('pop', player.soundEnabled);
      }

      // Mark matched tiles as clearing and cleanse roots if any
      setBoard((prev) =>
        prev.map((row) =>
          row.map((tile) =>
            initialMatch.matchedTileIds.has(tile.id)
              ? { ...tile, isRooted: false, isClearing: true, isMatched: true }
              : tile
          )
        )
      );

      // 2. Score & Prana calculations (awarded exactly once per match)
      const comboMult = COMBO_MULTIPLIERS[Math.min(cascadeLevel - 1, COMBO_MULTIPLIERS.length - 1)];
      const addedScore = Math.round(initialMatch.scoreGained * comboMult);
      const addedEnergy = initialMatch.energyGained + (cascadeLevel > 1 ? PRANA_ENERGY.CASCADE_BONUS : 0);

      setScore((s) => s + addedScore);
      setPranaEnergy((p) => Math.min(100, p + addedEnergy));
      setComboCount(cascadeLevel);

      // Combo announcement banner
      if (cascadeLevel > 1) {
        const comboNames = ['', 'NICE! ×2 COMBO', 'GREAT! ×3 COMBO 🔥', 'AMAZING! ×4 COMBO ⚡', 'DIVINE BLESSING! ×5 🕉️'];
        const text = cascadeLevel < comboNames.length ? comboNames[cascadeLevel] : `UNSTOPPABLE! ×${cascadeLevel} COMBO 🌟`;
        const bannerId = Date.now();
        setComboBanner({ level: cascadeLevel, text, id: bannerId });
        setTimeout(() => {
          setComboBanner((curr) => (curr?.id === bannerId ? null : curr));
        }, 1200);
      }

      // Track specials created for objective
      if (initialMatch.specialPiecesToCreate.length > 0) {
        setSpecialsCreated((prev) => {
          const nextCount = prev + initialMatch.specialPiecesToCreate.length;
          if (level.objectiveType === 'create_specials' && nextCount >= (level.specialsRequired || 5)) {
            setTimeout(() => {
              setGameOver('won');
              playSound('victory', player.soundEnabled);
              const finalScore = score + addedScore + movesLeft * MATCH_SCORES.MOVES_REMAINING_BONUS;
              const stars = finalScore >= level.targetScore ? 3 : finalScore >= level.targetScore * 0.7 ? 2 : 1;
              const completionTime = Math.max(1, Math.round((Date.now() - battleStartTimeRef.current) / 1000));
              onVictory(finalScore, movesLeft, stars, vighnasDefeated, completionTime);
            }, 800);
          }
          return nextCount;
        });
      }

      // Check score objective win condition
      if (level.objectiveType === 'score' && score + addedScore >= level.targetScore) {
        setTimeout(() => {
          setGameOver('won');
          playSound('victory', player.soundEnabled);
          const finalScore = score + addedScore + movesLeft * MATCH_SCORES.MOVES_REMAINING_BONUS;
          const stars = finalScore >= level.targetScore ? 3 : 2;
          const completionTime = Math.max(1, Math.round((Date.now() - battleStartTimeRef.current) / 1000));
          onVictory(finalScore, movesLeft, stars, vighnasDefeated, completionTime);
        }, 800);
      }

      // Spawn floating score text
      spawnScoreFloater(180, 260, `+${addedScore} PTS ${cascadeLevel > 1 ? `• ×${comboMult}` : ''}`);

      // 3. Divine Prana streams to Lord Ganesha
      spawnPranaParticles();
      setGaneshaStatus('CHARGING PRANA!');
      playSound('power', player.soundEnabled);

      // Ganesha Auto-Attack on High-Energy Matches or Special Piece Creations!
      if (initialMatch.energyGained >= 45 || initialMatch.specialPiecesToCreate.length > 0) {
        setGaneshaStatus('GANESHA SMITE!');
        setActiveProjectile({
          type: 'trident',
          targetIds: activeEnemies.length > 0 ? [activeEnemies[0].id] : [],
        });
        setTridentSurging(true);
        damageActiveEnemy(1, 'GANESHA SMITE!');
        setTimeout(() => {
          setActiveProjectile(null);
          setTridentSurging(false);
        }, 450);
      }

      if (pranaEnergy + addedEnergy >= 100 && pranaEnergy < 100) {
        showToast('⚡ DIVINE PRANA FULL! POWERS READY!', 'bolt');
      }

      await new Promise((r) => setTimeout(r, 220));
      setGaneshaStatus('CALM GUARDIAN');

      // 4. Apply Gravity & Refill (respecting level allowedColors)
      const refilledBoard = applyGravityAndRefill(
        currentBoard,
        initialMatch.matchedTileIds,
        initialMatch.specialPiecesToCreate,
        level.allowedColors
      );
      setBoard(refilledBoard);

      // Wait for falling drop animation to finish settling
      await new Promise((r) => setTimeout(r, 260));

      // Settle tiles: clear dropDistance so tiles rest peacefully in new positions
      const settledBoard = refilledBoard.map((row) =>
        row.map((tile) => ({ ...tile, dropDistance: 0 }))
      );
      setBoard(settledBoard);

      // Check clear_roots objective
      if (level.objectiveType === 'clear_roots') {
        const remainingRoots = settledBoard.flat().filter((t) => t.isRooted).length;
        if (remainingRoots === 0) {
          setTimeout(() => {
            setGameOver('won');
            playSound('victory', player.soundEnabled);
            const finalScore = score + addedScore + movesLeft * MATCH_SCORES.MOVES_REMAINING_BONUS;
            const stars = finalScore >= level.targetScore ? 3 : 2;
            const completionTime = Math.max(1, Math.round((Date.now() - battleStartTimeRef.current) / 1000));
            onVictory(finalScore, movesLeft, stars, vighnasDefeated, completionTime);
          }, 800);
        }
      }

      // 7. Check for Automatic Cascading Matches
      const cascadeMatches = detectMatches(settledBoard);
      if (cascadeMatches.matchedTileIds.size > 0 && cascadeLevel < 20) {
        // Continue cascade recursively!
        await resolveBoardMatches(settledBoard, cascadeMatches, cascadeLevel + 1);
      } else {
        // Cascade chain finished! Board is completely stable.
        // Step active obstacles closer
        setActiveEnemies((curEnemies) =>
          advanceObstacles(curEnemies, (breachingEnemy) => {
            // Obstacle breaches the festival boundary!
            playSound('defeat', player.soundEnabled);
            setProtectionAura((aura) => {
              const newAura = Math.max(0, aura - OBSTACLE_BREACH_PENALTY);
              if (newAura <= 0) {
                setGameOver('lost');
              }
              return newAura;
            });
            showToast(`BREACH RISK! ${breachingEnemy.name} hit the boundary!`, 'warning');
          })
        );

        // Check moves left for loss condition (only if game is not already won)
        setMovesLeft((moves) => {
          if (moves <= 0 && vighnasDefeated < level.vighnasToDefeat && gameOver !== 'won') {
            setGameOver('lost');
          }
          return moves;
        });

        // Validate legal moves on board; if none, shuffle until solvable!
        if (!hasLegalMoves(settledBoard)) {
          showToast('NO MOVES • SHUFFLING BOARD!', 'shuffle');
          playSound('shuffle', player.soundEnabled);
          const shuffled = shuffleBoard(settledBoard, level.allowedColors);
          setBoard(shuffled);
        }

        // Restore player input only after the full resolution sequence completes
        setIsProcessing(false);
      }
    },
    [
      activeEnemies,
      damageActiveEnemy,
      gameOver,
      level.allowedColors,
      level.objectiveType,
      level.specialsRequired,
      level.targetScore,
      level.vighnasToDefeat,
      movesLeft,
      onVictory,
      player.reducedMotion,
      player.soundEnabled,
      pranaEnergy,
      score,
      showToast,
      vighnasDefeated,
    ]
  );

  // EXECUTE TILE SWAP (DESKTOP CLICK, DRAG & MOBILE TOUCH)
  const executeSwap = useCallback(
    async (r1: number, c1: number, r2: number, c2: number) => {
      if (isProcessing || gameOver || swapAnimation) return;
      if (!isAdjacent({ row: r1, col: c1 }, { row: r2, col: c2 })) return;

      const t1 = board[r1]?.[c1];
      const t2 = board[r2]?.[c2];
      if (!t1 || !t2) return;
      if (t1.isRooted || t2.isRooted) {
        showToast('Rooted modak cannot be moved!', 'warning');
        return;
      }

      // User performed action: reset idle hint and record interaction
      setIdleHint(null);
      lastInteractionTimeRef.current = Date.now();

      // Block all user input immediately during swap and match resolution
      setIsProcessing(true);
      setSelectedTile(null);

      // Phase 1: Animate the two pieces moving toward each other's cell
      setSwapAnimation({ r1, c1, r2, c2, phase: 'forward' });
      await new Promise((r) => setTimeout(r, 190));

      // Check special power combos (Trishul or two special pieces swapped together)
      const isTrishulSwap = t1.type === 'special_trishul' || t2.type === 'special_trishul';
      const isDualSpecial = t1.isSpecial && t2.isSpecial;

      if (isTrishulSwap || isDualSpecial) {
        // Swap actual positions in the board array
        const swappedBoard = board.map((row) => row.map((tile) => ({ ...tile })));
        const newT1 = { ...t2, row: r1, col: c1 };
        const newT2 = { ...t1, row: r2, col: c2 };
        swappedBoard[r1][c1] = newT1;
        swappedBoard[r2][c2] = newT2;

        setSwapAnimation(null);
        setBoard(swappedBoard);
        playSound('power', player.soundEnabled);
        setMovesLeft((m) => Math.max(0, m - 1));

        const specialRes = handleSpecialSwap(swappedBoard, newT1, newT2);
        const matchPayload: MatchResult = {
          matchedTileIds: specialRes.matchedTileIds,
          scoreGained: specialRes.scoreGained,
          energyGained: specialRes.energyGained,
          specialPiecesToCreate: [],
          clearedModakCounts: {
            kesar: 0,
            gulab: 0,
            tulsi: 0,
            neel: 0,
            manek: 0,
            surya: 0,
            special_chakra: 0,
            special_trishul: 0,
            special_surya_blast: 0,
          },
        };
        await resolveBoardMatches(swappedBoard, matchPayload, 1);
        return;
      }

      // Check standard match on swapped board
      const swappedBoard = board.map((row) => row.map((tile) => ({ ...tile })));
      const newT1 = { ...t2, row: r1, col: c1 };
      const newT2 = { ...t1, row: r2, col: c2 };
      swappedBoard[r1][c1] = newT1;
      swappedBoard[r2][c2] = newT2;

      const matchResult = detectMatches(swappedBoard, { row: r2, col: c2 });

      if (matchResult.matchedTileIds.size === 0) {
        // INVALID SWAP:
        // Animate the swap back, restore original positions, do not deduct moves, do not award points
        playInvalidSwapSound(player.soundEnabled);
        setSwapAnimation({ r1, c1, r2, c2, phase: 'backward' });
        await new Promise((r) => setTimeout(r, 190));

        setSwapAnimation(null);
        setIsProcessing(false);
        return;
      }

      // VALID SWAP:
      // Permanently update actual positions, clear animation, deduct move, resolve matches
      playSound('swap', player.soundEnabled);
      setSwapAnimation(null);
      setBoard(swappedBoard);
      setMovesLeft((m) => Math.max(0, m - 1));

      await resolveBoardMatches(swappedBoard, matchResult, 1);
    },
    [board, gameOver, isProcessing, player.soundEnabled, resolveBoardMatches, showToast, swapAnimation]
  );

  // Idle Hint: after 3.8 seconds of inactivity, gently highlight a legal move
  useEffect(() => {
    if (isProcessing || gameOver || selectedTile) return;

    const timer = setInterval(() => {
      if (isProcessing || gameOver || selectedTile || idleHint) return;
      if (Date.now() - lastInteractionTimeRef.current >= 3800) {
        const possibleMove = findPossibleMove(board);
        if (possibleMove) {
          setIdleHint(possibleMove);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [board, gameOver, idleHint, isProcessing, selectedTile]);

  // Keyboard Arrow Navigation & Swap for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTile || isProcessing || gameOver) return;
      const { row, col } = selectedTile;
      if (e.key === 'ArrowUp' && row > 0) {
        e.preventDefault();
        executeSwap(row, col, row - 1, col);
      } else if (e.key === 'ArrowDown' && row < 6) {
        e.preventDefault();
        executeSwap(row, col, row + 1, col);
      } else if (e.key === 'ArrowLeft' && col > 0) {
        e.preventDefault();
        executeSwap(row, col, row, col - 1);
      } else if (e.key === 'ArrowRight' && col < 6) {
        e.preventDefault();
        executeSwap(row, col, row, col + 1);
      } else if (e.key === 'Escape') {
        setSelectedTile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTile, isProcessing, gameOver, executeSwap]);

  // Tile Click Interaction
  const handleTileClick = (tile: ModakTile) => {
    if (isProcessing || gameOver) return;
    setIdleHint(null);
    lastInteractionTimeRef.current = Date.now();
    playSound('click', player.soundEnabled);

    if (!selectedTile) {
      setSelectedTile({ row: tile.row, col: tile.col, id: tile.id });
    } else if (selectedTile.id === tile.id) {
      setSelectedTile(null);
    } else {
      // Check if adjacent
      if (isAdjacent(selectedTile, { row: tile.row, col: tile.col })) {
        executeSwap(selectedTile.row, selectedTile.col, tile.row, tile.col);
      } else {
        setSelectedTile({ row: tile.row, col: tile.col, id: tile.id });
      }
    }
  };

  // Pointer Down for Touch Swipe / Mouse Drag
  const handlePointerDown = (e: React.PointerEvent, tile: ModakTile) => {
    if (isProcessing || gameOver) return;
    setIdleHint(null);
    lastInteractionTimeRef.current = Date.now();
    didSwipeRef.current = false;
    pointerStartRef.current = {
      row: tile.row,
      col: tile.col,
      x: e.clientX,
      y: e.clientY,
    };
  };

  // Pointer Move for Instant Responsive Swipe
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || isProcessing || gameOver || didSwipeRef.current) return;

    const { row, col, x, y } = pointerStartRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Responsive 16px threshold for instant swipe execution
    if (dist >= 16) {
      didSwipeRef.current = true;
      pointerStartRef.current = null;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        const targetCol = dx > 0 ? col + 1 : col - 1;
        if (targetCol >= 0 && targetCol < 7) {
          executeSwap(row, col, row, targetCol);
        }
      } else {
        // Vertical swipe
        const targetRow = dy > 0 ? row + 1 : row - 1;
        if (targetRow >= 0 && targetRow < 7) {
          executeSwap(row, col, targetRow, col);
        }
      }
    }
  };

  // Pointer Up / End for Touch Swipe / Mouse Drag
  const handlePointerUp = (e: React.PointerEvent) => {
    if (didSwipeRef.current) {
      pointerStartRef.current = null;
      return;
    }
    if (!pointerStartRef.current || isProcessing || gameOver) {
      pointerStartRef.current = null;
      return;
    }

    const { row, col } = pointerStartRef.current;
    pointerStartRef.current = null;

    const tile = board[row]?.[col];
    if (tile) {
      handleTileClick(tile);
    }
  };

  // COMPLETE POWER & ATTACK SYSTEM (Trident, Divine Blast, Festival Light)
  const handleActivatePower = useCallback(
    async (powerType: 'trident' | 'divine_blast' | 'festival_light') => {
      // 1. Prevent duplicate activation & validate state
      if (isActivatingPowerRef.current || isProcessing || gameOver) {
        return;
      }
      if (pranaEnergy < 100) {
        showToast(`⚡ Need 100 Energy! Current: ${pranaEnergy}/100`, 'bolt');
        return;
      }

      // Check unlock requirements
      if (powerType === 'divine_blast' && !isDivineBlastUnlocked) {
        showToast('Unlock Divine Blast at Level 2!', 'lock');
        return;
      }
      if (powerType === 'festival_light' && !isFestivalLightUnlocked) {
        showToast('Unlock Festival Light at Level 3!', 'lock');
        return;
      }

      // Synchronous Lock (Rule 1 & 7)
      isActivatingPowerRef.current = true;
      setIsProcessing(true);
      setPranaEnergy(0);

      // Detect Target Obstacle(s) (Rule 4)
      let targetIds: string[] = [];
      if (powerType === 'trident') {
        const crit = activeEnemies.find((e) => e.distance === 'boundary' && e.hp > 0) || activeEnemies.find((e) => e.hp > 0);
        if (crit) targetIds = [crit.id];
      } else {
        // Divine Blast & Festival Light affect all active obstacles
        targetIds = activeEnemies.filter((e) => e.hp > 0).map((e) => e.id);
      }

      // 2. Play Ganesha power animation
      const statusText =
        powerType === 'trident'
          ? 'UNLEASHING TRIDENT!'
          : powerType === 'divine_blast'
          ? 'UNLEASHING DIVINE BLAST!'
          : 'UNLEASHING FESTIVAL LIGHT!';
      setGaneshaStatus(statusText as any);
      playSound(powerType === 'trident' ? 'trident' : 'power', player.soundEnabled);

      // 3. Create visible trident / divine-energy projectile from Ganesha side toward target obstacle
      setActiveProjectile({
        type: powerType,
        targetIds,
      });
      setTridentSurging(true);

      // Projectile flight duration
      await new Promise((res) => setTimeout(res, 480));

      // 5. Apply damage to real game state
      const damageAmount = powerType === 'trident' ? 3 : 2;
      setScreenShaking(true);
      setTimeout(() => setScreenShaking(false), 350);
      playSound('impact', player.soundEnabled);

      setHitEnemyIds(new Set(targetIds));
      setTimeout(() => setHitEnemyIds(new Set()), 400);

      let newlyDefeated = 0;
      let scoreGained = 0;
      const defeatedSet = new Set<string>();

      setActiveEnemies((prevEnemies) => {
        return prevEnemies.map((enemy) => {
          if (!targetIds.includes(enemy.id)) return enemy;
          const newHp = Math.max(0, enemy.hp - damageAmount);
          const isDead = newHp === 0;
          if (isDead && enemy.hp > 0) {
            newlyDefeated++;
            scoreGained += enemy.type === 'boss' ? MATCH_SCORES.BOSS_DEFEAT : MATCH_SCORES.OBSTACLE_DEFEAT;
            defeatedSet.add(enemy.id);
          }
          return {
            ...enemy,
            hp: newHp,
            isShielded: false,
            isDefeated: isDead,
          };
        });
      });

      setDefeatedEnemyIds(defeatedSet);

      const label =
        powerType === 'trident'
          ? 'DIVINE TRIDENT SMITE!'
          : powerType === 'divine_blast'
          ? 'DIVINE SHOCKWAVE BLAST!'
          : 'FESTIVAL LIGHT PURIFY!';

      setImpactFloater({
        text: label,
        pts: `-${damageAmount} HP ${newlyDefeated > 0 ? `• ${newlyDefeated} PURGED!` : ''}`,
      });

      // 6. If health reaches zero: defeat obstacle, increment obstaclesDefeated, award score, trigger defeat animation
      if (newlyDefeated > 0) {
        setScore((s) => s + scoreGained);
        setVighnasDefeated((prevCount) => {
          const nextCount = prevCount + newlyDefeated;
          if (nextCount >= level.vighnasToDefeat) {
            setTimeout(() => {
              setGameOver('won');
              playSound('victory', player.soundEnabled);
              const starScore = score + scoreGained + movesLeft * MATCH_SCORES.MOVES_REMAINING_BONUS;
              const stars = starScore >= level.targetScore ? 3 : starScore >= level.targetScore * 0.7 ? 2 : 1;
              const completionTime = Math.max(1, Math.round((Date.now() - battleStartTimeRef.current) / 1000));
              onVictory(starScore, movesLeft, stars, nextCount, completionTime);
            }, 900);
          }
          return nextCount;
        });
      }

      // If Power 3 (Festival Light): Clear selected central 3x3 section of modaks on the board
      if (powerType === 'festival_light') {
        await new Promise((res) => setTimeout(res, 200));
        const centerMatchedIds = new Set<string>();
        setBoard((prev) =>
          prev.map((row, r) =>
            row.map((tile, c) => {
              if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                centerMatchedIds.add(tile.id);
                return { ...tile, isClearing: true, isMatched: true, isRooted: false };
              }
              return tile;
            })
          )
        );
        playSound('pop', player.soundEnabled);
        setScore((s) => s + 250);
        spawnScoreFloater(180, 260, '+250 FESTIVAL LIGHT!');

        await new Promise((res) => setTimeout(res, 250));
        setBoard((prev) => applyGravityAndRefill(prev, centerMatchedIds));
      }

      // Wait for defeat animation (400ms)
      await new Promise((res) => setTimeout(res, 400));

      // Remove defeated obstacles and bring next ones from wave queue into active positions
      setActiveEnemies((cur) => {
        const remaining = cur.filter((e) => !defeatedSet.has(e.id));
        if (remaining.length > 0) remaining[0].distance = 'boundary';
        if (remaining.length > 1) remaining[1].distance = 'med';
        if (remaining.length > 2) remaining[2].distance = 'far';

        while (remaining.length < 3 && enemyWaveQueueRef.current.length > 0) {
          const next = enemyWaveQueueRef.current.shift()!;
          next.distance = remaining.length === 0 ? 'boundary' : remaining.length === 1 ? 'med' : 'far';
          remaining.push(next);
        }
        return remaining;
      });

      // Cleanup Visual FX
      setDefeatedEnemyIds(new Set());
      setActiveProjectile(null);
      setTridentSurging(false);
      setGaneshaStatus('CALM GUARDIAN');
      setTimeout(() => setImpactFloater(null), 1200);

      // 8. Re-enable gameplay
      isActivatingPowerRef.current = false;
      setIsProcessing(false);
    },
    [
      isProcessing,
      gameOver,
      pranaEnergy,
      isDivineBlastUnlocked,
      isFestivalLightUnlocked,
      player.soundEnabled,
      activeEnemies,
      level.vighnasToDefeat,
      level.targetScore,
      score,
      movesLeft,
      onVictory,
      showToast,
    ]
  );

  // SPECIAL BOSS CHANT BUTTON (Om Gam Ganapataye Namaha)
  const handleBossChant = () => {
    if (isProcessing || gameOver) return;
    if (pranaEnergy >= 100) {
      handleActivatePower('trident');
    } else {
      showToast(`⚡ Chant requires 100 Energy! (${pranaEnergy}/100)`, 'bolt');
    }
  };

  const criticalEnemy = activeEnemies.find((e) => e.distance === 'boundary') || activeEnemies[0] || {
    id: 'empty',
    name: 'Festival Secured',
    hp: 0,
    maxHp: 1,
    distance: 'boundary',
    img: ASSETS.vighnaCloud,
  };

  return (
    <div
      className={`flex-1 flex flex-col w-full max-w-[440px] mx-auto select-none overflow-x-hidden pb-4 ${
        screenShaking ? 'screen-shake-anim' : ''
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1c012d]/95 border border-[#ffdb3c]/60 text-[#ffe16d] px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <AppIcon name={toastMessage.icon} size={18} className="text-[#ffdb3c]" />
          <span className="font-body text-[11px] font-bold tracking-tight">{toastMessage.text}</span>
        </div>
      )}

      {/* Dynamic Floating Scores */}
      {floatingScores.map((fs) => (
        <div
          key={fs.id}
          className="fixed font-hud font-black text-[16px] text-[#ffdb3c] drop-shadow-[0_0_12px_#ffdb3c] pointer-events-none z-50 animate-bounce"
          style={{ left: `${fs.x}px`, top: `${fs.y}px` }}
        >
          {fs.text}
        </div>
      ))}

      {/* ================= TOP MINIMAL GAME HUD ================= */}
      <div className="w-full bg-[#1c012d]/95 backdrop-blur-md px-3 py-1.5 border-b border-[#ff6f00]/30 z-30">
        <div className="flex items-center justify-between gap-1">
          {/* Back button & Lives */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExit}
              className="w-8 h-8 rounded-full bg-[#3a1d4a] flex items-center justify-center text-[#fff9ef] active:scale-90 shadow cursor-pointer hover:bg-[#462856]"
              title="Leave Arena"
            >
              <AppIcon name="arrow_back" size={18} />
            </button>
            <div className="flex items-center gap-1 bg-[#3a1d4a] px-2.5 py-1 rounded-full border border-red-500/30">
              <AppIcon name="favorite" size={15} className="text-red-400" fill="currentColor" />
              <span className="font-hud text-[12px] text-white font-bold">{player.lives}</span>
            </div>
          </div>

          {/* Level & Mode Indicator with Glowing Beads */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-display uppercase tracking-wider font-extrabold text-[#ffdb3c]">
              {level.isBossLevel ? 'BOSS LVL 10' : `LEVEL 0${level.id}`}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffdb3c] shadow-[0_0_6px_#ffd700]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffdb3c] shadow-[0_0_6px_#ffd700]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffdb3c] shadow-[0_0_6px_#ffd700]" />
              <span className="w-2 h-2 rounded-full bg-[#ff6f00] ring-2 ring-[#ffdb3c] animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#462856]" />
            </div>
          </div>

          {/* Score & Moves Left */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <AppIcon name="stars" size={15} className="text-[#ffdb3c]" fill="currentColor" />
                <span className="font-hud text-[15px] text-white font-bold tracking-tight">
                  {score.toLocaleString()}
                </span>
              </div>
              <span className="text-[8px] font-body text-[#ffe16d] font-bold leading-none">
                COMBO ×{comboCount}
              </span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full shadow text-white font-hud text-[12px] font-black ${
              movesLeft <= 3 ? 'bg-red-600 animate-pulse' : 'bg-[#ff6f00]'
            }`}>
              <AppIcon name="hourglass_top" size={13} />
              <span>{movesLeft}</span>
            </div>
          </div>
        </div>

        {/* Sub-bar: Vighna Progress & Protection Meter */}
        <div className="flex items-center justify-between pt-1 text-[9px] font-body border-t border-white/10 mt-1">
          <div className="flex items-center gap-1 text-[#ffb2be] font-bold">
            <AppIcon name="crisis_alert" size={13} className="text-[#ff6689] animate-pulse" />
            <span className="text-[#ffe16d] font-hud text-[10px] tracking-tight">
              {level.objectiveType === 'score'
                ? `TARGET: ${score.toLocaleString()}/${level.targetScore.toLocaleString()} PTS`
                : level.objectiveType === 'create_specials'
                ? `SPECIALS: ${specialsCreated}/${level.specialsRequired || 5}`
                : level.objectiveType === 'boss'
                ? `BOSS: ${vighnasDefeated}/1 DEFEATED`
                : `VIGHNAS: ${vighnasDefeated} / ${level.obstaclesRequired || level.vighnasToDefeat}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-1 max-w-[150px] justify-end">
            <span className="text-[#ffdb3c] uppercase font-extrabold text-[8px]">Protection</span>
            <div className="w-16 h-2 bg-[#1c012d] rounded-full border border-[#ffdb3c]/30 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  protectionAura > 40
                    ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] shadow-[0_0_8px_#ffdb3c]'
                    : 'bg-red-600 shadow-[0_0_8px_red]'
                }`}
                style={{ width: `${protectionAura}%` }}
              />
            </div>
            <span className="font-hud text-[10px] text-[#ffe16d] font-bold">{protectionAura}%</span>
          </div>
        </div>
      </div>

      {/* ================= ZONE 1: LIVE COMBAT BATTLEFIELD (TOP 56%) ================= */}
      <section className="relative w-full min-h-[280px] max-h-[340px] bg-gradient-to-b from-[#180126] via-[#2a083f] to-[#1a0129] overflow-hidden flex flex-col justify-between p-2 border-b-2 border-[#ffdb3c]/40">
        {/* Ambient Hanging Marigold Garlands & Diyas */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 inset-x-0 h-6 flex justify-around items-start opacity-85" style={{ animation: 'garlandSway 3s ease-in-out infinite' }}>
            <div className="h-5 w-12 rounded-b-full border-b-4 border-amber-500 border-dashed" />
            <div className="h-6 w-16 rounded-b-full border-b-4 border-orange-500 border-dashed" />
            <div className="h-5 w-14 rounded-b-full border-b-4 border-amber-400 border-dashed" />
            <div className="h-6 w-16 rounded-b-full border-b-4 border-orange-600 border-dashed" />
          </div>
          <div className="absolute top-2 left-6 flex flex-col items-center diya-glow">
            <div className="w-0.5 h-4 bg-amber-600" />
            <div className="w-3 h-2 rounded-b-full bg-amber-400 shadow-[0_0_8px_#ffdb3c]" />
          </div>
          <div className="absolute top-2 right-8 flex flex-col items-center diya-glow">
            <div className="w-0.5 h-5 bg-amber-600" />
            <div className="w-3.5 h-2.5 rounded-b-full bg-amber-400 shadow-[0_0_10px_#ffdb3c]" />
          </div>
        </div>

        {/* Dynamic Prana Particles stream upward */}
        {pranaParticles.map((p) => (
          <div
            key={p.id}
            className="absolute w-3 h-3 rounded-full bg-[#ffdb3c] shadow-[0_0_12px_#ffdb3c] prana-particle-rise pointer-events-none z-30"
            style={{ left: `${p.x}px`, bottom: '20px' }}
          />
        ))}

        {/* Top Arena Banner & Boss Actions */}
        <div className="relative z-30 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 bg-[#462856]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#ffdb3c]/40">
            <AppIcon name="military_tech" size={12} className="text-amber-300 animate-spin" />
            <span className="text-[9px] font-body font-extrabold uppercase text-[#ffe16d]">
              {level.isBossLevel ? 'MAHA VIGHNA BOSS ARENA' : 'LIVE COMBAT ARENA'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {level.isBossLevel && (
              <button
                onClick={handleBossChant}
                className="bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#341100] font-black px-2.5 py-1 rounded-full text-[9px] shadow-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <AppIcon name="auto_awesome" size={12} />
                <span>CHANT OM GAM!</span>
              </button>
            )}

            <button
              onClick={() => handleActivatePower('trident')}
              disabled={pranaEnergy < 100 || isProcessing}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-display font-extrabold shadow-lg transition-all cursor-pointer ${
                pranaEnergy >= 100
                  ? 'bg-gradient-to-r from-[#ff6f00] to-[#ffdb3c] text-[#552000] ring-2 ring-[#ffdb3c] shadow-[0_0_16px_#ffdb3c] animate-pulse hover:brightness-110 active:scale-95'
                  : 'bg-[#2b0e3b] border border-gray-600 text-gray-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <AppIcon name={pranaEnergy >= 100 ? 'bolt' : 'lock_clock'} size={13} />
              <span>{pranaEnergy >= 100 ? 'STRIKE VIGHNA!' : `⚡ ${pranaEnergy}/100`}</span>
            </button>
          </div>
        </div>

        {/* COMBAT CORRIDOR: LORD GANESHA VS INCOMING OBSTACLES */}
        <div className="relative z-20 flex-1 flex items-center justify-between px-1 my-1">
          {/* ================= LEFT: LORD GANESHA GUARDIAN ================= */}
          <div className="relative flex flex-col items-center shrink-0 w-28">
            <div
              className={`absolute -top-3 -left-2 w-28 h-28 rounded-full bg-[#ffdb3c]/20 blur-lg pointer-events-none transition-all duration-300 ${
                isProcessing ? 'scale-150 opacity-100 bg-[#ff6f00]/40' : 'ganesha-aura-active'
              }`}
            />

            <div className="relative flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-b from-[#ffdb3c]/40 via-[#3a1d4a] to-[#1c012d] p-1 shadow-[0_0_18px_rgba(255,219,60,0.5)] border-2 transition-all duration-300 relative overflow-hidden ${
                  isProcessing ? 'scale-110 border-white shadow-[0_0_28px_#ffe16d]' : 'border-[#ffdb3c]'
                }`}
              >
                <img
                  src={ASSETS.ganeshaHero}
                  alt="Lord Ganesha Heroic Guardian"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute bottom-0.5 right-0.5 bg-[#ff6f00] text-white rounded-full p-0.5 shadow">
                  <AppIcon name="stat_3" size={11} />
                </div>
              </div>

              <div className="flex flex-col items-center mt-1">
                <span className="font-display text-[10px] text-[#ffdb3c] font-black tracking-wide uppercase drop-shadow">
                  LORD GANESHA
                </span>
                <span
                  className={`text-[8px] font-body px-2 py-0.2 rounded-full border font-bold transition-all ${
                    isProcessing
                      ? 'bg-amber-400 text-[#341100] border-white animate-pulse'
                      : 'bg-[#3a1d4a] text-[#ffe16d] border-[#ffb691]/40'
                  }`}
                >
                  {ganeshaStatus}
                </span>
              </div>

              <div className="flex items-center gap-1 mt-1 bg-[#462856]/90 px-2 py-0.5 rounded-full border border-amber-500/30">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-[#ffdb3c]/50">
                  <img src={ASSETS.mushak} alt="Mushak" className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] font-body text-[#ffdb3c] font-extrabold">MUSHAK READY</span>
              </div>
            </div>
          </div>

          {/* ================= CENTER: TRIDENT / DIVINE PROJECTILE BEAM ================= */}
          <div className="relative flex-1 h-28 mx-1 flex items-center justify-center overflow-visible">
            {/* Active Projectile */}
            {activeProjectile && (
              <div
                className={`absolute pointer-events-none z-30 ${
                  activeProjectile.type === 'trident'
                    ? 'h-4 projectile-fly-anim'
                    : activeProjectile.type === 'divine_blast'
                    ? 'h-12 divine-blast-anim'
                    : 'h-8 projectile-fly-anim'
                }`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {activeProjectile.type === 'trident' && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-amber-300 via-[#ffdb3c] to-white rounded-full px-3 py-1 shadow-[0_0_24px_#ffe16d] border border-white">
                    <AppIcon name="stat_3" size={18} className="text-[#552000]" />
                    <span className="text-[9px] font-hud font-black text-[#552000] tracking-wider">TRIDENT</span>
                  </div>
                )}
                {activeProjectile.type === 'divine_blast' && (
                  <div className="w-full h-full bg-gradient-to-r from-[#ff6f00]/70 via-[#ffdb3c] to-white/90 rounded-2xl shadow-[0_0_30px_#ff6689] flex items-center justify-end px-3">
                    <AppIcon name="auto_awesome" size={24} className="text-white drop-shadow-[0_0_10px_#fff]" />
                  </div>
                )}
                {activeProjectile.type === 'festival_light' && (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-white rounded-full px-3 py-1.5 shadow-[0_0_28px_#ffdb3c] border-2 border-yellow-200">
                    <AppIcon name="wb_sunny" size={18} className="text-amber-950" />
                    <span className="text-[9px] font-hud font-black text-amber-950">FESTIVAL LIGHT</span>
                  </div>
                )}
              </div>
            )}

            {/* Impact Floater */}
            {impactFloater && (
              <div className="absolute top-2 right-4 flex flex-col items-center pointer-events-none z-40 animate-bounce bg-black/60 px-3 py-1 rounded-xl border border-[#ffdb3c]/50 shadow-[0_0_15px_rgba(255,219,60,0.4)]">
                <span className="font-display text-[12px] text-white font-black tracking-wider uppercase drop-shadow bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                  {impactFloater.text}
                </span>
                <span className="font-hud text-[13px] text-[#ffe16d] font-black drop-shadow-[0_0_10px_#ffdb3c]">
                  {impactFloater.pts}
                </span>
              </div>
            )}
          </div>

          {/* ================= RIGHT: MULTI-TIERED REAL INCOMING VIGHNAS ================= */}
          <div className="relative flex items-center gap-1.5 shrink-0">
            {/* Far Lane */}
            {activeEnemies[2] && (
              <div
                className={`flex flex-col items-center opacity-70 scale-75 transition-all ${
                  defeatedEnemyIds.has(activeEnemies[2].id)
                    ? 'vighna-defeat-burst-anim'
                    : hitEnemyIds.has(activeEnemies[2].id)
                    ? 'obstacle-hit-anim'
                    : ''
                }`}
              >
                <span className="text-[7px] font-body text-[#e1bfb0] font-bold mb-0.5">FAR</span>
                <div className="w-7 h-7 rounded-full bg-[#462856] border border-[#594136] flex items-center justify-center relative shadow-sm overflow-hidden">
                  <img src={activeEnemies[2].img} alt={activeEnemies[2].name} className="w-full h-full object-cover" />
                  <span className="absolute -top-1 -right-1 text-[7px] bg-[#1c012d] text-white font-hud font-bold px-1 rounded-full">
                    {activeEnemies[2].hp}HP
                  </span>
                </div>
                <span className="text-[7px] text-[#e1bfb0] truncate max-w-[36px]">{activeEnemies[2].name.split(' ')[0]}</span>
              </div>
            )}

            {/* Med Lane */}
            {activeEnemies[1] && (
              <div
                className={`flex flex-col items-center opacity-85 scale-90 transition-all ${
                  defeatedEnemyIds.has(activeEnemies[1].id)
                    ? 'vighna-defeat-burst-anim'
                    : hitEnemyIds.has(activeEnemies[1].id)
                    ? 'obstacle-hit-anim'
                    : ''
                }`}
              >
                <span className="text-[7px] font-body text-[#ffe16d] font-bold mb-0.5">MED</span>
                <div className="w-9 h-9 rounded-lg bg-[#3a1d4a] border border-amber-500/40 flex items-center justify-center relative shadow-md overflow-hidden">
                  <img src={activeEnemies[1].img} alt={activeEnemies[1].name} className="w-full h-full object-cover" />
                  <span className="absolute -top-1 -right-1 text-[7px] bg-[#ff6f00] text-white font-hud font-bold px-1 rounded-full">
                    {activeEnemies[1].hp}HP
                  </span>
                </div>
                <span className="text-[7px] text-amber-200 truncate max-w-[42px]">{activeEnemies[1].name.split(' ')[0]}</span>
              </div>
            )}

            {/* Critical Lane at Rangoli Boundary */}
            <div className="relative flex flex-col items-center scale-110 ml-0.5 transition-all">
              <div className="absolute -inset-2 bg-red-600/30 rounded-xl blur-sm pointer-events-none animate-pulse" />
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-b from-red-600/40 via-[#3a1d4a] to-[#1c012d] p-0.5 shadow-[0_0_15px_rgba(255,0,60,0.8)] border-2 border-red-500 relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  criticalEnemy.hp <= 0 || defeatedEnemyIds.has(criticalEnemy.id)
                    ? 'vighna-defeat-burst-anim'
                    : hitEnemyIds.has(criticalEnemy.id)
                    ? 'obstacle-hit-anim'
                    : ''
                }`}
              >
                <img
                  src={criticalEnemy.img}
                  alt={criticalEnemy.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <span className="absolute -top-1 -right-1 text-[8px] bg-red-600 text-white font-hud font-black px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                  {criticalEnemy.hp > 0 ? `${criticalEnemy.hp}HP` : 'PURGED!'}
                </span>
                <div className="absolute bottom-0 inset-x-0 bg-red-950/80 py-0.5 text-center">
                  <span className="text-[7px] text-red-300 font-extrabold tracking-tight uppercase">
                    TARGET
                  </span>
                </div>
              </div>
              <span className="text-[8px] font-body text-red-400 font-black mt-0.5">CRITICAL!</span>
            </div>
          </div>
        </div>

        {/* WARNING FLASHING BANNER & SACRED RANGOLI/DIYA BOUNDARY */}
        <div className="relative z-20 flex flex-col gap-1">
          <div className="flex items-center justify-between bg-red-950/80 border border-red-500/50 rounded-lg px-2.5 py-1 text-[9px] font-body shadow-inner">
            <div className="flex items-center gap-1.5 text-red-300 font-bold">
              <AppIcon name="warning" size={14} className="text-red-400 animate-ping" />
              <span className="tracking-tight uppercase truncate">
                {criticalEnemy.isShielded
                  ? 'CRITICAL WARNING! SHIELDED VIGHNA AT BOUNDARY'
                  : 'CRITICAL WARNING! VIGHNA IN STRIKE RANGE'}
              </span>
            </div>
            <span className="text-[8px] bg-red-600 text-white font-hud font-black px-1.5 py-0.5 rounded uppercase shrink-0">
              Breach Risk!
            </span>
          </div>

          <div className="relative h-4 flex items-center justify-between px-2 bg-gradient-to-r from-amber-950/60 via-[#3a1d4a] to-amber-950/60 rounded-full border border-[#ffdb3c]/30">
            <div className="flex items-center gap-1">
              <AppIcon name="local_fire_department" size={12} className="text-amber-400 diya-glow" />
              <span className="text-[8px] font-body uppercase font-extrabold text-[#ffdb3c] tracking-wider">
                Sacred Pandal Rangoli Boundary
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#ffdb3c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_6px_#ffdb3c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#ffdb3c]" />
              <span className="text-[8px] font-hud font-bold text-amber-300">SPARK BARRIER ACTIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BETWEEN ZONES: DIVINE PRANA & 3 POWERS BAR ================= */}
      <section className="bg-[#1c012d] px-3 py-1.5 border-b border-[#ff6f00]/20 flex flex-col gap-1 z-30">
        <div className="flex items-center justify-between text-[10px] font-body leading-none">
          <div className="flex items-center gap-1.5 text-[#ffdb3c] font-bold">
            <AppIcon name="auto_awesome" size={13} className="animate-spin" />
            <span className="uppercase tracking-wide">
              {pranaEnergy >= 100 ? 'DIVINE PRANA READY!' : 'Divine Prana Stream'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`font-hud text-[11px] font-bold ${pranaEnergy >= 100 ? 'text-emerald-300 animate-pulse' : 'text-[#ffe16d]'}`}>
              {pranaEnergy} / 100 EN
            </span>
            <AppIcon
              name="bolt"
              size={12}
              className={pranaEnergy >= 100 ? 'text-yellow-300 animate-bounce' : 'text-yellow-500'}
            />
          </div>
        </div>

        {/* Real Progress Fill Bar */}
        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-[#ffdb3c]/20">
          <div
            className={`h-full transition-all duration-300 ${
              pranaEnergy >= 100
                ? 'bg-gradient-to-r from-amber-400 via-[#ffdb3c] to-emerald-400 shadow-[0_0_10px_#ffdb3c]'
                : 'bg-gradient-to-r from-amber-600 to-[#ffdb3c]'
            }`}
            style={{ width: `${pranaEnergy}%` }}
          />
        </div>

        {/* Powers Grid */}
        <div className="grid grid-cols-3 gap-1.5 mt-0.5">
          {/* Power 1: Trident Strike */}
          <button
            onClick={() => handleActivatePower('trident')}
            disabled={pranaEnergy < 100 || isProcessing}
            className={`rounded-lg p-1 flex items-center gap-1.5 border shadow active:scale-95 transition-all cursor-pointer ${
              pranaEnergy >= 100
                ? 'bg-gradient-to-r from-amber-950/90 to-[#3a1d4a] border-[#ffdb3c] ring-2 ring-[#ffdb3c]/70 shadow-[0_0_16px_rgba(255,219,60,0.8)] animate-pulse'
                : 'bg-[#2b0e3b] border-gray-600 text-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-b from-[#ffdb3c] to-amber-600 text-[#552000] flex items-center justify-center shrink-0 shadow">
              <AppIcon name="stat_3" size={14} />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-[9px] font-display font-extrabold text-[#ffdb3c] leading-tight truncate">
                🔱 TRIDENT
              </span>
              <span className={`text-[8px] font-hud font-bold leading-tight ${pranaEnergy >= 100 ? 'text-emerald-400' : 'text-amber-200/70'}`}>
                {pranaEnergy >= 100 ? 'READY!' : `${pranaEnergy}/100 EN`}
              </span>
            </div>
          </button>

          {/* Power 2: Divine Blast */}
          <button
            onClick={() => handleActivatePower('divine_blast')}
            disabled={!isDivineBlastUnlocked || pranaEnergy < 100 || isProcessing}
            className={`rounded-lg p-1 flex items-center gap-1.5 border shadow active:scale-95 transition-all cursor-pointer ${
              isDivineBlastUnlocked && pranaEnergy >= 100
                ? 'bg-[#3a1d4a] border-[#ff6689] ring-2 ring-[#ff6689]/70 shadow-[0_0_16px_rgba(255,102,137,0.8)] text-white animate-pulse'
                : 'bg-[#2b0e3b] border-gray-600 text-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-b from-[#ffb2be] to-rose-700 text-white flex items-center justify-center shrink-0 shadow">
              <AppIcon name={isDivineBlastUnlocked ? 'auto_awesome' : 'lock'} size={14} />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-[9px] font-display font-extrabold leading-tight truncate">
                💥 BLAST
              </span>
              <span className={`text-[8px] font-hud font-bold leading-tight ${isDivineBlastUnlocked && pranaEnergy >= 100 ? 'text-emerald-400' : 'text-gray-300'}`}>
                {!isDivineBlastUnlocked ? 'Lvl 2' : pranaEnergy >= 100 ? 'READY!' : `${pranaEnergy}/100 EN`}
              </span>
            </div>
          </button>

          {/* Power 3: Festival Light */}
          <button
            onClick={() => handleActivatePower('festival_light')}
            disabled={!isFestivalLightUnlocked || pranaEnergy < 100 || isProcessing}
            className={`rounded-lg p-1 flex items-center gap-1.5 border shadow active:scale-95 transition-all cursor-pointer ${
              isFestivalLightUnlocked && pranaEnergy >= 100
                ? 'bg-[#3a1d4a]/90 border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_16px_rgba(251,191,36,0.8)] text-white animate-pulse'
                : 'bg-[#2b0e3b] border-gray-600 text-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-[#1c012d] text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40">
              <AppIcon name={isFestivalLightUnlocked ? 'wb_sunny' : 'lock'} size={14} />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-[9px] font-display font-bold text-[#e1bfb0] leading-tight truncate">
                ✨ LIGHT
              </span>
              <span className={`text-[8px] font-hud font-bold leading-tight ${isFestivalLightUnlocked && pranaEnergy >= 100 ? 'text-emerald-400' : 'text-amber-200/70'}`}>
                {!isFestivalLightUnlocked ? 'Lvl 3' : pranaEnergy >= 100 ? 'READY!' : `${pranaEnergy}/100 EN`}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ================= ZONE 2: TACTILE 7x7 MODAK MATCH-3 BOARD (BOTTOM 44%) ================= */}
      <section
        className="flex-1 w-full bg-[#1c012d] px-2 pt-1 pb-safe flex flex-col justify-center items-center relative overflow-hidden"
        onPointerUp={handlePointerUp}
      >
        {/* Subtle decorative rangoli ring */}
        <div
          className="absolute w-64 h-64 rounded-full border border-[#ffdb3c]/10 pointer-events-none opacity-20"
          style={{ animation: 'rangoliSpinSlow 40s linear infinite' }}
        />

        {/* Combo Cascade Banner Announcement */}
        {comboBanner && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none combo-banner-anim">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-stone-950 font-display font-black text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-[0_0_24px_rgba(255,219,60,0.95)] border-2 border-white tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <span>{comboBanner.text}</span>
            </div>
          </div>
        )}

        {/* 7x7 TACTILE MODAK GRID */}
        <div
          ref={boardRef}
          onPointerMove={handlePointerMove}
          className="w-full max-w-[min(94vw,400px)] aspect-square grid grid-cols-7 gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-[#180126] rounded-2xl shadow-[inset_0_2px_12px_rgba(0,0,0,0.8),0_6px_20px_rgba(34,5,50,0.9)] border border-[#ff6f00]/25 touch-none relative"
        >
          {board.map((row, r) =>
            row.map((tile, c) => {
              const isSelected = selectedTile?.id === tile.id;
              const isRainbow = tile.type === 'special_trishul';
              const isChakra = tile.type === 'special_chakra';
              const isBlast = tile.type === 'special_surya_blast';
              const isHinted = Boolean(
                idleHint &&
                  ((idleHint.r1 === r && idleHint.c1 === c) ||
                    (idleHint.r2 === r && idleHint.c2 === c))
              );

              // Visual styling mapping
              let bgGradient = 'bg-gradient-to-b from-[#ffdb3c] via-[#ff6f00] to-[#8f3a00]';
              let icon = 'local_fire_department';
              let iconColor = 'text-white';

              if (tile.type === 'manek') {
                bgGradient = 'bg-gradient-to-b from-[#d8b4fe] via-[#9333ea] to-[#4c1d95]';
                icon = 'diamond';
              } else if (tile.type === 'tulsi') {
                bgGradient = 'bg-gradient-to-b from-[#86efac] via-[#16a34a] to-[#14532d]';
                icon = 'eco';
              } else if (tile.type === 'gulab') {
                bgGradient = 'bg-gradient-to-b from-[#f472b6] via-[#db2777] to-[#831843]';
                icon = 'spa';
              } else if (tile.type === 'neel') {
                bgGradient = 'bg-gradient-to-b from-[#60a5fa] via-[#2563eb] to-[#1e3a8a]';
                icon = 'cyclone';
              } else if (tile.type === 'surya') {
                bgGradient = 'bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#854d0e]';
                icon = 'brightness_7';
                iconColor = 'text-[#3a3000]';
              } else if (isRainbow) {
                bgGradient = 'bg-gradient-to-tr from-[#ffdb3c] via-[#ff6689] to-[#60a5fa]';
                icon = 'stat_3';
              } else if (isChakra) {
                bgGradient = 'bg-gradient-to-br from-[#ffdb3c] via-[#ff6f00] to-[#ffe16d]';
                icon = 'cyclone';
              } else if (isBlast) {
                bgGradient = 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500';
                icon = 'flare';
              }

              // Physical swap animation transform
              let swapStyle: React.CSSProperties = {};
              let zIndex = 10;
              if (swapAnimation) {
                const { r1, c1, r2, c2, phase } = swapAnimation;
                if (r === r1 && c === c1) {
                  zIndex = 30;
                  swapStyle = {
                    transform:
                      phase === 'forward'
                        ? `translate(${(c2 - c1) * 100}%, ${(r2 - r1) * 100}%)`
                        : 'translate(0, 0)',
                    transition: 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)',
                  };
                } else if (r === r2 && c === c2) {
                  zIndex = 30;
                  swapStyle = {
                    transform:
                      phase === 'forward'
                        ? `translate(${(c1 - c2) * 100}%, ${(r1 - r2) * 100}%)`
                        : 'translate(0, 0)',
                    transition: 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)',
                  };
                }
              }

              const tileStyle: React.CSSProperties = {
                ...swapStyle,
                ...(tile.dropDistance && tile.dropDistance > 0
                  ? { '--drop-distance': tile.dropDistance }
                  : {}),
                zIndex: isHinted ? 25 : zIndex,
              } as React.CSSProperties;

              const isFalling = Boolean(tile.dropDistance && tile.dropDistance > 0);

              return (
                <button
                  key={tile.id}
                  id={`modak-${r}-${c}`}
                  onClick={() => handleTileClick(tile)}
                  onPointerDown={(e) => handlePointerDown(e, tile)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  disabled={isProcessing}
                  style={tileStyle}
                  className={`modak-shape group relative p-0.5 flex items-center justify-center select-none active:scale-90 touch-none ${
                    isFalling ? 'tile-falling-anim' : ''
                  } ${
                    isSelected ? 'ring-4 ring-amber-300 scale-105 z-30 shadow-[0_0_16px_#ffdb3c]' : ''
                  } ${isHinted && !isSelected ? 'tile-idle-hint' : ''} ${
                    tile.isMatched ? 'tile-pulse-glow z-20' : ''
                  } ${
                    tile.isClearing ? 'tile-burst-anim pointer-events-none' : ''
                  } ${tile.isRooted ? 'border-2 border-stone-600 bg-stone-900' : ''}`}
                  title={`${tile.type} Modak`}
                >
                  <div
                    className={`w-full h-full rounded-lg ${bgGradient} flex items-center justify-center shadow-inner relative overflow-hidden ${
                      isRainbow ? 'trishul-rainbow-aura' : ''
                    } ${isBlast ? 'surya-sunburst-aura' : ''}`}
                  >
                    {/* Top glossy specular highlight */}
                    <div className="absolute top-0.5 left-1 w-1.5 h-1.5 bg-white/70 rounded-full" />

                    {/* Fluted rib texture */}
                    <div className="absolute inset-0 modak-ribs opacity-30 pointer-events-none" />

                    {/* Icon glyph */}
                    <AppIcon
                      name={icon}
                      size={18}
                      className={`${iconColor} drop-shadow`}
                    />

                    {/* Root obstacle bramble overlay if any */}
                    {tile.isRooted && (
                      <div className="absolute inset-0 bg-stone-900/80 flex flex-col items-center justify-center">
                        <AppIcon name="forest" size={18} className="text-stone-300" />
                        <span className="text-[6px] font-bold text-stone-200">ROOT</span>
                      </div>
                    )}

                    {/* Special Vajra Chakra halo & badge */}
                    {isChakra && (
                      <>
                        <div className="absolute inset-0 rounded-full border border-amber-200/60 border-dashed chakra-halo-spin pointer-events-none" />
                        <span className="absolute -top-0.5 -right-0.5 text-[6px] bg-amber-400 text-stone-950 font-black px-1 rounded-full shadow">
                          ⚡
                        </span>
                      </>
                    )}

                    {/* Special Rainbow Trishul badge */}
                    {isRainbow && (
                      <>
                        <div className="absolute inset-0 bg-white/30 animate-ping pointer-events-none" />
                        <span className="absolute -top-0.5 -right-0.5 text-[6px] bg-yellow-300 text-amber-950 font-black px-1 rounded-full shadow">
                          🔱
                        </span>
                      </>
                    )}

                    {/* Special Surya Blast badge */}
                    {isBlast && (
                      <span className="absolute -top-0.5 -right-0.5 text-[6px] bg-red-600 text-white font-black px-1 rounded-full shadow">
                        💥
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Accessible Legend */}
        <div className="w-full max-w-[400px] flex items-center justify-between px-2 mt-1.5 text-[9px] text-[#e1bfb0] font-body">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ff6f00]" />
            <span>Kesar</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ec4899]" />
            <span>Gulab</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span>Tulsi</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span>Neel</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
            <span>Manek</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#eab308]" />
            <span>Surya</span>
          </div>
        </div>
      </section>

      {/* LEVEL FAILED MODAL */}
      {gameOver === 'lost' && (
        <DefeatModal
          score={score}
          vighnasDefeated={vighnasDefeated}
          targetVighnas={level.vighnasToDefeat}
          soundEnabled={player.soundEnabled}
          onRetry={() => {
            initializeGame();
          }}
          onGoHome={() => {
            onDefeat();
          }}
        />
      )}
    </div>
  );
};
