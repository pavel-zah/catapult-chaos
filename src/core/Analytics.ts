import type { GameProgress } from './StorageAdapter';

/** ID счётчика должен совпадать со сниппетом Яндекс.Метрики в index.html. */
const COUNTER_ID = 114661698;

/**
 * В dev-режиме цели не отправляются, чтобы прогоны при разработке не портили
 * статистику. Принудительно включить можно параметром `?ymdebug` в адресе.
 */
const QUERY = new URLSearchParams(location.search);
const SEND_GOALS = import.meta.env.PROD || QUERY.has('ymdebug');
const LOG_GOALS = !SEND_GOALS || QUERY.has('ymdebug');

type ParamValue = string | number | boolean;
export type AnalyticsParams = Record<string, ParamValue>;

/** Все игровые цели, которые нужно создать в интерфейсе Метрики. */
export type AnalyticsEvent =
  | 'app_open'
  | 'level_start'
  | 'level_win'
  | 'level_fail'
  | 'level_quit'
  | 'cat_shot';

export type LevelOrigin = 'menu' | 'next' | 'restart';
type FailReason = 'out_of_cats' | 'treasure_lost';
type QuitReason = 'restart' | 'menu';

interface LevelMeta {
  level: string;
  starsBefore: number;
  catsTotal: number;
  gadgetTypes: string[];
}

interface OpenAttempt extends LevelMeta {
  attempt: number;
  firstTry: 0 | 1;
  replay: 0 | 1;
  startedAtMs: number;
}

interface ShotState {
  cat: string;
  shot: number;
  startedAtMs: number;
  startScore: number;
  abilityUsed: boolean;
  abilityDelayMs: number;
  usedAfterCollision: boolean;
  collided: boolean;
  kittens: number;
}

interface ShotResult {
  points: number;
  zero: boolean;
  abilityUsed: boolean;
}

interface AbandonContext {
  score?: number;
  nowMs?: number;
  targetsLeft?: number;
  goalsLeft?: number;
}

interface FailStats {
  targetsLeft: number;
  goalsLeft: number;
  unusedCats: number;
}

type MetrikaFunction = (counterId: number, method: string, ...args: unknown[]) => void;

/**
 * Единственная точка отправки игровых метрик. Все события идут только сюда,
 * поэтому имена параметров и нормализация значений живут в одном месте.
 */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  const payload: AnalyticsParams = { ...params, event };
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'number') {
      if (Number.isFinite(value)) payload[key] = Math.round(value);
      else delete payload[key];
    } else if (typeof value === 'boolean') {
      payload[key] = value ? 1 : 0;
    } else if (typeof value === 'string') {
      payload[key] = value.slice(0, 120);
    }
  }

  if (LOG_GOALS) console.info('[metrika]', event, payload);
  if (!SEND_GOALS) return;

  const metrika = (window as Window & { ym?: MetrikaFunction }).ym;
  if (typeof metrika !== 'function') return;

  try {
    metrika(COUNTER_ID, 'reachGoal', event, payload);
  } catch {
    // Статистика не должна прерывать уровень.
  }
}

/**
 * Статистика проходимости: попытки, звёзды, ходы котов и использование
 * способностей. Счётчик попыток живёт в памяти и сбрасывается после победы.
 */
export class Analytics {
  private readonly attempts = new Map<string, number>();
  private readonly wins = new Map<string, number>();
  private readonly usedGadgets = new Set<string>();
  private open: OpenAttempt | null = null;
  private shot: ShotState | null = null;
  private shotIndex = 0;
  private results: ShotResult[] = [];

  /** Игрок открыл игру: знаменатель для воронки и прогресс на входе. */
  appOpen(progress: GameProgress): void {
    const levels = Object.values(progress.levels);
    track('app_open', {
      returning: levels.length > 0 ? 1 : 0,
      levels_cleared: levels.filter((result) => result.stars > 0).length,
      total_stars: levels.reduce((sum, result) => sum + result.stars, 0),
    });
  }

  /** Начинает попытку; предыдущая незавершённая должна быть закрыта через abandon. */
  beginLevel(meta: LevelMeta, from: LevelOrigin, nowMs: number): void {
    if (this.open) this.abandon(this.open.level === meta.level ? 'restart' : 'menu');

    const attempt = (this.attempts.get(meta.level) ?? 0) + 1;
    this.attempts.set(meta.level, attempt);
    this.open = {
      ...meta,
      attempt,
      firstTry: attempt === 1 ? 1 : 0,
      replay: meta.starsBefore > 0 ? 1 : 0,
      startedAtMs: nowMs,
    };
    this.shot = null;
    this.shotIndex = 0;
    this.results = [];
    this.usedGadgets.clear();
    track('level_start', this.levelParams({ from }));
  }

  /** Запуск кота: фиксируем счёт на старте, чтобы посчитать очки хода. */
  beginShot(cat: string, score: number, nowMs: number): void {
    if (!this.open) return;
    this.shotIndex += 1;
    this.shot = {
      cat,
      shot: this.shotIndex,
      startedAtMs: nowMs,
      startScore: score,
      abilityUsed: false,
      abilityDelayMs: 0,
      usedAfterCollision: false,
      collided: false,
      kittens: 0,
    };
  }

  /** Игрок активировал способность: важен момент относительно первого удара. */
  markAbility(nowMs: number, hasCollided: boolean): void {
    const shot = this.shot;
    if (!shot || shot.abilityUsed) return;
    shot.abilityUsed = true;
    shot.abilityDelayMs = Math.max(0, nowMs - shot.startedAtMs);
    shot.usedAfterCollision = hasCollided;
  }

  /** Кот коснулся препятствия — отдельный флаг для ability_timing и collided. */
  markCollision(): void {
    if (this.shot) this.shot.collided = true;
  }

  /** Splitter создал котят: они не считаются отдельными ходами. */
  markKittens(count: number): void {
    if (this.shot) this.shot.kittens += count;
  }

  /** Кот или груз взаимодействовал с гаджетом; храним только факт 0/1. */
  markGadgetUsed(type: string): void {
    if (this.open) this.usedGadgets.add(type);
  }

  /** Ход завершён: отправляем cat_shot и запоминаем результат для агрегатов. */
  endShot(score: number): void {
    const shot = this.shot;
    if (!shot || !this.open) return;
    this.shot = null;

    const points = Math.max(0, score - shot.startScore);
    const result: ShotResult = {
      points,
      zero: points === 0,
      abilityUsed: shot.abilityUsed,
    };
    this.results.push(result);

    const timing = !shot.abilityUsed
      ? 'none'
      : shot.usedAfterCollision ? 'after_hit' : 'before_hit';

    track('cat_shot', this.levelParams({
      shot: shot.shot,
      cat: shot.cat,
      ability_used: shot.abilityUsed ? 1 : 0,
      ability_timing: timing,
      ...(shot.abilityUsed ? { ability_delay_ms: shot.abilityDelayMs } : {}),
      points,
      zero: result.zero ? 1 : 0,
      collided: shot.collided ? 1 : 0,
      ability_miss: !shot.abilityUsed && result.zero ? 1 : 0,
      kittens: shot.kittens,
    }));
  }

  /** Победа: звёзды, повторное прохождение, очки и агрегаты по котам. */
  winLevel(stars: number, score: number, nowMs: number, unusedCats: number, bonusFish: boolean): void {
    const open = this.open;
    if (!open) return;

    const clear = (this.wins.get(open.level) ?? 0) + 1;
    this.wins.set(open.level, clear);
    track('level_win', this.levelParams({
      stars,
      stars_up: stars > open.starsBefore ? 1 : 0,
      clear,
      score,
      duration_s: this.seconds(open, nowMs),
      ...this.catStats(unusedCats),
      bonus_fish: bonusFish ? 1 : 0,
      ...this.gadgetParams(),
    }));

    this.attempts.delete(open.level);
    this.open = null;
    this.shot = null;
  }

  /** Поражение по правилам уровня. */
  failLevel(reason: FailReason, score: number, nowMs: number, stats: FailStats): void {
    const open = this.open;
    if (!open) return;

    track('level_fail', this.levelParams({
      reason,
      score,
      duration_s: this.seconds(open, nowMs),
      ...this.catStats(stats.unusedCats),
      targets_left: stats.targetsLeft,
      goals_left: stats.goalsLeft,
      ...this.gadgetParams(),
    }));

    this.open = null;
    this.shot = null;
  }

  /** Игрок ушёл с уровня, не завершив его: рестарт или выход в меню. */
  abandon(reason: QuitReason, context: AbandonContext = {}): void {
    const open = this.open;
    if (!open) return;

    const unusedCats = Math.max(0, open.catsTotal - this.results.length);
    const params: AnalyticsParams = {
      reason,
      ...this.catStats(unusedCats),
    };
    if (context.score !== undefined) params.score = context.score;
    if (context.nowMs !== undefined) params.duration_s = this.seconds(open, context.nowMs);
    if (context.targetsLeft !== undefined) params.targets_left = context.targetsLeft;
    if (context.goalsLeft !== undefined) params.goals_left = context.goalsLeft;

    track('level_quit', this.levelParams(params));
    this.open = null;
    this.shot = null;
  }

  private levelParams(extra: AnalyticsParams): AnalyticsParams {
    const open = this.open;
    if (!open) return extra;
    return {
      level: open.level,
      attempt: open.attempt,
      first_try: open.firstTry,
      replay: open.replay,
      stars_before: open.starsBefore,
      ...extra,
    };
  }

  private catStats(unusedCats: number): AnalyticsParams {
    const open = this.open;
    const launched = this.results.length;
    const zero = this.results.filter((result) => result.zero).length;
    const abilities = this.results.filter((result) => result.abilityUsed).length;
    return {
      cats_total: open?.catsTotal ?? launched + unusedCats,
      cats_launched: launched,
      cats_zero: zero,
      zero_pct: this.percent(zero, launched),
      ability_pct: this.percent(abilities, launched),
      unused_cats: unusedCats,
    };
  }

  private gadgetParams(): AnalyticsParams {
    const params: AnalyticsParams = {};
    for (const type of this.open?.gadgetTypes ?? []) {
      params[`touch_${type}`] = this.usedGadgets.has(type) ? 1 : 0;
    }
    return params;
  }

  private percent(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  private seconds(open: OpenAttempt, nowMs: number): number {
    return Math.max(0, Math.round((nowMs - open.startedAtMs) / 1000));
  }
}
