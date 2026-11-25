import './style.css';
import { Game } from './Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const hud = document.querySelector<HTMLElement>('#hud');

if (!canvas || !hud) {
  throw new Error('Game canvas or HUD root is missing.');
}

const game = new Game(canvas, hud);
void game.initialize().catch((error: unknown) => {
  console.error('Catapult Chaos failed to initialize:', error);
  hud.innerHTML = '<div class="overlay visible"><section class="menu-card compact-card"><h2>Не удалось запустить игру</h2><p>Обновите страницу или проверьте консоль браузера.</p></section></div>';
});
