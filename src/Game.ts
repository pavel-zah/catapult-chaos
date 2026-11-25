import Matter from 'matter-js';
import { AudioEngine } from './core/AudioEngine';
import { Camera } from './core/Camera';
import { Engine } from './core/Engine';
import { EventBus } from './core/EventBus';
import { InputManager, type PointerSample } from './core/InputManager';
import { ParticleSystem } from './core/ParticleSystem';
import {
  LocalStorageAdapter,
  EMPTY_PROGRESS,
  type GameProgress,
  type IStorageAdapter,
} from './core/StorageAdapter';
import { JUICE } from './constants';
import { BlockRegistry } from './entities/BlockRegistry';
import { CatRegistry } from './entities/CatRegistry';
import { GadgetRegistry } from './entities/GadgetRegistry';
import { registerDefaultBlocks } from './entities/registrations';
import { registerDefaultCats } from './entities/cats';
import { registerDefaultGadgets } from './entities/gadgets';
import type {
  CatAbilityContext,
  CatEntity,
  GameBody,
  ScheduledAction,
} from './entities/types';
import { GameStateMachine } from './gameplay/GameStateMachine';
import { GoalTracker } from './gameplay/GoalTracker';
import { Slingshot } from './gameplay/Slingshot';
import { LevelLoader, createCatBody, type LoadedLevel } from './levels/LevelLoader';
import { LEVELS, getLevel, getNextLevel } from './levels';
import type { LevelData } from './levels/schema';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { SettlingDetector } from './physics/SettlingDetector';
import { Renderer } from './rendering/Renderer';
import { HUD, type HudAction } from './ui/HUD';

export class Game {
  private readonly events = new EventBus();
  private readonly audio = new AudioEngine();
  private readonly camera = new Camera();
  private readonly particles = new ParticleSystem();
  private readonly state = new GameStateMachine();
  private readonly catRegistry = new CatRegistry();
  private readonly blockRegistry = new BlockRegistry();
  private readonly gadgetRegistry = new GadgetRegistry();
  private readonly physics = new PhysicsWorld(this.events);
  private readonly settling = new SettlingDetector();
  private readonly goals = new GoalTracker(this.events);
  private readonly levelLoader = new LevelLoader(
    this.physics,
    this.events,
    this.blockRegistry,
    this.gadgetRegistry,
  );
  private readonly renderer: Renderer;
  private readonly hud: HUD;
  private readonly engine: Engine;
  private readonly input: InputManager;
  private readonly storage: IStorageAdapter;

  private progress: GameProgress = structuredClone(EMPTY_PROGRESS);
  private currentLevel: LevelData | null = null;
  private loadedLevel: LoadedLevel | null = null;
  private slingshot = new Slingshot({ x: 0, y: 0 });
  private cats = new Map<number, CatEntity>();
  private activeCatIds = new Set<number>();
  private activePrimaryId: number | null = null;
  private catQueue: string[] = [];
  private scheduled: ScheduledAction[] = [];
  private previousTrails: Matter.Vector[][] = [];
  private currentTrail: Matter.Vector[] = [];
  private score = 0;
  private levelStartedAt = 0;
  private trailTick = 0;
  private hudTick = 0;
  private cameraDragging = false;
  private shotResolved = false;
  private explosionSequence = 0;
  private debug = false;

  constructor(
    canvas: HTMLCanvasElement,
    hudRoot: HTMLElement,
    storage: IStorageAdapter = new LocalStorageAdapter(),
  ) {
    this.storage = storage;
    registerDefaultBlocks(this.blockRegistry);
    registerDefaultCats(this.catRegistry);
    registerDefaultGadgets(this.gadgetRegistry);
    this.renderer = new Renderer(canvas, this.camera, this.catRegistry, this.blockRegistry);
    this.hud = new HUD(hudRoot, this.onHudAction);
    this.engine = new Engine({
      fixedUpdate: this.fixedUpdate,
      render: this.render,
    });
    this.input = new InputManager(canvas, this.camera, {
      down: this.onPointerDown,
      move: this.onPointerMove,
      up: this.onPointerUp,
    });
    this.camera.setFollowTarget(() => {
      const cat = this.activePrimaryId === null ? null : this.cats.get(this.activePrimaryId);
      return cat && !cat.body.game.destroyed ? cat.body.position : null;
    });
    this.bindEvents();
    window.addEventListener('keydown', this.onKeyDown);
  }

  async initialize(): Promise<void> {
    this.progress = await this.storage.load();
    this.showLevelSelect();
    this.engine.start();
  }

  private startLevel(id: string): void {
    const level = getLevel(id);
    if (!level) return;
    this.currentLevel = level;
    this.levelStartedAt = this.engine.timeMs;
    this.catQueue = [...level.queue];
    this.cats.clear();
    this.activeCatIds.clear();
    this.activePrimaryId = null;
    this.scheduled = [];
    this.previousTrails = [];
    this.currentTrail = [];
    this.score = 0;
    this.explosionSequence = 0;
    this.shotResolved = false;
    this.settling.stop();
    this.particles.clear();
    this.goals.configure(level);
    this.loadedLevel = this.levelLoader.load(level, this.levelStartedAt);
    this.slingshot = new Slingshot(level.slingshot);
    this.camera.setBounds(level.worldBounds.width, level.worldBounds.height);
    this.state.set('AIMING');
    this.hud.showGameplay(level);
    this.loadNextCat();
    this.updateHud();
  }

  private showLevelSelect(): void {
    this.state.set('LEVEL_SELECT');
    this.cameraDragging = false;
    this.hud.showLevelSelect(LEVELS, this.progress);
  }

  private loadNextCat(): void {
    const typeId = this.catQueue.shift();
    if (!typeId || !this.currentLevel) {
      this.loseLevel();
      return;
    }
    const definition = this.catRegistry.get(typeId);
    const body = createCatBody(definition, this.currentLevel.slingshot, this.engine.timeMs);
    Matter.Body.setStatic(body, true);
    this.physics.add(body);
    const cat: CatEntity = {
      body,
      typeId,
      emotion: 'idle',
      emotionUntil: Infinity,
      abilityUsed: false,
      abilityEndsAt: 0,
      abilityFinished: false,
      hasCollided: false,
      isKitten: false,
    };
    this.cats.set(body.id, cat);
    this.slingshot.load(body);
    this.activePrimaryId = null;
    this.shotResolved = false;
    this.state.set('AIMING');
    this.camera.overview();
    this.updateHud();
  }

  private launch(velocity: Matter.Vector): void {
    const body = this.slingshot.loadedBody;
    if (!body) return;
    const cat = this.cats.get(body.id);
    if (!cat) return;
    this.slingshot.unload();
    Matter.Body.setStatic(body, false);
    this.physics.setVelocityCapped(body, velocity);
    Matter.Sleeping.set(body, false);
    cat.emotion = 'flying';
    cat.emotionUntil = Infinity;
    this.activePrimaryId = body.id;
    this.activeCatIds.add(body.id);
    if (this.currentTrail.length > 4) {
      this.previousTrails.push(this.currentTrail);
      this.previousTrails = this.previousTrails.slice(-JUICE.maxPreviousTrails);
    }
    this.currentTrail = [];
    this.trailTick = 0;
    this.shotResolved = false;
    this.settling.start(this.engine.timeMs);
    this.state.set('FLYING');
    this.events.emit('cat:launched', { body, catType: cat.typeId });
    this.events.emit('audio:play', { sound: 'launch' });
    this.camera.follow();
    this.updateHud();
  }

  private activateAbility(): void {
    if (!['FLYING', 'SETTLING'].includes(this.state.state) || this.activePrimaryId === null) return;
    const cat = this.cats.get(this.activePrimaryId);
    if (!cat || cat.abilityUsed) return;
    const definition = this.catRegistry.get(cat.typeId);
    if (!definition.onAbilityActivate) return;
    if (cat.hasCollided && !definition.allowAbilityAfterCollision) return;

    cat.abilityUsed = true;
    cat.emotion = 'ability';
    cat.emotionUntil = this.engine.timeMs + 650;
    cat.abilityEndsAt = 0;
    cat.abilityFinished = false;
    const context = this.abilityContext(cat);
    definition.onAbilityActivate(context);
    this.events.emit('cat:ability', { body: cat.body, catType: cat.typeId });
    this.events.emit('audio:play', { sound: 'ability' });
    this.particles.burst(cat.body.position, definition.color, 14, 7, 6);
    this.updateHud();
  }

  private abilityContext(cat: CatEntity): CatAbilityContext {
    return {
      cat,
      now: this.engine.timeMs,
      physics: this.physics,
      events: this.events,
      schedule: (delayMs, callback) => this.schedule(delayMs, callback),
      spawnSplitCats: (body, count) => this.spawnSplitCats(body, count),
      setAbilityDuration: (durationMs) => {
        cat.abilityEndsAt = this.engine.timeMs + durationMs;
      },
    };
  }

  private spawnSplitCats(original: GameBody, count: number): void {
    const source = this.cats.get(original.id);
    if (!source) return;
    const definition = this.catRegistry.get(source.typeId);
    const baseAngle = Math.atan2(original.velocity.y, original.velocity.x);
    const baseSpeed = Math.max(17, Math.hypot(original.velocity.x, original.velocity.y) * 1.08);
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : (index / (count - 1) - 0.5) * 1.1;
      const body = createCatBody(definition, original.position, this.engine.timeMs, 0.55);
      const angle = baseAngle + offset;
      this.physics.add(body);
      this.physics.setVelocityCapped(body, {
        x: Math.cos(angle) * baseSpeed,
        y: Math.sin(angle) * baseSpeed,
      });
      const kitten: CatEntity = {
        body,
        typeId: source.typeId,
        emotion: 'ability',
        emotionUntil: this.engine.timeMs + 500,
        abilityUsed: true,
        abilityEndsAt: 0,
        abilityFinished: true,
        hasCollided: false,
        isKitten: true,
      };
      this.cats.set(body.id, kitten);
      this.activeCatIds.add(body.id);
      if (index === 0) this.activePrimaryId = body.id;
    }
    original.game.destroyed = true;
    this.physics.remove(original);
    this.cats.delete(original.id);
    this.activeCatIds.delete(original.id);
    this.particles.burst(original.position, definition.color, 24, 10, 7);
  }

  private fixedUpdate = (stepMs: number, now: number): void => {
    if (!this.currentLevel || !this.loadedLevel) return;
    if (this.state.state === 'WON' || this.state.state === 'LOST') {
      this.particles.update(stepMs);
      this.camera.update(stepMs);
      return;
    }
    if (!this.state.isPlaying) return;
    this.runScheduled(now);
    if (!this.state.isPlaying) return;

    for (const gadget of this.loadedLevel.gadgets.values()) gadget.update?.(stepMs, now);
    this.updateCatAbilities(stepMs, now);
    this.physics.step(stepMs);
    this.particles.update(stepMs);
    this.camera.update(stepMs);

    if (this.activePrimaryId !== null) {
      const primary = this.cats.get(this.activePrimaryId);
      if (primary && ++this.trailTick % 3 === 0) this.currentTrail.push({ ...primary.body.position });
    }

    if (['FLYING', 'SETTLING'].includes(this.state.state)
      && this.settling.update(this.physics.dynamicBodies, now)) {
      this.finishShot();
    }
    if (++this.hudTick % 8 === 0) this.updateHud();
  };

  private updateCatAbilities(stepMs: number, now: number): void {
    for (const cat of this.cats.values()) {
      if (!cat.abilityUsed || cat.abilityFinished) continue;
      const definition = this.catRegistry.get(cat.typeId);
      const context = this.abilityContext(cat);
      if (cat.abilityEndsAt > 0 && now < cat.abilityEndsAt) {
        definition.onAbilityUpdate?.(context, stepMs);
      } else if (cat.abilityEndsAt > 0) {
        cat.abilityFinished = true;
        definition.onAbilityEnd?.(context);
      }
    }
  }

  private finishShot(): void {
    if (this.shotResolved) return;
    this.shotResolved = true;
    if (this.goals.isWon()) {
      this.winLevel();
      return;
    }
    if (this.goals.hasFailed || this.catQueue.length === 0) {
      this.loseLevel();
      return;
    }
    this.removeActiveCats();
    this.loadNextCat();
  }

  private winLevel(): void {
    if (!this.currentLevel || this.state.state === 'WON') return;
    this.score += this.catQueue.length * 500;
    const stars = this.goals.stars(this.score);
    this.state.set('WON');
    this.settling.stop();
    this.events.emit('audio:play', { sound: 'win' });
    const center = this.currentLevel.slingshot;
    for (let burst = 0; burst < 5; burst += 1) {
      this.particles.burst({ x: 800 + burst * 110, y: 350 + (burst % 2) * 80 }, '#fde047', 22, 12, 8);
    }
    this.particles.floatingText({ x: center.x + 350, y: center.y - 300 }, 'ПОБЕДА!', '#fde047');
    const previous = this.progress.levels[this.currentLevel.id];
    this.progress.levels[this.currentLevel.id] = {
      stars: Math.max(previous?.stars ?? 0, stars),
      bestScore: Math.max(previous?.bestScore ?? 0, this.score),
      bonusFish: (previous?.bonusFish ?? false) || this.goals.hasBonusFish,
    };
    void this.storage.save(this.progress);
    this.hud.showResult(true, stars, this.score, this.goals.hasBonusFish, Boolean(getNextLevel(this.currentLevel.id)));
  }

  private loseLevel(): void {
    if (!this.currentLevel || ['LOST', 'WON'].includes(this.state.state)) return;
    this.state.set('LOST');
    this.settling.stop();
    this.events.emit('audio:play', { sound: 'lose' });
    this.hud.showResult(false, 0, this.score, false, false);
  }

  private removeActiveCats(): void {
    for (const id of this.activeCatIds) {
      const cat = this.cats.get(id);
      if (cat) {
        cat.body.game.destroyed = true;
        this.physics.remove(cat.body);
        this.cats.delete(id);
      }
    }
    this.activeCatIds.clear();
    this.activePrimaryId = null;
  }

  private bindEvents(): void {
    this.events.on('audio:play', ({ sound, intensity }) => this.audio.play(sound, intensity));
    this.events.on('game:hitstop', ({ durationMs }) => this.engine.hitstop(durationMs));
    this.events.on('physics:collision-start', ({ a, b, impulse }) => this.onCollision(a, b, impulse));
    this.events.on('physics:collision-end', ({ a, b }) => {
      this.dispatchGadgetCollision(a, b, false);
      this.dispatchGadgetCollision(b, a, false);
    });
    this.events.on('gadget:bonus', ({ position }) => {
      this.score += 300;
      this.particles.burst(position, '#fde047', 32, 11, 8);
      this.updateHud();
    });
    this.events.on('gadget:goal', ({ gadgetId }) => {
      this.score += 1000;
      const gadget = this.loadedLevel?.gadgets.get(gadgetId);
      if (gadget?.bodies[0]) this.particles.burst(gadget.bodies[0].position, '#86efac', 40, 12, 8);
      this.updateHud();
    });
    this.events.on('game:score-popup', ({ position, text, color }) => {
      this.particles.floatingText(position, text, color);
    });
  }

  private onCollision(a: GameBody, b: GameBody, impulse: number): void {
    this.dispatchGadgetCollision(a, b, true);
    this.dispatchGadgetCollision(b, a, true);
    if (!this.state.isPlaying) return;

    this.markCatImpact(a, b);
    this.markCatImpact(b, a);
    if (!a.isSensor && !b.isSensor && impulse > 1) {
      if (this.activeCatIds.has(a.id) || this.activeCatIds.has(b.id)) {
        this.settling.notifyImpact(this.engine.timeMs);
        if (this.state.state === 'FLYING') this.state.set('SETTLING');
      }
      if (impulse > 24) {
        const strength = Math.min(JUICE.maxShake, (impulse / JUICE.strongImpact) * 9);
        this.camera.shake(strength);
      }
    }

    if (this.engine.timeMs - this.levelStartedAt < 400 || a.isSensor || b.isSensor) return;
    this.applyImpactDamage(a, impulse);
    this.applyImpactDamage(b, impulse);
  }

  private dispatchGadgetCollision(gadgetBody: GameBody, other: GameBody, started: boolean): void {
    if (gadgetBody.game.kind !== 'gadget') return;
    const gadget = this.loadedLevel?.gadgets.get(gadgetBody.game.entityId);
    if (!gadget) return;
    if (started) gadget.onCollisionStart?.(other, this.engine.timeMs);
    else gadget.onCollisionEnd?.(other, this.engine.timeMs);
  }

  private markCatImpact(catBody: GameBody, other: GameBody): void {
    const cat = this.cats.get(catBody.id);
    if (!cat || !this.activeCatIds.has(catBody.id) || other.isSensor) return;
    cat.hasCollided = true;
    cat.emotion = 'hit';
    cat.emotionUntil = this.engine.timeMs + 450;
  }

  private applyImpactDamage(body: GameBody, impulse: number): void {
    if (!['block', 'target', 'treasure'].includes(body.game.kind) || body.game.destroyed) return;
    const threshold = body.game.damageThreshold;
    if (impulse <= threshold) return;
    this.damageBody(body, (impulse - threshold) * 1.45);
  }

  private damageBody(body: GameBody, amount: number): void {
    if (body.game.destroyed || !Number.isFinite(body.game.hp)) return;
    body.game.hp -= amount;
    this.events.emit('block:damaged', { body, amount });
    if (body.game.hp <= 0) this.destroyBody(body);
  }

  private destroyBody(body: GameBody): void {
    if (body.game.destroyed) return;
    body.game.destroyed = true;
    const position = { ...body.position };
    this.physics.remove(body);

    if (body.game.kind === 'block') {
      const definition = this.blockRegistry.get(body.game.typeId);
      this.score += definition.score;
      this.particles.burst(position, definition.particleColor, body.game.typeId === 'tnt' ? 25 : 16, 10, 7);
      this.events.emit('block:destroyed', { body, position, score: definition.score });
      this.events.emit('game:score-popup', { position, text: `+${definition.score}` });
      if (definition.explosive) {
        this.explosionSequence += 1;
        const delay = 80 + (this.explosionSequence % 3) * 20;
        this.schedule(delay, () => this.detonateTnt(position));
      } else {
        this.events.emit('audio:play', {
          sound: body.game.typeId === 'glass' ? 'glass' : body.game.typeId === 'stone' ? 'stone' : 'wood',
        });
      }
    } else if (body.game.kind === 'target') {
      this.score += 500;
      this.particles.burst(position, '#94a3b8', 26, 12, 8);
      this.events.emit('target:destroyed', { body, position, score: 500 });
      this.events.emit('game:score-popup', { position, text: '+500', color: '#fde047' });
      this.events.emit('audio:play', { sound: 'stone', intensity: 0.7 });
      if (this.goals.targetsLeft === 0) {
        this.events.emit('game:hitstop', { durationMs: JUICE.hitstopMs });
        this.camera.shake(12);
      }
    } else if (body.game.kind === 'treasure') {
      this.particles.burst(position, '#f6c344', 24, 9, 8);
      this.events.emit('treasure:destroyed', { body });
      this.events.emit('game:score-popup', { position, text: 'СЕЙФ РАЗБИТ!', color: '#fda4af' });
    }
    this.updateHud();
  }

  private detonateTnt(position: Matter.Vector): void {
    const radius = 235;
    this.events.emit('tnt:exploded', { position, radius });
    this.events.emit('audio:play', { sound: 'explosion' });
    this.events.emit('game:score-popup', { position, text: 'BOOM!', color: '#fb923c' });
    this.events.emit('game:hitstop', { durationMs: JUICE.hitstopMs });
    this.camera.shake(20);
    this.particles.burst(position, '#fb923c', 42, 17, 11);
    this.particles.burst(position, '#3f3f46', 22, 9, 13);
    this.physics.applyRadialImpulse(position, radius, 23);
    for (const body of [...this.physics.dynamicBodies]) {
      if (!['block', 'target', 'treasure'].includes(body.game.kind)) continue;
      const distance = Matter.Vector.magnitude(Matter.Vector.sub(body.position, position));
      if (distance < radius) this.damageBody(body, 95 * (1 - distance / radius) + 25);
    }
  }

  private schedule(delayMs: number, callback: () => void): void {
    this.scheduled.push({ dueAt: this.engine.timeMs + delayMs, callback });
  }

  private runScheduled(now: number): void {
    const due = this.scheduled.filter((action) => action.dueAt <= now);
    this.scheduled = this.scheduled.filter((action) => action.dueAt > now);
    for (const action of due) action.callback();
  }

  private onPointerDown = (sample: PointerSample): void => {
    void this.audio.unlock();
    if (['FLYING', 'SETTLING'].includes(this.state.state)) {
      this.activateAbility();
      return;
    }
    if (this.state.state === 'AIMING' && this.slingshot.begin(sample.world)) {
      const body = this.slingshot.loadedBody;
      const cat = body ? this.cats.get(body.id) : null;
      if (cat) {
        cat.emotion = 'aiming';
        cat.emotionUntil = Infinity;
      }
      this.events.emit('audio:play', { sound: 'stretch' });
      return;
    }
    if (this.state.isPlaying) this.cameraDragging = true;
  };

  private onPointerMove = (sample: PointerSample): void => {
    if (this.state.state === 'AIMING' && this.slingshot.dragging) {
      this.slingshot.update(sample.world);
    } else if (this.cameraDragging) {
      this.camera.panByScreenDelta(sample.deltaScreen);
    }
  };

  private onPointerUp = (sample: PointerSample): void => {
    if (this.state.state === 'AIMING' && this.slingshot.dragging) {
      this.slingshot.update(sample.world);
      const velocity = this.slingshot.release();
      if (velocity) this.launch(velocity);
      else {
        const body = this.slingshot.loadedBody;
        const cat = body ? this.cats.get(body.id) : null;
        if (cat) cat.emotion = 'idle';
      }
    }
    this.cameraDragging = false;
  };

  private onHudAction = (action: HudAction, value?: string): void => {
    void this.audio.unlock();
    if (action !== 'sound') this.audio.play('click');
    switch (action) {
      case 'level': if (value) this.startLevel(value); break;
      case 'restart': if (this.currentLevel) this.startLevel(this.currentLevel.id); break;
      case 'menu': this.showLevelSelect(); break;
      case 'camera': if (this.state.isPlaying) this.camera.toggleOverview(); break;
      case 'sound': this.hud.setMuted(this.audio.toggleMute()); break;
      case 'pause':
        if (this.state.pause()) this.hud.showPause();
        break;
      case 'resume':
        if (this.state.resume() && this.currentLevel) {
          this.hud.showGameplay(this.currentLevel);
          this.updateHud();
        }
        break;
      case 'next': {
        const next = this.currentLevel ? getNextLevel(this.currentLevel.id) : undefined;
        if (next) this.startLevel(next.id);
        else this.showLevelSelect();
        break;
      }
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'r' && this.currentLevel) this.startLevel(this.currentLevel.id);
    if (key === 'c' && this.state.isPlaying) this.camera.toggleOverview();
    if (key === 'm') this.hud.setMuted(this.audio.toggleMute());
    if (key === 'd') this.debug = !this.debug;
    if (key === 'escape') {
      if (this.state.state === 'PAUSED') this.onHudAction('resume');
      else this.onHudAction('pause');
    }
    if (event.code === 'Space') {
      event.preventDefault();
      void this.audio.unlock();
      this.activateAbility();
    }
  };

  private updateHud(): void {
    const loaded = this.slingshot.loadedBody;
    const primary = this.activePrimaryId === null ? null : this.cats.get(this.activePrimaryId);
    const cat = primary ?? (loaded ? this.cats.get(loaded.id) : null);
    this.hud.updateGameplay({
      score: this.score,
      remainingCats: this.catQueue.length,
      targetsLeft: this.goals.targetsLeft,
      currentCat: cat ? this.catRegistry.get(cat.typeId) : null,
      abilityUsed: cat?.abilityUsed ?? false,
    });
  }

  private render = (now: number, fps: number): void => {
    if (!this.currentLevel || !this.loadedLevel) return;
    this.renderer.render({
      level: this.currentLevel,
      bodies: this.physics.bodies,
      cats: this.cats,
      gadgets: this.loadedLevel.gadgets,
      slingshot: this.slingshot,
      gravityScale: this.currentLevel.modifiers?.gravityScale ?? 1,
      previousTrails: this.previousTrails,
      currentTrail: this.currentTrail,
      particles: this.particles,
      now,
      fps,
      debug: this.debug,
    });
  };
}
