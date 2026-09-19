import { ModakTile, ModakType } from '../types';
import { BOARD_ROWS, BOARD_COLS, STANDARD_MODAK_TYPES } from './constants';

export interface MatchResult {
  matchedTileIds: Set<string>;
  scoreGained: number;
  energyGained: number;
  specialPiecesToCreate: {
    row: number;
    col: number;
    type: ModakType;
    specialType: 'chakra' | 'trishul' | 'blast';
  }[];
  clearedModakCounts: Record<ModakType, number>;
}

/**
 * Creates a unique ID for a tile at a specific row/col with timestamp
 */
export function createTile(
  row: number,
  col: number,
  type: ModakType,
  isRooted: boolean = false
): ModakTile {
  return {
    id: `tile-${row}-${col}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
    row,
    col,
    type,
    isSpecial: type.startsWith('special'),
    specialType:
      type === 'special_chakra'
        ? 'chakra'
        : type === 'special_trishul'
        ? 'trishul'
        : type === 'special_surya_blast'
        ? 'blast'
        : undefined,
    isRooted,
    dropDistance: 0,
  };
}

/**
 * Generates a random standard modak type from allowed types or full list
 */
export function getRandomModakType(allowedTypes?: ModakType[]): ModakType {
  const pool = allowedTypes && allowedTypes.length >= 3 ? allowedTypes : STANDARD_MODAK_TYPES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Check whether two coordinates are strictly adjacent horizontally or vertically (no diagonals)
 */
export function isAdjacent(
  t1: { row: number; col: number },
  t2: { row: number; col: number }
): boolean {
  const dr = Math.abs(t1.row - t2.row);
  const dc = Math.abs(t1.col - t2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/**
 * Generates an initial board with NO automatic 3-in-a-row matches,
 * ensuring at least one legal move exists.
 */
export function generateInitialBoard(
  hasRootedTiles: boolean = false,
  allowedTypes?: ModakType[]
): ModakTile[][] {
  const pool = allowedTypes && allowedTypes.length >= 3 ? allowedTypes : STANDARD_MODAK_TYPES;
  let board: ModakTile[][] = [];
  let attempts = 0;

  do {
    board = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      const row: ModakTile[] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        // Pick random type that does NOT create an initial 3-in-a-row
        const forbidden: ModakType[] = [];
        if (c >= 2 && row[c - 1].type === row[c - 2].type) {
          forbidden.push(row[c - 1].type);
        }
        if (r >= 2 && board[r - 1][c].type === board[r - 2][c].type) {
          forbidden.push(board[r - 1][c].type);
        }

        const available = pool.filter((t) => !forbidden.includes(t));
        const chosenType =
          available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : getRandomModakType(pool);

        const isRooted = hasRootedTiles && ((r === 1 && c === 1) || (r === 5 && c === 5));
        row.push(createTile(r, c, chosenType, isRooted));
      }
      board.push(row);
    }
    attempts++;
  } while ((!hasLegalMoves(board) || detectMatches(board).matchedTileIds.size > 0) && attempts < 40);

  return board;
}

interface RunInfo {
  type: ModakType;
  direction: 'h' | 'v';
  line: number; // row for h, col for v
  start: number; // startCol for h, startRow for v
  end: number; // endCol for h, endRow for v
  length: number;
}

/**
 * Detects all horizontal and vertical matches on the board.
 * Correctly identifies 3-match, 4-match (creates chakra), 5-match (creates trishul),
 * and L/T matches (creates surya blast).
 * Propagates special tile activations cleanly.
 */
export function detectMatches(
  board: ModakTile[][],
  swapPivot?: { row: number; col: number }
): MatchResult {
  const horizontalRuns: RunInfo[] = [];
  const verticalRuns: RunInfo[] = [];

  // 1. Horizontal scan for contiguous runs >= 3
  for (let r = 0; r < BOARD_ROWS; r++) {
    let matchLength = 1;
    for (let c = 0; c < BOARD_COLS; c++) {
      const current = board[r][c];
      const next = c < BOARD_COLS - 1 ? board[r][c + 1] : null;

      if (
        next &&
        current &&
        !current.type.startsWith('special') &&
        current.type === next.type
      ) {
        matchLength++;
      } else {
        if (matchLength >= 3 && current && !current.type.startsWith('special')) {
          horizontalRuns.push({
            type: current.type,
            direction: 'h',
            line: r,
            start: c - matchLength + 1,
            end: c,
            length: matchLength,
          });
        }
        matchLength = 1;
      }
    }
  }

  // 2. Vertical scan for contiguous runs >= 3
  for (let c = 0; c < BOARD_COLS; c++) {
    let matchLength = 1;
    for (let r = 0; r < BOARD_ROWS; r++) {
      const current = board[r][c];
      const next = r < BOARD_ROWS - 1 ? board[r + 1][c] : null;

      if (
        next &&
        current &&
        !current.type.startsWith('special') &&
        current.type === next.type
      ) {
        matchLength++;
      } else {
        if (matchLength >= 3 && current && !current.type.startsWith('special')) {
          verticalRuns.push({
            type: current.type,
            direction: 'v',
            line: c,
            start: r - matchLength + 1,
            end: r,
            length: matchLength,
          });
        }
        matchLength = 1;
      }
    }
  }

  const matchedTileIds = new Set<string>();
  const specialPiecesToCreate: MatchResult['specialPiecesToCreate'] = [];
  const clearedModakCounts: Record<ModakType, number> = {
    kesar: 0,
    gulab: 0,
    tulsi: 0,
    neel: 0,
    manek: 0,
    surya: 0,
    special_chakra: 0,
    special_trishul: 0,
    special_surya_blast: 0,
  };

  let scoreGained = 0;
  let energyGained = 0;

  // Track which runs were consumed as part of an L or T match
  const consumedHorizontalRuns = new Set<number>();
  const consumedVerticalRuns = new Set<number>();

  // 3. Find L / T / + intersections of identical color
  for (let hIdx = 0; hIdx < horizontalRuns.length; hIdx++) {
    const h = horizontalRuns[hIdx];
    for (let vIdx = 0; vIdx < verticalRuns.length; vIdx++) {
      const v = verticalRuns[vIdx];
      if (
        h.type === v.type &&
        v.line >= h.start &&
        v.line <= h.end &&
        h.line >= v.start &&
        h.line <= v.end
      ) {
        // Intersection point: (h.line, v.line)
        const interRow = h.line;
        const interCol = v.line;

        consumedHorizontalRuns.add(hIdx);
        consumedVerticalRuns.add(vIdx);

        // Place special piece at swap pivot if the pivot was part of this intersection,
        // otherwise place at the intersection tile itself
        const targetRow =
          swapPivot &&
          ((swapPivot.row === interRow && swapPivot.col >= h.start && swapPivot.col <= h.end) ||
            (swapPivot.col === interCol && swapPivot.row >= v.start && swapPivot.row <= v.end))
            ? swapPivot.row
            : interRow;

        const targetCol =
          swapPivot &&
          ((swapPivot.row === interRow && swapPivot.col >= h.start && swapPivot.col <= h.end) ||
            (swapPivot.col === interCol && swapPivot.row >= v.start && swapPivot.row <= v.end))
            ? swapPivot.col
            : interCol;

        // Check if a 5-in-a-row exists on either arm
        if (h.length >= 5 || v.length >= 5) {
          specialPiecesToCreate.push({
            row: targetRow,
            col: targetCol,
            type: 'special_trishul',
            specialType: 'trishul',
          });
          scoreGained += 100;
          energyGained += 50;
        } else {
          specialPiecesToCreate.push({
            row: targetRow,
            col: targetCol,
            type: 'special_surya_blast',
            specialType: 'blast',
          });
          scoreGained += 90;
          energyGained += 35;
        }

        // Add all tiles from both arms
        for (let c = h.start; c <= h.end; c++) {
          matchedTileIds.add(board[h.line][c].id);
        }
        for (let r = v.start; r <= v.end; r++) {
          matchedTileIds.add(board[r][v.line].id);
        }
      }
    }
  }

  // 4. Process non-consumed horizontal runs
  for (let hIdx = 0; hIdx < horizontalRuns.length; hIdx++) {
    if (consumedHorizontalRuns.has(hIdx)) continue;
    const run = horizontalRuns[hIdx];

    if (run.length >= 5) {
      // 5-match -> Trishul Rainbow Modak
      scoreGained += 100;
      energyGained += 50;
      const targetCol =
        swapPivot && swapPivot.row === run.line && swapPivot.col >= run.start && swapPivot.col <= run.end
          ? swapPivot.col
          : Math.floor((run.start + run.end) / 2);

      specialPiecesToCreate.push({
        row: run.line,
        col: targetCol,
        type: 'special_trishul',
        specialType: 'trishul',
      });
    } else if (run.length === 4) {
      // 4-match -> Chakra Beam
      scoreGained += 60;
      energyGained += 25;
      const targetCol =
        swapPivot && swapPivot.row === run.line && swapPivot.col >= run.start && swapPivot.col <= run.end
          ? swapPivot.col
          : Math.floor((run.start + run.end) / 2);

      specialPiecesToCreate.push({
        row: run.line,
        col: targetCol,
        type: 'special_chakra',
        specialType: 'chakra',
      });
    } else {
      // Standard 3-match
      scoreGained += 30;
      energyGained += 10;
    }

    for (let c = run.start; c <= run.end; c++) {
      matchedTileIds.add(board[run.line][c].id);
    }
  }

  // 5. Process non-consumed vertical runs
  for (let vIdx = 0; vIdx < verticalRuns.length; vIdx++) {
    if (consumedVerticalRuns.has(vIdx)) continue;
    const run = verticalRuns[vIdx];

    if (run.length >= 5) {
      scoreGained += 100;
      energyGained += 50;
      const targetRow =
        swapPivot && swapPivot.col === run.line && swapPivot.row >= run.start && swapPivot.row <= run.end
          ? swapPivot.row
          : Math.floor((run.start + run.end) / 2);

      specialPiecesToCreate.push({
        row: targetRow,
        col: run.line,
        type: 'special_trishul',
        specialType: 'trishul',
      });
    } else if (run.length === 4) {
      scoreGained += 60;
      energyGained += 25;
      const targetRow =
        swapPivot && swapPivot.col === run.line && swapPivot.row >= run.start && swapPivot.row <= run.end
          ? swapPivot.row
          : Math.floor((run.start + run.end) / 2);

      specialPiecesToCreate.push({
        row: targetRow,
        col: run.line,
        type: 'special_chakra',
        specialType: 'chakra',
      });
    } else {
      scoreGained += 30;
      energyGained += 10;
    }

    for (let r = run.start; r <= run.end; r++) {
      matchedTileIds.add(board[r][run.line].id);
    }
  }

  // Count cleared tiles and award 10 base points per tile
  scoreGained += matchedTileIds.size * 10;

  // 6. Chain Reaction for Special Tiles within matched set
  const activatedSpecials = new Set<string>();
  const specialQueue: ModakTile[] = [];

  // Find all special tiles inside initial matched set
  for (const id of Array.from(matchedTileIds)) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const tile = board[r][c];
        if (tile.id === id && tile.isSpecial && !activatedSpecials.has(tile.id)) {
          specialQueue.push(tile);
          activatedSpecials.add(tile.id);
        }
      }
    }
  }

  // Process queue of activated special tiles
  while (specialQueue.length > 0) {
    const spTile = specialQueue.shift()!;
    scoreGained += 80;
    energyGained += 25;

    const newlyHitIds = new Set<string>();
    triggerSpecialTileEffect(board, spTile, newlyHitIds);

    for (const hitId of Array.from(newlyHitIds)) {
      matchedTileIds.add(hitId);
      // Check if newly hit tile is another special tile that hasn't activated yet
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const tile = board[r][c];
          if (tile.id === hitId && tile.isSpecial && !activatedSpecials.has(tile.id)) {
            activatedSpecials.add(tile.id);
            specialQueue.push(tile);
          }
        }
      }
    }
  }

  // Populate cleared modak counts
  for (const id of Array.from(matchedTileIds)) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (board[r][c].id === id) {
          const t = board[r][c].type;
          clearedModakCounts[t] = (clearedModakCounts[t] || 0) + 1;
        }
      }
    }
  }

  return {
    matchedTileIds,
    scoreGained,
    energyGained,
    specialPiecesToCreate,
    clearedModakCounts,
  };
}

/**
 * Triggers a special tile's area effect (Chakra beam, Surya blast, Trishul diamond)
 */
export function triggerSpecialTileEffect(
  board: ModakTile[][],
  tile: ModakTile,
  matchedIds: Set<string>
): void {
  matchedIds.add(tile.id);

  if (tile.type === 'special_chakra') {
    // Clear entire row & col (Divine Cross Beam)
    for (let c = 0; c < BOARD_COLS; c++) {
      matchedIds.add(board[tile.row][c].id);
    }
    for (let r = 0; r < BOARD_ROWS; r++) {
      matchedIds.add(board[r][tile.col].id);
    }
  } else if (tile.type === 'special_surya_blast') {
    // 3x3 surrounding blast (Sacred Aura Blast)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = tile.row + dr;
        const nc = tile.col + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          matchedIds.add(board[nr][nc].id);
        }
      }
    }
  } else if (tile.type === 'special_trishul') {
    // 5x5 massive radiant blast
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = tile.row + dr;
        const nc = tile.col + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          if (Math.abs(dr) + Math.abs(dc) <= 2) {
            matchedIds.add(board[nr][nc].id);
          }
        }
      }
    }
  }
}

/**
 * Handles swapping between two special tiles, or a Trishul with any tile.
 */
export function handleSpecialSwap(
  board: ModakTile[][],
  t1: ModakTile,
  t2: ModakTile
): {
  matchedTileIds: Set<string>;
  scoreGained: number;
  energyGained: number;
  isSpecialCombo: boolean;
} {
  const matchedTileIds = new Set<string>();
  matchedTileIds.add(t1.id);
  matchedTileIds.add(t2.id);

  // Case 1: Trishul + Trishul -> PURGE ENTIRE BOARD!
  if (t1.type === 'special_trishul' && t2.type === 'special_trishul') {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        matchedTileIds.add(board[r][c].id);
      }
    }
    return {
      matchedTileIds,
      scoreGained: 2000,
      energyGained: 50,
      isSpecialCombo: true,
    };
  }

  // Case 2a: Trishul + Chakra -> Convert all tiles of dominant color into Chakras and detonate!
  if (
    (t1.type === 'special_trishul' && t2.type === 'special_chakra') ||
    (t1.type === 'special_chakra' && t2.type === 'special_trishul')
  ) {
    const counts: Record<string, number> = {};
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const type = board[r][c].type;
        if (!type.startsWith('special')) {
          counts[type] = (counts[type] || 0) + 1;
        }
      }
    }
    const dominantColor = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'kesar';
    let hits = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (board[r][c].type === dominantColor) {
          hits++;
          for (let col = 0; col < BOARD_COLS; col++) matchedTileIds.add(board[r][col].id);
          for (let row = 0; row < BOARD_ROWS; row++) matchedTileIds.add(board[row][c].id);
        }
      }
    }
    return {
      matchedTileIds,
      scoreGained: 1200 + hits * 50,
      energyGained: 60,
      isSpecialCombo: true,
    };
  }

  // Case 2b: Trishul + Surya Blast -> Convert all tiles of dominant color into Blasts and detonate!
  if (
    (t1.type === 'special_trishul' && t2.type === 'special_surya_blast') ||
    (t1.type === 'special_surya_blast' && t2.type === 'special_trishul')
  ) {
    const counts: Record<string, number> = {};
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const type = board[r][c].type;
        if (!type.startsWith('special')) {
          counts[type] = (counts[type] || 0) + 1;
        }
      }
    }
    const dominantColor = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'kesar';
    let hits = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (board[r][c].type === dominantColor) {
          hits++;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
                matchedTileIds.add(board[nr][nc].id);
              }
            }
          }
        }
      }
    }
    return {
      matchedTileIds,
      scoreGained: 1400 + hits * 60,
      energyGained: 60,
      isSpecialCombo: true,
    };
  }

  // Case 2c: Trishul + any other modak -> Purge all of that color on the board!
  if (t1.type === 'special_trishul' || t2.type === 'special_trishul') {
    const targetTile = t1.type === 'special_trishul' ? t2 : t1;
    const targetColor = targetTile.type;

    let count = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (board[r][c].type === targetColor || board[r][c].type === 'special_chakra') {
          matchedTileIds.add(board[r][c].id);
          count++;
        }
      }
    }
    return {
      matchedTileIds,
      scoreGained: count * 40 + 200,
      energyGained: Math.min(50, count * 4 + 20),
      isSpecialCombo: true,
    };
  }

  // Case 3: Chakra + Chakra -> Clears 3 full rows & 3 full cols centered on the swap!
  if (t1.type === 'special_chakra' && t2.type === 'special_chakra') {
    const centerRow = Math.min(t1.row, t2.row);
    const centerCol = Math.min(t1.col, t2.col);
    for (let dr = -1; dr <= 1; dr++) {
      const r = centerRow + dr;
      if (r >= 0 && r < BOARD_ROWS) {
        for (let c = 0; c < BOARD_COLS; c++) matchedTileIds.add(board[r][c].id);
      }
    }
    for (let dc = -1; dc <= 1; dc++) {
      const c = centerCol + dc;
      if (c >= 0 && c < BOARD_COLS) {
        for (let r = 0; r < BOARD_ROWS; r++) matchedTileIds.add(board[r][c].id);
      }
    }
    return {
      matchedTileIds,
      scoreGained: 450,
      energyGained: 30,
      isSpecialCombo: true,
    };
  }

  // Case 4: Blast + Blast -> Giant 5x5 nuclear blast!
  if (t1.type === 'special_surya_blast' && t2.type === 'special_surya_blast') {
    const centerRow = Math.floor((t1.row + t2.row) / 2);
    const centerCol = Math.floor((t1.col + t2.col) / 2);
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = centerRow + dr;
        const nc = centerCol + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          matchedTileIds.add(board[nr][nc].id);
        }
      }
    }
    return {
      matchedTileIds,
      scoreGained: 500,
      energyGained: 35,
      isSpecialCombo: true,
    };
  }

  // Case 5: Chakra + Blast -> 3 full rows and 3 full columns cleared!
  if (
    (t1.type === 'special_chakra' && t2.type === 'special_surya_blast') ||
    (t1.type === 'special_surya_blast' && t2.type === 'special_chakra')
  ) {
    const minR = Math.max(0, Math.min(t1.row, t2.row) - 1);
    const maxR = Math.min(BOARD_ROWS - 1, Math.max(t1.row, t2.row) + 1);
    const minC = Math.max(0, Math.min(t1.col, t2.col) - 1);
    const maxC = Math.min(BOARD_COLS - 1, Math.max(t1.col, t2.col) + 1);

    for (let r = minR; r <= maxR; r++) {
      for (let c = 0; c < BOARD_COLS; c++) matchedTileIds.add(board[r][c].id);
    }
    for (let c = minC; c <= maxC; c++) {
      for (let r = 0; r < BOARD_ROWS; r++) matchedTileIds.add(board[r][c].id);
    }
    return {
      matchedTileIds,
      scoreGained: 600,
      energyGained: 40,
      isSpecialCombo: true,
    };
  }

  return {
    matchedTileIds: new Set<string>(),
    scoreGained: 0,
    energyGained: 0,
    isSpecialCombo: false,
  };
}

/**
 * Apply gravity: tiles fall into cleared spaces, and new tiles spawn from above.
 * Accurately tracks dropDistance for physical falling animations.
 */
export function applyGravityAndRefill(
  board: ModakTile[][],
  clearedTileIds: Set<string>,
  specialPiecesToCreate: MatchResult['specialPiecesToCreate'] = [],
  allowedTypes?: ModakType[]
): ModakTile[][] {
  const newBoard: ModakTile[][] = [];

  // Clone board
  for (let r = 0; r < BOARD_ROWS; r++) {
    newBoard.push(board[r].map((t) => ({ ...t, dropDistance: 0, isClearing: false, isMatched: false })));
  }

  // Set of positions that are transforming into a newly created special piece
  const specialCoordSet = new Set<string>();
  for (const sp of specialPiecesToCreate) {
    specialCoordSet.add(`${sp.row},${sp.col}`);
  }

  // Remove cleared tiles (set to null placeholder), EXCEPT tiles transforming into special pieces
  const grid: (ModakTile | null)[][] = newBoard.map((row, r) =>
    row.map((t, c) => {
      if (specialCoordSet.has(`${r},${c}`)) {
        return t; // Will be mutated to special piece
      }
      return clearedTileIds.has(t.id) ? null : t;
    })
  );

  // Transform designated positions into their newly forged special pieces
  for (const sp of specialPiecesToCreate) {
    grid[sp.row][sp.col] = createTile(sp.row, sp.col, sp.type);
  }

  // Column by column gravity drop
  for (let c = 0; c < BOARD_COLS; c++) {
    const remainingInCol: { tile: ModakTile; oldRow: number }[] = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) {
        remainingInCol.push({ tile: grid[r][c]!, oldRow: r });
      }
    }

    // Bottom-up placement of surviving tiles
    let writeRow = BOARD_ROWS - 1;
    for (const item of remainingInCol) {
      const dropDistance = writeRow - item.oldRow;
      item.tile.row = writeRow;
      item.tile.col = c;
      item.tile.dropDistance = dropDistance;
      grid[writeRow][c] = item.tile;
      writeRow--;
    }

    // Fill remaining empty top cells with newly generated modaks
    const emptyCount = writeRow + 1;
    while (writeRow >= 0) {
      const newTile = createTile(writeRow, c, getRandomModakType(allowedTypes));
      // Physical drop animation: new tile falls in from above the board
      newTile.dropDistance = emptyCount;
      grid[writeRow][c] = newTile;
      writeRow--;
    }
  }

  // Finalize grid
  return grid.map((row, r) =>
    row.map((tile, c) => ({
      ...tile!,
      row: r,
      col: c,
      isClearing: false,
      isMatched: false,
    }))
  );
}

/**
 * Checks if the board has any legal moves available.
 */
export function hasLegalMoves(board: ModakTile[][]): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      // Check horizontal swap
      if (c < BOARD_COLS - 1) {
        if (canSwapCreateMatch(board, r, c, r, c + 1)) {
          return true;
        }
      }
      // Check vertical swap
      if (r < BOARD_ROWS - 1) {
        if (canSwapCreateMatch(board, r, c, r + 1, c)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Finds the first available legal move on the board for the idle hint indicator.
 */
export function findPossibleMove(
  board: ModakTile[][]
): { r1: number; c1: number; r2: number; c2: number } | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (c < BOARD_COLS - 1 && canSwapCreateMatch(board, r, c, r, c + 1)) {
        return { r1: r, c1: c, r2: r, c2: c + 1 };
      }
      if (r < BOARD_ROWS - 1 && canSwapCreateMatch(board, r, c, r + 1, c)) {
        return { r1: r, c1: c, r2: r + 1, c2: c };
      }
    }
  }
  return null;
}

/**
 * Determines whether swapping two adjacent positions produces a match or valid special move.
 */
export function canSwapCreateMatch(
  board: ModakTile[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  const t1 = board[r1]?.[c1];
  const t2 = board[r2]?.[c2];
  if (!t1 || !t2) return false;
  if (t1.isRooted || t2.isRooted) return false;

  // Swapping with Trishul is ALWAYS a legal power move!
  if (t1.type === 'special_trishul' || t2.type === 'special_trishul') {
    return true;
  }

  // Swapping two special tiles together is ALWAYS a legal power move!
  if (t1.isSpecial && t2.isSpecial) {
    return true;
  }

  // Simulate swap on candidate board
  const testBoard = board.map((row) => row.map((t) => ({ ...t })));
  testBoard[r1][c1].type = t2.type;
  testBoard[r2][c2].type = t1.type;

  // Check 3-in-a-row at either swapped position
  return hasMatchAt(testBoard, r1, c1) || hasMatchAt(testBoard, r2, c2);
}

function hasMatchAt(board: ModakTile[][], r: number, c: number): boolean {
  const tile = board[r]?.[c];
  if (!tile) return false;
  const type = tile.type;
  if (type.startsWith('special')) return false;

  // Horizontal count
  let hCount = 1;
  let left = c - 1;
  while (left >= 0 && board[r][left].type === type) {
    hCount++;
    left--;
  }
  let right = c + 1;
  while (right < BOARD_COLS && board[r][right].type === type) {
    hCount++;
    right++;
  }
  if (hCount >= 3) return true;

  // Vertical count
  let vCount = 1;
  let up = r - 1;
  while (up >= 0 && board[up][c].type === type) {
    vCount++;
    up--;
  }
  let down = r + 1;
  while (down < BOARD_ROWS && board[down][c].type === type) {
    vCount++;
    down++;
  }
  return vCount >= 3;
}

/**
 * Shuffles current board until at least one legal move exists and no initial matches exist.
 * Guaranteed never to freeze or enter an infinite loop.
 */
export function shuffleBoard(board: ModakTile[][], allowedTypes?: ModakType[]): ModakTile[][] {
  const types: ModakType[] = [];
  for (const row of board) {
    for (const tile of row) {
      types.push(tile.type);
    }
  }

  let shuffled: ModakTile[][] = [];
  let attempts = 0;

  do {
    // Fisher-Yates shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    shuffled = [];
    let idx = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      const row: ModakTile[] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        row.push(createTile(r, c, types[idx++], board[r][c]?.isRooted || false));
      }
      shuffled.push(row);
    }
    attempts++;
  } while (
    (!hasLegalMoves(shuffled) || detectMatches(shuffled).matchedTileIds.size > 0) &&
    attempts < 30
  );

  // If 30 attempts fail, fallback to a clean generated board
  if (!hasLegalMoves(shuffled) || detectMatches(shuffled).matchedTileIds.size > 0) {
    return generateInitialBoard(false, allowedTypes);
  }

  return shuffled;
}
