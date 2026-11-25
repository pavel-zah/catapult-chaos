import type { GameBody } from '../entities/types';

export class DebugRenderer {
  render(ctx: CanvasRenderingContext2D, bodies: GameBody[]): void {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f472b6';
    for (const body of bodies) {
      if (body.game.kind === 'boundary') continue;
      ctx.beginPath();
      body.vertices.forEach((vertex, index) => {
        if (index === 0) ctx.moveTo(vertex.x, vertex.y);
        else ctx.lineTo(vertex.x, vertex.y);
      });
      ctx.closePath();
      ctx.stroke();
      if (!body.isStatic && !body.isSensor) {
        ctx.strokeStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(body.position.x, body.position.y);
        ctx.lineTo(body.position.x + body.velocity.x * 5, body.position.y + body.velocity.y * 5);
        ctx.stroke();
        ctx.strokeStyle = '#f472b6';
      }
    }
  }

  renderScreen(ctx: CanvasRenderingContext2D, width: number, fps: number, bodyCount: number): void {
    ctx.fillStyle = '#0f172acc';
    ctx.fillRect(width - 215, 12, 200, 58);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS ${fps.toFixed(0)} · bodies ${bodyCount}`, width - 202, 36);
    ctx.fillText('D: debug · R: restart', width - 202, 58);
  }
}
