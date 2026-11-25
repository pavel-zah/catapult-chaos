/** ID счётчика должен совпадать со сниппетом Яндекс.Метрики в index.html. */
const COUNTER_ID = 114661698;

/**
 * В dev-режиме цели не отправляются, чтобы прогоны при разработке не портили
 * статистику. Принудительно включить можно параметром `?ymdebug` в адресе.
 */
const SEND_GOALS = import.meta.env.PROD || new URLSearchParams(location.search).has('ymdebug');

type MetrikaParams = Record<string, string | number>;
type MetrikaFunction = (counterId: number, method: string, ...args: unknown[]) => void;
type EndReason = 'out_of_cats' | 'treasure_lost' | 'restart' | 'menu';

/** Отправляет JavaScript-цель; при блокировщике рекламы или сбое молча ничего не делает. */
function reachGoal(goal: string, params: MetrikaParams): void {
  if (!SEND_GOALS) return;
  const metrika = (window as Window & { ym?: MetrikaFunction }).ym;
  if (typeof metrika !== 'function') return;
  try {
    metrika(COUNTER_ID, 'reachGoal', goal, params);
  } catch {
    // Статистика не должна прерывать уровень.
  }
}

interface OpenAttempt {
  levelId: string;
  number: number;
  startedAtMs: number;
}

/**
 * Статистика проходимости: сколько попыток уходит на уровень, где игрок
 * бросает уровень и какая попытка в итоге оказывается успешной.
 * Счётчик попыток живёт в памяти и сбрасывается после победы.
 */
export class Analytics {
  private readonly attempts = new Map<string, number>();
  private open: OpenAttempt | null = null;

  /** Начинает попытку. Незавершённая предыдущая фиксируется как выход или рестарт. */
  beginLevel(levelId: string, nowMs: number): void {
    this.abandon(this.open?.levelId === levelId ? 'restart' : 'menu');
    const number = (this.attempts.get(levelId) ?? 0) + 1;
    this.attempts.set(levelId, number);
    this.open = { levelId, number, startedAtMs: nowMs };
    reachGoal('level_start', {
      level: levelId,
      attempt: number,
      first_try: number === 1 ? 1 : 0,
    });
  }

  /** Фиксирует победу; счётчик попыток уровня начинается заново при повторе. */
  winLevel(stars: number, score: number, nowMs: number): void {
    const attempt = this.close();
    if (!attempt) return;
    reachGoal('level_win', {
      level: attempt.levelId,
      attempt: attempt.number,
      first_try: attempt.number === 1 ? 1 : 0,
      stars,
      score,
      duration_s: this.seconds(attempt, nowMs),
    });
    this.attempts.delete(attempt.levelId);
  }

  /** Фиксирует поражение по правилам уровня. */
  failLevel(reason: EndReason, nowMs: number): void {
    const attempt = this.close();
    if (!attempt) return;
    reachGoal('level_fail', {
      level: attempt.levelId,
      attempt: attempt.number,
      first_try: attempt.number === 1 ? 1 : 0,
      reason,
      duration_s: this.seconds(attempt, nowMs),
    });
  }

  /** Игрок ушёл с уровня, не завершив его: рестарт или выход в меню. */
  abandon(reason: 'restart' | 'menu'): void {
    const attempt = this.close();
    if (!attempt) return;
    reachGoal('level_quit', {
      level: attempt.levelId,
      attempt: attempt.number,
      first_try: attempt.number === 1 ? 1 : 0,
      reason,
    });
  }

  private close(): OpenAttempt | null {
    const attempt = this.open;
    this.open = null;
    return attempt;
  }

  private seconds(attempt: OpenAttempt, nowMs: number): number {
    return Math.max(0, Math.round((nowMs - attempt.startedAtMs) / 1000));
  }
}
