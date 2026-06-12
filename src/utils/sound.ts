/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple synthesizer using the Web Audio API for classic 8-bit game sounds.
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;
  private bgmInterval: any = null;

  constructor() {
    // Lazy initialisation to comply with user interaction policy
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.enabled = true;
    }
  }

  toggle(on?: boolean) {
    if (on !== undefined) {
      if (on) this.init();
      this.enabled = on;
    } else {
      if (!this.ctx) this.init();
      this.enabled = !this.enabled;
    }
    if (!this.enabled) {
      this.stopBgm();
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, startGain: number = 0.1) {
    if (!this.enabled || !this.ctx) return null;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(startGain, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      return { osc, gainNode };
    } catch (e) {
      console.error("Audio error", e);
      return null;
    }
  }

  playClick() {
    const sound = this.createOscillator('sine', 600, 0.1, 0.05);
    if (sound) {
      sound.osc.start();
      sound.osc.stop(this.ctx!.currentTime + 0.1);
    }
  }

  playCoin() {
    if (!this.enabled || !this.ctx) return;
    try {
      const sound1 = this.createOscillator('sine', 987.77, 0.08, 0.08);
      if (sound1 && this.ctx) {
        sound1.osc.start();
        sound1.osc.stop(this.ctx.currentTime + 0.08);
      }
      setTimeout(() => {
        if (!this.enabled || !this.ctx) return;
        const sound2 = this.createOscillator('sine', 1318.51, 0.15, 0.08);
        if (sound2 && this.ctx) {
          sound2.osc.start();
          sound2.osc.stop(this.ctx.currentTime + 0.15);
        }
      }, 80);
    } catch {}
  }

  playAttack(weaponType: string) {
    const freq = weaponType === 'KATANA' ? 1200 : weaponType === 'SWORD' ? 800 : 500;
    const duration = 0.15;
    const sound = this.createOscillator('triangle', freq, duration, 0.1);
    if (sound && this.ctx) {
      // Swipe down frequency effect
      sound.osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);
      sound.osc.start();
      sound.osc.stop(this.ctx.currentTime + duration);
    }
  }

  playHitEnemy() {
    const duration = 0.12;
    const sound = this.createOscillator('sawtooth', 150, duration, 0.08);
    if (sound && this.ctx) {
      // Noise-like pitch drop
      sound.osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + duration);
      sound.osc.start();
      sound.osc.stop(this.ctx.currentTime + duration);
    }
  }

  playHitPlayer() {
    const duration = 0.3;
    const sound = this.createOscillator('sawtooth', 100, duration, 0.15);
    if (sound && this.ctx) {
      sound.osc.frequency.linearRampToValueAtTime(10, this.ctx.currentTime + duration);
      sound.osc.start();
      sound.osc.stop(this.ctx.currentTime + duration);
    }
  }

  playUiConfirm() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const sound = this.createOscillator('sine', freq, 0.15, 0.08);
          if (sound && this.ctx) {
            sound.osc.start();
            sound.osc.stop(this.ctx.currentTime + 0.15);
          }
        }, idx * 70);
      });
    } catch {}
  }

  playLevelUp() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [392.00, 440.00, 493.88, 587.33, 659.25, 783.99]; // G4, A4, B4, D5, E5, G5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const sound = this.createOscillator('sine', freq, 0.25, 0.08);
          if (sound && this.ctx) {
            sound.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            sound.osc.start();
            sound.osc.stop(this.ctx.currentTime + 0.25);
          }
        }, idx * 100);
      });
    } catch {}
  }

  playGameOver() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [392.00, 349.23, 311.13, 261.63, 196.00]; // descending
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const sound = this.createOscillator('sawtooth', freq, 0.4, 0.15);
          if (sound && this.ctx) {
            sound.osc.start();
            oscillatorSlide(sound.osc, freq, freq - 50, 0.4, this.ctx);
            sound.osc.stop(this.ctx.currentTime + 0.4);
          }
        }, idx * 200);
      });
    } catch {}
  }

  playVictory() {
    if (!this.enabled || !this.ctx) return;
    try {
      const melody = [523.25, 523.25, 523.25, 523.25, 659.25, 587.33, 659.25, 783.99, 1046.50];
      const durations = [150, 150, 150, 300, 300, 150, 150, 150, 600];
      let cumulativeTime = 0;
      melody.forEach((freq, idx) => {
        setTimeout(() => {
          const sound = this.createOscillator('sine', freq, durations[idx] / 1000, 0.1);
          if (sound && this.ctx) {
            sound.osc.start();
            sound.osc.stop(this.ctx.currentTime + (durations[idx] / 1000));
          }
        }, cumulativeTime);
        cumulativeTime += durations[idx] + 20;
      });
    } catch {}
  }

  startBgm() {
    this.stopBgm();
    if (!this.enabled || !this.ctx) return;
    
    let noteIdx = 0;
    // Simple 8-bit retro loop
    const bassline = [110, 110, 130, 130, 146, 146, 165, 146, 110, 110, 130, 130, 165, 165, 196, 165];
    
    this.bgmInterval = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const freq = bassline[noteIdx % bassline.length];
      const sound = this.createOscillator('triangle', freq, 0.25, 0.05);
      if (sound) {
        sound.osc.start();
        sound.osc.stop(this.ctx.currentTime + 0.25);
      }
      noteIdx++;
    }, 300);
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

function oscillatorSlide(osc: OscillatorNode, startF: number, endF: number, duration: number, ctx: AudioContext) {
  osc.frequency.setValueAtTime(startF, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(endF, ctx.currentTime + duration);
}

export const soundEngine = new SoundEngine();
