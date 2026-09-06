export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.3; // Default 30% volume - comfortable!
  private isMuted: boolean = false;

  constructor() {
    const savedVol = localStorage.getItem('torment_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        this.volume = parsed;
      }
    }

    const savedMute = localStorage.getItem('torment_muted');
    if (savedMute === 'true') {
      this.isMuted = true;
    }

    const initAudio = () => {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('mousedown', initAudio);
    window.addEventListener('keydown', initAudio);
  }

  private getOutput(): AudioNode | null {
    if (!this.ctx) return null;
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.masterGain;
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('torment_volume', this.volume.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('torment_muted', this.isMuted ? 'true' : 'false');
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // 1. Blade Slash Whoosh (Plays on attack swing)
  public playSlash(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 2. Ranger Bow Shot (Plays on arrow release)
  public playBowShot(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 3. Sorceress Lightning Crack (Plays on spell cast)
  public playLightning(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';

    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 4. Cleric Holy Smite (Plays on hammer slam)
  public playHolySmite(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Commando M4A1 Burst Gunshot Sound
  public playRifleBurst(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const shotTime = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(550 - i * 30, shotTime);
      osc.frequency.exponentialRampToValueAtTime(80, shotTime + 0.04);

      gain.gain.setValueAtTime(0.18, shotTime);
      gain.gain.exponentialRampToValueAtTime(0.005, shotTime + 0.04);

      osc.connect(gain);
      gain.connect(out);

      osc.start(shotTime);
      osc.stop(shotTime + 0.04);
    }
  }

  // Cat Tank Paw Slam & Impact Thud
  public playCatPawSlam(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    // Heavy bass thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Cowboy Heavy Revolver Gunshot & Hammer Cock
  public playRevolverShot(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    // Gunpowder blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.08);

    // Metallic barrel echo
    const metal = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();
    metal.type = 'square';
    metal.frequency.setValueAtTime(1400, now);
    metal.frequency.exponentialRampToValueAtTime(280, now + 0.04);
    metalGain.gain.setValueAtTime(0.08, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    metal.connect(metalGain);
    metalGain.connect(out);
    metal.start(now);
    metal.stop(now + 0.04);
  }

  // Celestial Mecha GN Beam Saber Slash & Plasma Buzz
  public playBeamSaber(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    // Plasma hum sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.14);

    // High energy sizzle
    const sizzle = this.ctx.createOscillator();
    const sizzleGain = this.ctx.createGain();
    sizzle.type = 'sine';
    sizzle.frequency.setValueAtTime(1800, now);
    sizzle.frequency.exponentialRampToValueAtTime(450, now + 0.10);
    sizzleGain.gain.setValueAtTime(0.06, now);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    sizzle.connect(sizzleGain);
    sizzleGain.connect(out);
    sizzle.start(now);
    sizzle.stop(now + 0.10);
  }

  // The Gambler Rapid Card Flick & Aerodynamic Snap
  public playCardThrow(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // The Gambler Polyhedral Dice Roll Clatter
  public playDiceRoll(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const freqs = [620, 840, 720];
    for (let i = 0; i < 3; i++) {
      const clickTime = now + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[i], clickTime);
      osc.frequency.exponentialRampToValueAtTime(180, clickTime + 0.035);

      gain.gain.setValueAtTime(0.12, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.005, clickTime + 0.035);

      osc.connect(gain);
      gain.connect(out);
      osc.start(clickTime);
      osc.stop(clickTime + 0.035);
    }
  }

  // The Gambler 777 Slot Machine Jackpot Chime Fanfare
  public playJackpot(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    for (let i = 0; i < notes.length; i++) {
      const noteTime = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[i], noteTime);

      gain.gain.setValueAtTime(0.20, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.005, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(out);
      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    }
  }

  // 5. Meat & Flesh Hit Impact (Plays when damage registers on monsters)
  public playHitImpact(isCrit: boolean): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'sawtooth' : 'triangle';

    const startFreq = isCrit ? 200 : 140;
    const endFreq = isCrit ? 40 : 35;
    const duration = isCrit ? 0.12 : 0.07;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(isCrit ? 0.22 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 6. EXP Gem Pickup Chime
  public playExpPickup(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    const freqs = [523.25, 659.25, 783.99, 1046.5];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 7. Level Up Fanfare
  public playLevelUp(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const startTime = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.connect(gain);
      gain.connect(out);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  // 10. Ancient Dungeon Portal Gate Rumble
  public playPortalEnter(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    // Deep stone rumble
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(85, now);
    osc1.frequency.exponentialRampToValueAtTime(28, now + 1.2);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(out);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Arcane portal shimmer
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(330, now);
    osc2.frequency.exponentialRampToValueAtTime(920, now + 1.0);
    gain2.gain.setValueAtTime(0.14, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(out);
    osc2.start(now);
    osc2.stop(now + 1.2);
  }

  // 11. Hero Spacebar Dash / Dodge Whoosh
  public playDash(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 12. Enemy Ranged Attack Shoot Sound
  public playEnemyShoot(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 13. Battlefield Shrine Activation Chime
  public playShrineBuff(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const notes = [440, 554.37, 659.25, 880]; // A Major divine arpeggio
    notes.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.002, startTime + 0.35);

      osc.connect(gain);
      gain.connect(out);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // 14. UI Click Tick
  public playClick(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 15. Gear Vault Equip Clank
  public playEquip(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 16. Trial Quest Reward Fanfare
  public playFanfare(): void {
    if (this.isMuted || !this.ctx) return;
    const out = this.getOutput();
    if (!out) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C Major triumphant fanfare
    notes.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.3);
      osc.connect(gain);
      gain.connect(out);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }
}
