import Matter from 'matter-js';
import { PHYSICS } from '../constants';
import type { EventBus } from '../core/EventBus';
import { isGameBody, type GameBody } from '../entities/types';

export class PhysicsWorld {
  readonly engine: Matter.Engine;

  constructor(private readonly events: EventBus) {
    this.engine = Matter.Engine.create({
      positionIterations: PHYSICS.positionIterations,
      velocityIterations: PHYSICS.velocityIterations,
      // Sleeping bodies stay frozen in the air when their support disappears (trapdoor, door,
      // destroyed block). The scene is small, so simulating everything every step is cheaper
      // than tracking which sleepers lost their support.
      enableSleeping: false,
    });
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        if (!isGameBody(bodyA) || !isGameBody(bodyB)) continue;
        this.events.emit('physics:collision-start', {
          a: bodyA,
          b: bodyB,
          impulse: this.impactImpulse(bodyA, bodyB, pair.collision.normal),
        });
      }
    });
    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      for (const pair of event.pairs) {
        if (isGameBody(pair.bodyA) && isGameBody(pair.bodyB)) {
          this.events.emit('physics:collision-end', { a: pair.bodyA, b: pair.bodyB });
        }
      }
    });
  }

  get bodies(): GameBody[] {
    return Matter.Composite.allBodies(this.engine.world).filter(isGameBody);
  }

  get dynamicBodies(): GameBody[] {
    return this.bodies.filter((body) => !body.isStatic && !body.isSensor && !body.game.destroyed);
  }

  setGravity(scale: number): void {
    this.engine.gravity.scale = 0.001 * scale;
  }

  add(...bodies: Matter.Body[]): void {
    Matter.Composite.add(this.engine.world, bodies);
  }

  remove(body: Matter.Body): void {
    Matter.Composite.remove(this.engine.world, body, true);
  }

  addConstraint(constraint: Matter.Constraint): void {
    Matter.Composite.add(this.engine.world, constraint);
  }

  removeConstraint(constraint: Matter.Constraint): void {
    Matter.Composite.remove(this.engine.world, constraint, true);
  }

  clear(): void {
    Matter.Composite.clear(this.engine.world, false, true);
    Matter.Engine.clear(this.engine);
  }

  step(deltaMs: number): void {
    this.capVelocities();
    Matter.Engine.update(this.engine, deltaMs);
    this.capVelocities();
  }

  setVelocityCapped(body: Matter.Body, velocity: Matter.Vector): void {
    const speed = Math.hypot(velocity.x, velocity.y);
    const scale = speed > PHYSICS.maxSpeed ? PHYSICS.maxSpeed / speed : 1;
    Matter.Body.setVelocity(body, { x: velocity.x * scale, y: velocity.y * scale });
  }

  applyRadialImpulse(origin: Matter.Vector, radius: number, strength: number, excludeId?: number): void {
    for (const body of this.dynamicBodies) {
      if (body.id === excludeId) continue;
      const delta = Matter.Vector.sub(body.position, origin);
      const distance = Math.max(1, Matter.Vector.magnitude(delta));
      if (distance >= radius) continue;
      const direction = Matter.Vector.div(delta, distance);
      const massFactor = Math.min(1, 12 / Math.max(1, body.mass));
      const impulse = strength * (1 - distance / radius) * massFactor;
      this.setVelocityCapped(body, {
        x: body.velocity.x + direction.x * impulse,
        y: body.velocity.y + direction.y * impulse - impulse * 0.12,
      });
      Matter.Sleeping.set(body, false);
    }
  }

  private capVelocities(): void {
    for (const body of this.dynamicBodies) {
      if (Math.hypot(body.velocity.x, body.velocity.y) > PHYSICS.maxSpeed) {
        this.setVelocityCapped(body, body.velocity);
      }
    }
  }

  private impactImpulse(a: Matter.Body, b: Matter.Body, normal: Matter.Vector): number {
    const relative = Matter.Vector.sub(a.velocity, b.velocity);
    const closingSpeed = Math.abs(Matter.Vector.dot(relative, normal));
    const massA = a.isStatic ? Infinity : a.mass;
    const massB = b.isStatic ? Infinity : b.mass;
    const reducedMass = massA === Infinity
      ? massB
      : massB === Infinity
        ? massA
        : (massA * massB) / (massA + massB);
    return closingSpeed * (Number.isFinite(reducedMass) ? reducedMass : 0);
  }
}
