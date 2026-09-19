import { VighnaEnemy, LevelConfig } from '../types';
import { ASSETS } from '../data/gameData';

export function createObstacleWave(level: LevelConfig): VighnaEnemy[] {
  const count = level.obstaclesRequired || level.vighnasToDefeat || 4;
  const baseHp = level.obstacleHealth || 2;
  const speedMult =
    level.obstacleSpeed === 'slow'
      ? 0.8
      : level.obstacleSpeed === 'fast'
      ? 1.6
      : typeof level.obstacleSpeed === 'number'
      ? level.obstacleSpeed
      : 1.2;

  const list: VighnaEnemy[] = [];

  if (level.isBossLevel || level.objectiveType === 'boss') {
    // Level 10: Maha Vighna Asura Boss + Minion Bodyguards
    list.push({
      id: `boss-${level.id}`,
      name: 'Maha Vighna Asura',
      type: 'boss',
      hp: Math.max(8, baseHp),
      maxHp: Math.max(8, baseHp),
      speed: Number((1 * speedMult).toFixed(1)),
      distance: 'boundary',
      img: ASSETS.bossAsura,
      isShielded: true,
    });
    // Add 2 captains
    for (let i = 1; i <= 2; i++) {
      list.push({
        id: `captain-${i}`,
        name: 'Vighna Marauder',
        type: 'captain',
        hp: Math.max(4, Math.round(baseHp * 0.6)),
        maxHp: Math.max(4, Math.round(baseHp * 0.6)),
        speed: Number((1.2 * speedMult).toFixed(1)),
        distance: i === 1 ? 'med' : 'far',
        img: ASSETS.vighnaTitan,
      });
    }
    return list;
  }

  // Standard or Mini-boss level
  for (let i = 0; i < count; i++) {
    const isMiniBoss = (level.isMiniBoss || level.objectiveType === 'defeat_strong') && i === 0;
    if (isMiniBoss) {
      list.push({
        id: `miniboss-${i}`,
        name: 'Horned Titan Vighna',
        type: 'captain',
        hp: Math.max(4, baseHp),
        maxHp: Math.max(4, baseHp),
        speed: Number((1.2 * speedMult).toFixed(1)),
        distance: 'boundary',
        img: ASSETS.vighnaTitan,
        isShielded: true,
      });
    } else if (i % 3 === 0) {
      list.push({
        id: `vighna-${i}`,
        name: 'Thorn Sprite',
        type: 'thorn',
        hp: Math.max(1, baseHp),
        maxHp: Math.max(1, baseHp),
        speed: Number((1.4 * speedMult).toFixed(1)),
        distance: i === 0 ? 'boundary' : i === 1 ? 'med' : 'far',
        img: ASSETS.vighnaThorn,
      });
    } else if (i % 2 === 0) {
      list.push({
        id: `vighna-${i}`,
        name: 'Shadow Imp',
        type: 'wisp',
        hp: Math.max(1, Math.round(baseHp * 0.8)),
        maxHp: Math.max(1, Math.round(baseHp * 0.8)),
        speed: Number((1.8 * speedMult).toFixed(1)),
        distance: i === 0 ? 'boundary' : i === 1 ? 'med' : 'far',
        img: ASSETS.vighnaImp,
      });
    } else {
      list.push({
        id: `vighna-${i}`,
        name: 'Cloud Imp',
        type: 'wisp',
        hp: Math.max(1, Math.round(baseHp * 0.7)),
        maxHp: Math.max(1, Math.round(baseHp * 0.7)),
        speed: Number((1.6 * speedMult).toFixed(1)),
        distance: i === 0 ? 'boundary' : i === 1 ? 'med' : 'far',
        img: ASSETS.vighnaCloud,
      });
    }
  }

  return list;
}

/**
 * Step active obstacles closer along lanes:
 * 'far' -> 'med' -> 'close' -> 'boundary'
 */
export function advanceObstacles(
  currentObstacles: VighnaEnemy[],
  onBreach?: (obstacle: VighnaEnemy) => void
): VighnaEnemy[] {
  return currentObstacles.map((enemy) => {
    if (enemy.hp <= 0) return enemy;

    if (enemy.distance === 'far') {
      return { ...enemy, distance: 'med' };
    } else if (enemy.distance === 'med') {
      return { ...enemy, distance: 'close' };
    } else if (enemy.distance === 'close') {
      return { ...enemy, distance: 'boundary' };
    } else if (enemy.distance === 'boundary') {
      // Enemy is attacking/breaching the boundary!
      if (onBreach) {
        onBreach(enemy);
      }
      return enemy;
    }
    return enemy;
  });
}
