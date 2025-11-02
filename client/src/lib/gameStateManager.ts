const GAME_STATE_KEY = 'tictactoe_game_state';
const PENDING_MOVES_KEY = 'tictactoe_pending_moves';

export interface GameState {
  gameId: string;
  board: Record<string, string>;
  currentPlayer: 'X' | 'O';
  lastMove: number | null;
  timestamp: number;
  mode: 'online' | 'ai' | 'pass-play';
}

export interface PendingMove {
  gameId: string;
  position: number;
  player: 'X' | 'O';
  timestamp: number;
}

export class GameStateManager {
  static saveGameState(state: GameState): void {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateWithTimestamp));
      sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  static loadGameState(): GameState | null {
    try {
      const stored = localStorage.getItem(GAME_STATE_KEY) || sessionStorage.getItem(GAME_STATE_KEY);
      if (!stored) return null;

      const state = JSON.parse(stored) as GameState;
      
      const age = Date.now() - state.timestamp;
      const MAX_AGE = 24 * 60 * 60 * 1000;
      
      if (age > MAX_AGE) {
        this.clearGameState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  static clearGameState(): void {
    try {
      localStorage.removeItem(GAME_STATE_KEY);
      sessionStorage.removeItem(GAME_STATE_KEY);
    } catch (error) {
      console.error('Failed to clear game state:', error);
    }
  }

  static savePendingMove(move: PendingMove): void {
    try {
      const existing = this.loadPendingMoves();
      const updated = [...existing, { ...move, timestamp: Date.now() }];
      localStorage.setItem(PENDING_MOVES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save pending move:', error);
    }
  }

  static loadPendingMoves(): PendingMove[] {
    try {
      const stored = localStorage.getItem(PENDING_MOVES_KEY);
      if (!stored) return [];

      const moves = JSON.parse(stored) as PendingMove[];
      
      const validMoves = moves.filter(move => {
        const age = Date.now() - move.timestamp;
        return age < 60 * 60 * 1000;
      });

      if (validMoves.length !== moves.length) {
        localStorage.setItem(PENDING_MOVES_KEY, JSON.stringify(validMoves));
      }

      return validMoves;
    } catch (error) {
      console.error('Failed to load pending moves:', error);
      return [];
    }
  }

  static clearPendingMoves(gameId?: string): void {
    try {
      if (gameId) {
        const moves = this.loadPendingMoves();
        const filtered = moves.filter(move => move.gameId !== gameId);
        localStorage.setItem(PENDING_MOVES_KEY, JSON.stringify(filtered));
      } else {
        localStorage.removeItem(PENDING_MOVES_KEY);
      }
    } catch (error) {
      console.error('Failed to clear pending moves:', error);
    }
  }

  static hasRecentState(gameId: string): boolean {
    const state = this.loadGameState();
    if (!state || state.gameId !== gameId) return false;

    const age = Date.now() - state.timestamp;
    return age < 5 * 60 * 1000;
  }
}
