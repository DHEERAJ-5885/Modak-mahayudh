import { VighnaEnemy, LevelConfig, VighnaDistance } from '../types';
import { ASSETS } from '../data/gameData';

export function getDistanceFromProgress(progress: number): VighnaDistance {
  if (progress >= 90) return 'boundary';
  if (progress >= 65) return 'close';
  if (progress >= 35) return 'med';
  return 'far';
}

export function createObstacleWave(level: LevelConfig): VighnaEnemy[] {
  const count = level.obstaclesRequired || level.vighnasToDefeat || 4;
  const baseHp = level.obstacleHealth || 2;
  const speedMult =
    level.id === 1
      ? 0.55 // Extra gentle for Level 1 teaching
      : level.obstacleSpeed === 'slow'
      ? 0.75
      : level.obstacleSpeed === 'fast'
      ? 1.5
      : typeof level.obstacleSpeed === 'number'
      ? level.obstacleSpeed
      : 1.1;

  const list: VighnaEnemy[] = [];

  if (level.isBossLevel || level.objectiveType === 'boss') {
    // Level 10: Maha Vighna Asura Boss + Minion Bodyguards
    list.push({
      id: `boss-${level.id}`,
      name: 'Maha Vighna Asura',
      type: 'boss',
      hp: Math.max(10, baseHp * 2),
      maxHp: Math.max(10, baseHp * 2),
      speed: Number((0.65 * speedMult).toFixed(2)),
      distance: 'far',
      progress: 0,
      lane: 1, // center lane
      attackPower: 35,
      attackCooldown: 1.8,
      img: ASSETS.bossAsura,
      isShielded: true,
    });
    // Add 2 captains in flanking lanes
    for (let i = 1; i <= 2; i++) {
      list.push({
        id: `captain-${i}`,
        name: i === 1 ? 'Vighna Marauder' : 'Demon Vanguard',
        type: 'captain',
        hp: Math.max(4, Math.round(baseHp * 0.8)),
        maxHp: Math.max(4, Math.round(baseHp * 0.8)),
        speed: Number((0.95 * speedMult).toFixed(2)),
        distance: 'far',
        progress: 0,
        lane: i === 1 ? 0 : 2,
        attackPower: 25,
        attackCooldown: 2.2,
        img: ASSETS.vighnaTitan,
      });
    }
    return list;
  }

  // Standard or Mini-boss level
  for (let i = 0; i < count; i++) {
    const isMiniBoss = (level.isMiniBoss || level.objectiveType === 'defeat_strong') && i === 0;
    const lane = i % 3; // Cycle top (0), mid (1), bot (2)

    if (isMiniBoss) {
      list.push({
        id: `miniboss-${i}`,
        name: 'Horned Titan Vighna',
        type: 'captain',
        hp: Math.max(4, baseHp + 2),
        maxHp: Math.max(4, baseHp + 2),
        speed: Number((0.85 * speedMult).toFixed(2)),
        distance: 'far',
        progress: 0,
        lane,
        attackPower: 25,
        attackCooldown: 2.2,
        img: ASSETS.vighnaTitan,
        isShielded: true,
      });
    } else if (level.id === 1) {
      // Level 1: Tutorial teaching demons - steady, 1 HP
      list.push({
        id: `vighna-lvl1-${i}`,
        name: i === 0 ? 'Mischief Cloud' : i === 1 ? 'Shadow Imp' : 'Thorn Imp',
        type: 'wisp',
        hp: 1,
        maxHp: 1,
        speed: Number((0.7 * speedMult).toFixed(2)),
        distance: 'far',
        progress: 0,
        lane: i === 0 ? 1 : i === 1 ? 0 : 2,
        attackPower: 15,
        attackCooldown: 3.0,
        img: i === 0 ? ASSETS.vighnaCloud : i === 1 ? ASSETS.vighnaImp : ASSETS.vighnaThorn,
      });
    } else if (i % 3 === 0) {
      // Thorn Sprite - Agile, medium HP
      list.push({
        id: `vighna-${i}`,
        name: 'Thorn Sprite',
        type: 'thorn',
        hp: Math.max(1, baseHp),
        maxHp: Math.max(1, baseHp),
        speed: Number((1.35 * speedMult).toFixed(2)),
        distance: 'far',
        progress: 0,
        lane,
        attackPower: 18,
        attackCooldown: 2.0,
        img: ASSETS.vighnaThorn,
      });
    } else if (i % 2 === 0) {
      // Shadow Imp - Fast runner, lower HP
      list.push({
        id: `vighna-${i}`,
        name: 'Shadow Imp',
        type: 'wisp',
        hp: Math.max(1, Math.round(baseHp * 0.7)),
        maxHp: Math.max(1, Math.round(baseHp * 0.7)),
        speed: Number((1.65 * speedMult).toFixed(2)),
        distance: 'far',
        progress: 0,
        lane,
        attackPower: 15,
        attackCooldown: 1.8,
        img: ASSETS.vighnaImp,
      });
    } else {
      // Cloud Imp - Balanced
      list.push({
        id: `vighna-${i}`,
        name: 'Cloud Imp',
        type: 'wisp',
        hp: Math.max(1, Math.round(baseHp * 0.8)),
        maxHp: Math.max(1, Math.round(baseHp * 0.8)),
        speed: Number((1.2 * speedMult).toFixed(2)),
        distance: 'far',
        progress: 0,
        lane,
        attackPower: 15,
        attackCooldown: 2.2,
        img: ASSETS.vighnaCloud,
      });
    }
  }

  return list;
}

/**
 * Continuous real-time movement update loop:
 * Smoothly advances progress of all active enemies toward Pandal boundary (progress 95%).
 * When at boundary, handles attack strike timers against the Pandal sacred barrier.
 */
export function updateEnemiesContinuous(
  enemies: VighnaEnemy[],
  deltaSeconds: number,
  onBreachStrike: (enemy: VighnaEnemy) => void
): VighnaEnemy[] {
  return enemies.map((enemy) => {
    if (enemy.hp <= 0 || enemy.isDefeated) {
      return enemy;
    }

    // Base advance rate: 3.2% per second * speed factor
    const advanceRate = 3.2 * enemy.speed;
    const progressInc = advanceRate * deltaSeconds;

    if (enemy.progress < 94) {
      const nextProgress = Math.min(94, enemy.progress + progressInc);
      const nextDist = getDistanceFromProgress(nextProgress);
      return {
        ...enemy,
        progress: nextProgress,
        distance: nextDist,
        isAttacking: false,
      };
    } else {
      // Enemy is at the Pandal sacred boundary!
      const currentCooldown = enemy.attackCooldown ?? 2.0;
      const nextCooldown = currentCooldown - deltaSeconds;

      if (nextCooldown <= 0) {
        // Trigger respectful barrier impact
        onBreachStrike(enemy);
        return {
          ...enemy,
          progress: 94,
          distance: 'boundary',
          isAttacking: true,
          attackCooldown: 2.4, // Reset strike cooldown
        };
      } else {
        return {
          ...enemy,
          progress: 94,
          distance: 'boundary',
          attackCooldown: nextCooldown,
        };
      }
    }
  });
}

/**
 * Legacy discrete step advance (retained for backward compatibility)
 */
export function advanceObstacles(
  currentObstacles: VighnaEnemy[],
  onBreach?: (obstacle: VighnaEnemy) => void
): VighnaEnemy[] {
  return currentObstacles.map((enemy) => {
    if (enemy.hp <= 0) return enemy;
    const nextProg = Math.min(94, (enemy.progress || 0) + 12);
    if (nextProg >= 90 && onBreach) {
      onBreach(enemy);
    }
    return {
      ...enemy,
      progress: nextProg,
      distance: getDistanceFromProgress(nextProg),
    };
  });
}
