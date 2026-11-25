export type GameState =
  | 'MENU'
  | 'LEVEL_SELECT'
  | 'AIMING'
  | 'FLYING'
  | 'SETTLING'
  | 'PAUSED'
  | 'WON'
  | 'LOST';

const PLAY_STATES = new Set<GameState>(['AIMING', 'FLYING', 'SETTLING']);

export class GameStateMachine {
  private current: GameState = 'MENU';
  private beforePause: GameState = 'AIMING';

  get state(): GameState {
    return this.current;
  }

  get isPlaying(): boolean {
    return PLAY_STATES.has(this.current);
  }

  set(state: GameState): GameState {
    const previous = this.current;
    if (state === 'PAUSED' && this.isPlaying) this.beforePause = this.current;
    this.current = state;
    return previous;
  }

  pause(): boolean {
    if (!this.isPlaying) return false;
    this.set('PAUSED');
    return true;
  }

  resume(): boolean {
    if (this.current !== 'PAUSED') return false;
    this.set(this.beforePause);
    return true;
  }
}
