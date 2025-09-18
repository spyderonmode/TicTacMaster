export type GameBoard = Record<string, string>;
export type WinCondition = 'diagonal' | 'horizontal' | 'vertical' | null;

// Valid positions in the 3x5 grid (1-15)
export const VALID_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Position mapping for the 3x5 grid
export const POSITION_MAP = {
  // Row 1
  1: { row: 0, col: 0 },
  2: { row: 0, col: 1 },
  3: { row: 0, col: 2 },
  4: { row: 0, col: 3 },
  5: { row: 0, col: 4 },
  // Row 2
  6: { row: 1, col: 0 },
  7: { row: 1, col: 1 },
  8: { row: 1, col: 2 },
  9: { row: 1, col: 3 },
  10: { row: 1, col: 4 },
  // Row 3
  11: { row: 2, col: 0 },
  12: { row: 2, col: 1 },
  13: { row: 2, col: 2 },
  14: { row: 2, col: 3 },
  15: { row: 2, col: 4 },
};

export function isValidPosition(position: number): boolean {
  return VALID_POSITIONS.includes(position);
}

export function isPositionEmpty(board: GameBoard, position: number): boolean {
  return !board[position.toString()];
}

export function makeMove(board: GameBoard, position: number, player: string): GameBoard {
  if (!isValidPosition(position) || !isPositionEmpty(board, position)) {
    throw new Error('Invalid move');
  }
  
  return {
    ...board,
    [position.toString()]: player,
  };
}

export function checkHorizontalWin(board: GameBoard, player: string): boolean {
  // Check for 4 consecutive tokens horizontally in any row
  const rows = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ];
  
  for (const row of rows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const positions = row.slice(i, i + 4);
      if (positions.every(pos => board[pos.toString()] === player)) {
        return true;
      }
    }
  }
  
  return false;
}

export function checkVerticalWin(board: GameBoard, player: string): boolean {
  // Check for 3 consecutive tokens vertically in any column
  const columns = [
    [1, 6, 11],   // Column 1
    [2, 7, 12],   // Column 2
    [3, 8, 13],   // Column 3
    [4, 9, 14],   // Column 4
    [5, 10, 15]   // Column 5
  ];
  
  for (const column of columns) {
    if (column.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }
  
  return false;
}

export function checkDiagonalWin(board: GameBoard, player: string): boolean {
  // Define diagonal patterns for 3 consecutive positions on the 3x5 grid
  // STRICTLY exclude any patterns that include positions 5, 10, or 15 (last column)
  const diagonalPatterns = [
    // Main diagonals (top-left to bottom-right) - ONLY those without positions 5, 10, 15
    [1, 7, 13],   // 1 -> 7 -> 13 (valid: no positions 5, 10, 15)
    [2, 8, 14],   // 2 -> 8 -> 14 (valid: no positions 5, 10, 15)
    // [3, 9, 15] - EXCLUDED (contains position 15)
    
    // Anti-diagonals (top-right to bottom-left) - ONLY those without positions 5, 10, 15
    [3, 7, 11],   // 3 -> 7 -> 11 (valid: no positions 5, 10, 15)
    [4, 8, 12],   // 4 -> 8 -> 12 (valid: no positions 5, 10, 15)
    // [5, 9, 13] - EXCLUDED (contains position 5)
    
    // All other diagonal patterns are excluded because they contain positions 5, 10, or 15
  ];

  // Additional validation: ensure no pattern contains restricted positions
  const restrictedPositions = [5, 10, 15];
  
  for (const pattern of diagonalPatterns) {
    // Double-check that pattern doesn't contain restricted positions
    const hasRestrictedPosition = pattern.some(pos => restrictedPositions.includes(pos));
    if (hasRestrictedPosition) {
      continue; // Skip this pattern
    }
    
    if (pattern.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }

  return false;
}

export function checkWin(board: GameBoard, player: string): { winner: boolean; condition: WinCondition; winningPositions?: number[] } {
  // Check horizontal wins
  const horizontalWin = checkHorizontalWinWithPositions(board, player);
  if (horizontalWin.winner) {
    return { winner: true, condition: 'horizontal', winningPositions: horizontalWin.positions };
  }
  
  // Check vertical wins
  const verticalWin = checkVerticalWinWithPositions(board, player);
  if (verticalWin.winner) {
    return { winner: true, condition: 'vertical', winningPositions: verticalWin.positions };
  }
  
  // Check diagonal wins
  const diagonalWin = checkDiagonalWinWithPositions(board, player);
  if (diagonalWin.winner) {
    return { winner: true, condition: 'diagonal', winningPositions: diagonalWin.positions };
  }
  
  return { winner: false, condition: null };
}

function checkHorizontalWinWithPositions(board: GameBoard, player: string): { winner: boolean; positions?: number[] } {
  const rows = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ];
  
  for (const row of rows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const positions = row.slice(i, i + 4);
      if (positions.every(pos => board[pos.toString()] === player)) {
        return { winner: true, positions };
      }
    }
  }
  return { winner: false };
}

function checkVerticalWinWithPositions(board: GameBoard, player: string): { winner: boolean; positions?: number[] } {
  const columns = [
    [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
  ];
  
  for (const column of columns) {
    if (column.every(pos => board[pos.toString()] === player)) {
      return { winner: true, positions: column };
    }
  }
  return { winner: false };
}

function checkDiagonalWinWithPositions(board: GameBoard, player: string): { winner: boolean; positions?: number[] } {
  const validDiagonals = [
    [1, 7, 13], [2, 8, 14], [3, 7, 11], [4, 8, 12]
  ];
  
  for (const diagonal of validDiagonals) {
    if (diagonal.every(pos => board[pos.toString()] === player)) {
      return { winner: true, positions: diagonal };
    }
  }
  return { winner: false };
}

export function checkDraw(board: GameBoard): boolean {
  return VALID_POSITIONS.every(pos => board[pos.toString()]);
}

export function getAvailableMoves(board: GameBoard): number[] {
  return VALID_POSITIONS.filter(pos => isPositionEmpty(board, pos));
}

export function getOpponentSymbol(player: string): string {
  return player === 'X' ? 'O' : 'X';
}

export function validateMove(board: GameBoard, position: number, player: string): boolean {
  return isValidPosition(position) && isPositionEmpty(board, position);
}
