import { ModakType } from '../types';

export const BOARD_ROWS = 7;
export const BOARD_COLS = 7;

export const STANDARD_MODAK_TYPES: ModakType[] = [
  'kesar', // Golden saffron
  'gulab', // Pink rose
  'tulsi', // Sacred green basil
  'neel',  // Sapphire blue
  'manek', // Purple amethyst
  'surya', // Yellow sun
];

export const MATCH_SCORES = {
  MATCH_3: 30,
  MATCH_4: 60,
  MATCH_5: 100,
  SPECIAL_TRIGGER: 80,
  RAINBOW_CLEAR_PER_TILE: 40,
  OBSTACLE_HIT: 120,
  OBSTACLE_DEFEAT: 250,
  MINI_BOSS_DEFEAT: 500,
  BOSS_DEFEAT: 1200,
  MOVES_REMAINING_BONUS: 75,
};

export const PRANA_ENERGY = {
  MATCH_3: 20,
  MATCH_4: 35,
  MATCH_5: 50,
  SPECIAL_PIECE_POP: 30,
  CASCADE_BONUS: 15,
  MAX_ENERGY: 100,
};

export const POWER_ENERGY_COSTS = {
  trident: 100,       // Power 1: Single-target Trident Strike (Unlocked at Level 1)
  divine_blast: 100,  // Power 2: Multi-target Divine Blast (Unlocked at Level 2)
  festival_light: 100,// Power 3: Festival Light (Clears 3x3 board section + damages obstacles) (Unlocked at Level 3)
  mushak: 100,
  lotus: 100,
  diya: 100,
  chant: 100,
};

export const COMBO_MULTIPLIERS = [1, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

export const OBSTACLE_BREACH_PENALTY = 25; // Percentage of protection aura lost when enemy hits the Rangoli boundary
