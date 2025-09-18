import { GameBoard, getAvailableMoves, checkWin, getOpponentSymbol, makeMove } from './gameLogic';

export class AIPlayer {
  private symbol: string;
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(symbol: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.symbol = symbol;
    this.difficulty = difficulty;
  }

  makeMove(board: GameBoard): number {
    const availableMoves = getAvailableMoves(board);
    
    if (availableMoves.length === 0) {
      throw new Error('No available moves');
    }

    switch (this.difficulty) {
      case 'easy':
        return this.makeRandomMove(availableMoves);
      case 'medium':
        return this.makeMediumMove(board, availableMoves);
      case 'hard':
        return this.makeHardMove(board, availableMoves);
      default:
        return this.makeRandomMove(availableMoves);
    }
  }

  private makeRandomMove(availableMoves: number[]): number {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  private makeMediumMove(board: GameBoard, availableMoves: number[]): number {
    // 1. Try to win
    const winningMove = this.findWinningMove(board, this.symbol);
    if (winningMove !== null) {
      return winningMove;
    }

    // 2. Try to block opponent from winning
    const opponentSymbol = getOpponentSymbol(this.symbol);
    const blockingMove = this.findWinningMove(board, opponentSymbol);
    if (blockingMove !== null) {
      return blockingMove;
    }

    // 3. Take center positions if available
    const centerPositions = [7, 8];
    const availableCenters = availableMoves.filter(move => centerPositions.includes(move));
    if (availableCenters.length > 0) {
      return availableCenters[Math.floor(Math.random() * availableCenters.length)];
    }

    // 4. Random move
    return this.makeRandomMove(availableMoves);
  }

  private makeHardMove(board: GameBoard, availableMoves: number[]): number {
    // Use minimax algorithm for hard difficulty
    const bestMove = this.minimax(board, 6, true, -Infinity, Infinity);
    return bestMove.position || availableMoves[0];
  }

  private findWinningMove(board: GameBoard, player: string): number | null {
    const availableMoves = getAvailableMoves(board);
    
    for (const move of availableMoves) {
      const testBoard = makeMove(board, move, player);
      const result = checkWin(testBoard, player);
      if (result.winner) {
        return move;
      }
    }
    
    return null;
  }

  private minimax(board: GameBoard, depth: number, isMaximizing: boolean, alpha: number, beta: number): { score: number; position?: number } {
    const availableMoves = getAvailableMoves(board);
    
    // Check terminal states
    const aiResult = checkWin(board, this.symbol);
    const humanResult = checkWin(board, getOpponentSymbol(this.symbol));
    
    if (aiResult.winner) {
      return { score: 10 + depth };
    }
    if (humanResult.winner) {
      return { score: -10 - depth };
    }
    if (availableMoves.length === 0) {
      return { score: 0 };
    }
    if (depth === 0) {
      return { score: this.evaluateBoard(board) };
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove;
      
      for (const move of availableMoves) {
        const testBoard = makeMove(board, move, this.symbol);
        const result = this.minimax(testBoard, depth - 1, false, alpha, beta);
        
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      
      return { score: bestScore, position: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove;
      
      for (const move of availableMoves) {
        const testBoard = makeMove(board, move, getOpponentSymbol(this.symbol));
        const result = this.minimax(testBoard, depth - 1, true, alpha, beta);
        
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        
        beta = Math.min(beta, result.score);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      
      return { score: bestScore, position: bestMove };
    }
  }

  private evaluateBoard(board: GameBoard): number {
    let score = 0;
    
    // Evaluate horizontal patterns
    score += this.evaluateHorizontalPatterns(board);
    
    // Evaluate diagonal patterns
    score += this.evaluateDiagonalPatterns(board);
    
    // Center control bonus
    const centerPositions = [7, 8];
    for (const pos of centerPositions) {
      if (board[pos.toString()] === this.symbol) {
        score += 3;
      } else if (board[pos.toString()] === getOpponentSymbol(this.symbol)) {
        score -= 3;
      }
    }
    
    return score;
  }

  private evaluateHorizontalPatterns(board: GameBoard): number {
    // No horizontal patterns since only diagonal wins count
    return 0;
  }

  private evaluateDiagonalPatterns(board: GameBoard): number {
    let score = 0;
    const diagonals = [
      [1, 7, 13],   // Main diagonal
      [2, 8, 14],   // Main diagonal
      [3, 9, 15],   // Main diagonal
      [3, 7, 11],   // Anti-diagonal
      [4, 8, 12],   // Anti-diagonal
      [5, 9, 13],   // Anti-diagonal
      [6, 8, 10],   // Center horizontal diagonal
      [11, 7, 3],   // Anti-diagonal
      [12, 8, 4],   // Anti-diagonal
      [13, 9, 5],   // Anti-diagonal
      [1, 8, 15],   // Long diagonal
      [5, 8, 11],   // Long diagonal
    ];

    for (const diagonal of diagonals) {
      const aiCount = diagonal.filter(pos => board[pos.toString()] === this.symbol).length;
      const humanCount = diagonal.filter(pos => board[pos.toString()] === getOpponentSymbol(this.symbol)).length;
      
      if (aiCount > 0 && humanCount === 0) {
        score += Math.pow(5, aiCount);
      } else if (humanCount > 0 && aiCount === 0) {
        score -= Math.pow(5, humanCount);
      }
    }

    return score;
  }
}
