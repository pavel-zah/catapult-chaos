import type { CatDefinition, CatEntity } from '../entities/types';

export class CatRenderer {
  render(ctx: CanvasRenderingContext2D, cat: CatEntity, definition: CatDefinition, now: number): void {
    const { body } = cat;
    const radius = body.circleRadius ?? definition.radius;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);

    if (definition.id === 'magnet' && cat.abilityUsed && now < cat.abilityEndsAt) {
      const pulse = 1 + Math.sin(now * 0.025) * 0.08;
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.55;
      for (let ring = 1; ring <= 2; ring += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, (75 + ring * 48) * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    ctx.rotate(body.angle);
    const wag = Math.sin(now * 0.012 + body.id) * radius * 0.18;
    ctx.strokeStyle = definition.accent;
    ctx.lineWidth = radius * 0.23;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, radius * 0.35);
    ctx.bezierCurveTo(-radius * 1.65, radius * 0.65, -radius * 1.65 + wag, -radius * 0.35, -radius * 1.15, -radius * 0.55);
    ctx.stroke();

    ctx.fillStyle = definition.color;
    ctx.strokeStyle = definition.accent;
    ctx.lineWidth = Math.max(2, radius * 0.07);
    for (const direction of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(direction * radius * 0.42, -radius * 0.65);
      ctx.lineTo(direction * radius * 0.75, -radius * 1.25);
      ctx.lineTo(direction * radius * 0.95, -radius * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath();
      ctx.moveTo(direction * radius * 0.56, -radius * 0.69);
      ctx.lineTo(direction * radius * 0.73, -radius * 1.02);
      ctx.lineTo(direction * radius * 0.79, -radius * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = definition.color;
    }

    ctx.shadowColor = '#0f172a66';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    this.drawVariant(ctx, definition, radius);
    this.drawFace(ctx, cat, radius, now);
    ctx.restore();
  }

  private drawVariant(ctx: CanvasRenderingContext2D, definition: CatDefinition, radius: number): void {
    if (definition.id === 'classic') {
      ctx.strokeStyle = definition.accent;
      ctx.lineWidth = radius * 0.1;
      for (const x of [-0.35, 0, 0.35]) {
        ctx.beginPath();
        ctx.moveTo(radius * x, -radius * 0.95);
        ctx.lineTo(radius * x * 0.75, -radius * 0.64);
        ctx.stroke();
      }
    } else if (definition.id === 'anvil') {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-radius * 0.55, radius * 0.55, radius * 1.1, radius * 0.15);
      ctx.fillStyle = '#334155';
      ctx.font = `900 ${radius * 0.35}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('6×', 0, radius * 0.83);
    } else if (definition.id === 'bouncy') {
      ctx.fillStyle = '#d1fae5aa';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.38, -radius * 0.43, radius * 0.2, radius * 0.32, -0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (definition.id === 'splitter') {
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = radius * 0.08;
      ctx.beginPath();
      ctx.arc(0, radius * 0.22, radius * 0.55, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, radius * 0.25, radius * 0.28, 0, Math.PI);
      ctx.stroke();
    } else if (definition.id === 'magnet') {
      ctx.strokeStyle = '#ede9fe';
      ctx.lineWidth = radius * 0.13;
      ctx.beginPath();
      ctx.arc(0, radius * 0.3, radius * 0.32, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#f87171';
      ctx.fillRect(-radius * 0.39, radius * 0.25, radius * 0.15, radius * 0.25);
      ctx.fillRect(radius * 0.24, radius * 0.25, radius * 0.15, radius * 0.25);
    }
  }

  private drawFace(ctx: CanvasRenderingContext2D, cat: CatEntity, radius: number, now: number): void {
    const emotion = now < cat.emotionUntil ? cat.emotion : cat.emotion === 'aiming' ? 'aiming' : 'flying';
    const eyeY = -radius * 0.18;
    const eyeX = radius * 0.36;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2430';
    ctx.fillStyle = '#1f2430';
    ctx.lineWidth = Math.max(2.5, radius * 0.075);

    if (emotion === 'hit') {
      for (const direction of [-1, 1]) {
        const x = direction * eyeX;
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.12, eyeY - radius * 0.12);
        ctx.lineTo(x + radius * 0.12, eyeY + radius * 0.12);
        ctx.moveTo(x + radius * 0.12, eyeY - radius * 0.12);
        ctx.lineTo(x - radius * 0.12, eyeY + radius * 0.12);
        ctx.stroke();
      }
    } else if (emotion === 'aiming') {
      for (const direction of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(direction * eyeX - radius * 0.13, eyeY);
        ctx.lineTo(direction * eyeX + radius * 0.13, eyeY + radius * 0.03);
        ctx.stroke();
      }
    } else {
      for (const direction of [-1, 1]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(direction * eyeX, eyeY, radius * 0.17, emotion === 'flying' ? radius * 0.23 : radius * 0.19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1f2430';
        ctx.beginPath();
        ctx.arc(direction * eyeX + radius * 0.035, eyeY, radius * 0.075, 0, Math.PI * 2);
        ctx.fill();
      }
      if (emotion === 'ability') {
        for (const direction of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(direction * eyeX - radius * 0.17, eyeY - radius * 0.3);
          ctx.lineTo(direction * eyeX + radius * 0.17, eyeY - radius * 0.2);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#7f1d3f';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.1, radius * 0.09);
    ctx.lineTo(radius * 0.1, radius * 0.09);
    ctx.lineTo(0, radius * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1f2430';
    ctx.lineWidth = radius * 0.065;
    if (emotion === 'flying') {
      ctx.fillStyle = '#572238';
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.43, radius * 0.17, radius * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      if (emotion === 'hit') ctx.arc(0, radius * 0.55, radius * 0.18, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(0, radius * 0.24, radius * 0.26, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1f2430aa';
    ctx.lineWidth = Math.max(1.5, radius * 0.035);
    for (const direction of [-1, 1]) {
      for (const offset of [-0.08, 0.08]) {
        ctx.beginPath();
        ctx.moveTo(direction * radius * 0.55, radius * (0.24 + offset));
        ctx.lineTo(direction * radius * 1.02, radius * (0.2 + offset * 2));
        ctx.stroke();
      }
    }
  }
}
