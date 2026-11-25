import type { Vector } from 'matter-js';

interface Particle {
  active: boolean;
  position: Vector;
  velocity: Vector;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  text: string;
}

const MAX_PARTICLES = 700;

/** Reuses a fixed pool, avoiding garbage spikes during large TNT chains. */
export class ParticleSystem {
  private particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
    active: false,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#fff',
    life: 0,
    maxLife: 0,
    size: 0,
    gravity: 0,
    text: '',
  }));
  private cursor = 0;

  burst(position: Vector, color: string, count = 16, speed = 9, size = 7): void {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.25 + Math.random() * 0.75);
      this.spawn(position, color, 450 + Math.random() * 550, size * (0.5 + Math.random()), {
        x: Math.cos(angle) * magnitude,
        y: Math.sin(angle) * magnitude - speed * 0.25,
      }, 0.018);
    }
  }

  trail(position: Vector, color: string): void {
    this.spawn(position, color, 280, 5, { x: 0, y: 0 }, 0);
  }

  floatingText(position: Vector, text: string, color = '#fff7b2'): void {
    const particle = this.spawn(position, color, 1050, 30, { x: 0, y: -1.4 }, 0);
    particle.text = text;
  }

  update(dtMs: number): void {
    const step = dtMs / 16.6667;
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.life -= dtMs;
      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }
      particle.velocity.y += particle.gravity * step;
      particle.position.x += particle.velocity.x * step;
      particle.position.y += particle.velocity.y * step;
      particle.velocity.x *= Math.pow(0.985, step);
      particle.velocity.y *= Math.pow(0.985, step);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;
      const alpha = Math.min(1, particle.life / Math.min(250, particle.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      if (particle.text) {
        ctx.font = '800 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#172033';
        ctx.strokeText(particle.text, particle.position.x, particle.position.y);
        ctx.fillText(particle.text, particle.position.x, particle.position.y);
      } else {
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    for (const particle of this.particles) particle.active = false;
  }

  private spawn(
    position: Vector,
    color: string,
    life: number,
    size: number,
    velocity: Vector,
    gravity: number,
  ): Particle {
    const particle = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % this.particles.length;
    particle.active = true;
    particle.position = { ...position };
    particle.velocity = { ...velocity };
    particle.color = color;
    particle.life = life;
    particle.maxLife = life;
    particle.size = size;
    particle.gravity = gravity;
    particle.text = '';
    return particle;
  }
}
