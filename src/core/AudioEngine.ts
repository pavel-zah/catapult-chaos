import type { SoundName } from './EventBus';

/** Tiny procedural synthesizer; no audio files and no autoplay violations. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  get isMuted(): boolean {
    return this.muted;
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.2;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.2, this.context.currentTime, 0.015);
    }
    return this.muted;
  }

  play(name: SoundName, intensity = 1): void {
    if (!this.context || !this.master || this.muted) return;
    const amount = Math.min(1.5, Math.max(0.15, intensity));
    switch (name) {
      case 'stretch': this.tone(150, 210, 0.08, 'triangle', 0.11); break;
      case 'launch': this.tone(240, 720, 0.2, 'sine', 0.22); this.meow(0.12); break;
      case 'ability': this.tone(330, 880, 0.18, 'square', 0.14); break;
      case 'glass': this.noise(0.18, 1700, 0.18 * amount); this.tone(1200, 650, 0.22, 'sine', 0.12); break;
      case 'wood': this.noise(0.1, 320, 0.24 * amount); this.tone(120, 70, 0.12, 'triangle', 0.16); break;
      case 'stone': this.noise(0.16, 150, 0.3 * amount); break;
      case 'explosion': this.noise(0.5, 180, 0.48 * amount); this.tone(100, 35, 0.45, 'sawtooth', 0.2); break;
      case 'boing': this.tone(160, 620, 0.3, 'sine', 0.24); break;
      case 'portal': this.tone(280, 1050, 0.28, 'sine', 0.18); this.tone(560, 1400, 0.23, 'triangle', 0.08); break;
      case 'collect': this.tone(660, 990, 0.12, 'sine', 0.18); this.tone(990, 1320, 0.22, 'sine', 0.13, 0.1); break;
      case 'win':
        [523, 659, 784, 1047].forEach((frequency, index) => this.tone(frequency, frequency, 0.3, 'triangle', 0.16, index * 0.12));
        break;
      case 'lose': this.tone(280, 110, 0.65, 'sawtooth', 0.14); break;
      case 'click': this.tone(420, 520, 0.055, 'sine', 0.08); break;
    }
  }

  private meow(delay: number): void {
    this.tone(420, 760, 0.16, 'sawtooth', 0.055, delay);
    this.tone(760, 360, 0.24, 'sawtooth', 0.045, delay + 0.14);
  }

  private tone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(duration: number, cutoff: number, volume: number): void {
    if (!this.context || !this.master) return;
    const length = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
  }
}
