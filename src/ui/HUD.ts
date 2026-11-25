import type { CatDefinition } from '../entities/types';
import type { LevelData } from '../levels/schema';
import type { GameProgress } from '../core/StorageAdapter';

export type HudAction = 'level' | 'restart' | 'menu' | 'camera' | 'sound' | 'pause' | 'resume' | 'next';

export interface GameplayHudData {
  score: number;
  remainingCats: number;
  targetsLeft: number;
  currentCat: CatDefinition | null;
  abilityUsed: boolean;
  isSandbox: boolean;
}

/** DOM is intentionally limited to menus and HUD; the game world stays on Canvas. */
export class HUD {
  private topbar: HTMLDivElement;
  private overlay: HTMLDivElement;
  private ability: HTMLDivElement;
  private levelName: HTMLSpanElement;
  private score: HTMLSpanElement;
  private queue: HTMLSpanElement;
  private objective: HTMLSpanElement;
  private soundButton: HTMLButtonElement;

  constructor(
    private readonly root: HTMLElement,
    private readonly onAction: (action: HudAction, value?: string) => void,
  ) {
    root.innerHTML = `
      <div class="topbar" hidden>
        <div class="hud-cluster hud-level">
          <button class="icon-button" data-action="menu" title="Уровни" aria-label="К выбору уровня">⌂</button>
          <div><span class="level-name"></span><span class="objective"></span></div>
        </div>
        <div class="hud-cluster hud-score"><b class="score">0</b><span class="queue"></span></div>
        <div class="hud-cluster hud-actions">
          <button class="icon-button" data-action="camera" title="Обзор / слежение (C)" aria-label="Камера">⌕</button>
          <button class="icon-button sound-button" data-action="sound" title="Звук (M)" aria-label="Звук">♪</button>
          <button class="icon-button" data-action="pause" title="Пауза" aria-label="Пауза">Ⅱ</button>
          <button class="icon-button" data-action="restart" title="Заново (R)" aria-label="Заново">↻</button>
        </div>
      </div>
      <div class="ability-hint" hidden></div>
      <div class="overlay"></div>
    `;
    this.topbar = this.required('.topbar');
    this.overlay = this.required('.overlay');
    this.ability = this.required('.ability-hint');
    this.levelName = this.required('.level-name');
    this.score = this.required('.score');
    this.queue = this.required('.queue');
    this.objective = this.required('.objective');
    this.soundButton = this.required('.sound-button');
    root.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
      if (!button || button.disabled) return;
      const action = button.dataset.action as HudAction;
      this.onAction(action, button.dataset.value);
    });
  }

  showLevelSelect(levels: LevelData[], progress: GameProgress, sandbox: LevelData): void {
    this.topbar.hidden = true;
    this.ability.hidden = true;
    this.overlay.className = 'overlay visible';
    this.overlay.innerHTML = `
      <section class="menu-card level-select-card">
        <div class="brand-mark">🐾</div>
        <p class="eyebrow">ТАКТИЧЕСКАЯ ФИЗИЧЕСКАЯ РОГАТКА</p>
        <h1>CATAPULT <span>CHAOS</span></h1>
        <p class="menu-lead">Коты-хулиганы против порядка. Натягивай, запускай, активируй способность в полёте.</p>
        <div class="level-grid">
          ${levels.map((level) => {
            const result = progress.levels[level.id];
            const stars = result?.stars ?? 0;
            return `<button class="level-card" data-action="level" data-value="${level.id}">
              <span class="level-number">${level.id.replace('level', '').padStart(2, '0')}</span>
              <strong>${level.name.replace(/^\d+ — /, '')}</strong>
              <span class="card-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
              <span class="card-record">${result ? `${result.bestScore} очков` : 'Ещё не пройдено'} · ${result?.bonusFish ? '🐟' : '♧'}</span>
            </button>`;
          }).join('')}
        </div>
        <button class="secondary-button sandbox-button" data-action="level" data-value="${sandbox.id}">
          🧪 ${sandbox.name} · все механики
        </button>
        <p class="controls-note">Мышь / тач — прицел и способность · C — камера · R — рестарт · M — звук · D — дебаг</p>
      </section>
    `;
  }

  showGameplay(level: LevelData): void {
    this.topbar.hidden = false;
    this.ability.hidden = false;
    this.overlay.className = 'overlay';
    this.overlay.innerHTML = '';
    this.levelName.textContent = level.name;
  }

  updateGameplay(data: GameplayHudData): void {
    this.score.textContent = `${data.score.toLocaleString('ru-RU')} ✦`;
    this.queue.textContent = data.currentCat
      ? `${data.currentCat.shortName} +${data.remainingCats}`
      : 'Котов не осталось';
    this.objective.textContent = data.isSandbox
      ? 'Тестовый полигон · D — связи · R — рестарт'
      : data.targetsLeft > 0
        ? `Целей: ${data.targetsLeft}`
        : 'Выполни доставку / стабилизируй сцену';
    this.ability.innerHTML = data.currentCat
      ? `<span class="ability-dot" style="--cat-color:${data.currentCat.color}"></span>
         <div><b>${data.currentCat.abilityName}</b><span>${data.abilityUsed ? 'Способность уже использована' : data.currentCat.abilityHint}</span></div>`
      : '<div><b>Ожидайте…</b><span>Физическая сцена стабилизируется</span></div>';
  }

  showPause(): void {
    this.overlay.className = 'overlay visible';
    this.overlay.innerHTML = `
      <section class="menu-card compact-card">
        <p class="eyebrow">ПЕРЕДЫШКА</p><h2>Пауза</h2>
        <button class="primary-button" data-action="resume">Продолжить</button>
        <button class="secondary-button" data-action="restart">Начать уровень заново</button>
        <button class="text-button" data-action="menu">К выбору уровня</button>
      </section>`;
  }

  showResult(won: boolean, stars: number, score: number, fish: boolean, hasNext: boolean): void {
    this.overlay.className = 'overlay visible';
    this.overlay.innerHTML = `
      <section class="menu-card compact-card result-card ${won ? 'won' : 'lost'}">
        <p class="eyebrow">${won ? 'ИДЕАЛЬНЫЙ БЕСПОРЯДОК' : 'КОТЫ НЕ СДАЮТСЯ'}</p>
        <h2>${won ? 'Уровень пройден!' : 'Попробуем иначе?'}</h2>
        ${won ? `<div class="result-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>` : '<div class="result-cat">×﹏×</div>'}
        <div class="result-score">${score.toLocaleString('ru-RU')} <small>очков</small></div>
        ${won ? `<div class="fish-result ${fish ? 'collected' : ''}">${fish ? '🐟 Золотая рыбка собрана!' : '♧ Золотая рыбка осталась на уровне'}</div>` : ''}
        ${won && hasNext ? '<button class="primary-button" data-action="next">Следующий уровень</button>' : ''}
        <button class="secondary-button" data-action="restart">Ещё раз</button>
        <button class="text-button" data-action="menu">К выбору уровня</button>
      </section>`;
  }

  setMuted(muted: boolean): void {
    this.soundButton.textContent = muted ? '×' : '♪';
    this.soundButton.title = muted ? 'Включить звук (M)' : 'Выключить звук (M)';
  }

  private required<T extends HTMLElement = HTMLDivElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`HUD element not found: ${selector}`);
    return element;
  }
}
