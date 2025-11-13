// Sound Manager - Handles all game audio and sound effects

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private currentMusic: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Generate procedural sounds (no external files needed)
  private createSound(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    if (!this.audioContext) return null as any;

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      let value = 0;

      switch (type) {
        case 'sine':
          value = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          value = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          value = 4 * Math.abs(t * frequency - Math.floor(t * frequency + 0.5)) - 1;
          break;
      }

      // Apply envelope (attack, decay, sustain, release)
      const envelope = Math.exp(-3 * t / duration);
      data[i] = value * envelope;
    }

    return buffer;
  }

  // Initialize all game sounds
  initSounds() {
    if (!this.audioContext) return;

    // Village sounds
    this.sounds.set('village_ambient', this.createAmbientSound());
    this.sounds.set('click', this.createSound(800, 0.1, 'sine'));
    this.sounds.set('hover', this.createSound(600, 0.05, 'sine'));
    this.sounds.set('building_select', this.createSound(440, 0.2, 'triangle'));

    // Dragon sounds
    this.sounds.set('dragon_roar', this.createDragonRoar());
    this.sounds.set('fire_breath', this.createFireBreath());
    this.sounds.set('wing_flap', this.createWingFlap());
    this.sounds.set('dragon_hatch', this.createHatchSound());

    // Battle sounds
    this.sounds.set('attack_melee', this.createMeleeAttack());
    this.sounds.set('attack_fire', this.createFireAttack());
    this.sounds.set('attack_ice', this.createIceAttack());
    this.sounds.set('attack_lightning', this.createLightningAttack());
    this.sounds.set('hit', this.createHitSound());
    this.sounds.set('victory', this.createVictorySound());
    this.sounds.set('defeat', this.createDefeatSound());

    // UI sounds
    this.sounds.set('collect', this.createCollectSound());
    this.sounds.set('level_up', this.createLevelUpSound());
    this.sounds.set('quest_complete', this.createQuestCompleteSound());
    this.sounds.set('error', this.createErrorSound());
    this.sounds.set('notification', this.createNotificationSound());

    // Breeding & Hatching
    this.sounds.set('breeding_start', this.createBreedingSound());
    this.sounds.set('egg_crack', this.createEggCrackSound());
    this.sounds.set('hatch_complete', this.createHatchCompleteSound());

    // Training
    this.sounds.set('training_start', this.createTrainingSound());
    this.sounds.set('training_complete', this.createTrainingCompleteSound());
  }

  // Complex sound generators
  private createAmbientSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 4;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      // Layered ambient sounds (wind, birds, nature)
      data[i] = 
        Math.sin(2 * Math.PI * 200 * t) * 0.1 +
        Math.sin(2 * Math.PI * 300 * t + Math.sin(t)) * 0.08 +
        (Math.random() - 0.5) * 0.05; // White noise for wind
      data[i] *= Math.sin(Math.PI * t / duration); // Fade in/out
    }

    return buffer;
  }

  private createDragonRoar(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 1.5;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      const freq = 150 - t * 50; // Descending pitch
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2);
      data[i] += (Math.random() - 0.5) * 0.3 * Math.exp(-t); // Growl texture
    }

    return buffer;
  }

  private createFireBreath(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 0.8;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      // Whoosh sound with crackling
      data[i] = (Math.random() - 0.5) * Math.exp(-t * 3);
      data[i] += Math.sin(2 * Math.PI * 100 * t) * 0.3 * Math.exp(-t * 2);
    }

    return buffer;
  }

  private createWingFlap(): AudioBuffer {
    return this.createSound(180, 0.3, 'triangle');
  }

  private createHatchSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 0.5;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      // Cracking sound
      data[i] = (Math.random() - 0.5) * 0.8 * Math.exp(-t * 5);
      if (Math.random() > 0.95) data[i] *= 2; // Random cracks
    }

    return buffer;
  }

  private createMeleeAttack(): AudioBuffer {
    return this.createSound(200, 0.15, 'square');
  }

  private createFireAttack(): AudioBuffer {
    return this.createFireBreath();
  }

  private createIceAttack(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 0.6;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      // High-pitched crystalline sound
      data[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 4);
      data[i] += Math.sin(2 * Math.PI * 1800 * t) * 0.5 * Math.exp(-t * 3);
    }

    return buffer;
  }

  private createLightningAttack(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 0.4;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      // Electric crackling
      data[i] = (Math.random() - 0.5) * Math.exp(-t * 8);
      if (Math.random() > 0.9) data[i] *= 3; // Lightning bolts
    }

    return buffer;
  }

  private createHitSound(): AudioBuffer {
    return this.createSound(150, 0.1, 'square');
  }

  private createVictorySound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 1.5;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523, 587, 659, 784]; // C-D-E-G major chord
    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      data[i] = notes.reduce((sum, freq) => sum + Math.sin(2 * Math.PI * freq * t) * 0.25, 0);
      data[i] *= Math.exp(-t);
    }

    return buffer;
  }

  private createDefeatSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      const freq = 200 - t * 100; // Descending sad tone
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 1.5);
    }

    return buffer;
  }

  private createCollectSound(): AudioBuffer {
    return this.createSound(880, 0.2, 'sine');
  }

  private createLevelUpSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    const duration = 0.8;
    const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [440, 554, 659]; // A-C#-E ascending
    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.audioContext.sampleRate;
      const noteIndex = Math.floor(t / (duration / 3));
      const freq = notes[Math.min(noteIndex, 2)];
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2);
    }

    return buffer;
  }

  private createQuestCompleteSound(): AudioBuffer {
    return this.createLevelUpSound();
  }

  private createErrorSound(): AudioBuffer {
    return this.createSound(200, 0.2, 'square');
  }

  private createNotificationSound(): AudioBuffer {
    return this.createSound(600, 0.15, 'sine');
  }

  private createBreedingSound(): AudioBuffer {
    return this.createSound(550, 0.5, 'sine');
  }

  private createEggCrackSound(): AudioBuffer {
    return this.createHatchSound();
  }

  private createHatchCompleteSound(): AudioBuffer {
    return this.createLevelUpSound();
  }

  private createTrainingSound(): AudioBuffer {
    return this.createSound(400, 0.3, 'triangle');
  }

  private createTrainingCompleteSound(): AudioBuffer {
    return this.createCollectSound();
  }

  // Play sound effect
  play(soundName: string, volume: number = 1.0) {
    if (!this.audioContext || this.isMuted || !this.sounds.has(soundName)) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume * this.sfxVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  // Play looping ambient music
  playMusic(soundName: string) {
    if (!this.audioContext || this.isMuted || !this.sounds.has(soundName)) return;

    this.stopMusic();

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    this.currentMusic = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    this.currentMusic.buffer = buffer;
    this.currentMusic.loop = true;
    gainNode.gain.value = this.musicVolume;

    this.currentMusic.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    this.currentMusic.start(0);
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }
}

// Global sound manager instance
export const soundManager = new SoundManager();
