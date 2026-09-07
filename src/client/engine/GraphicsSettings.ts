export type GraphicsQuality = 'low' | 'medium' | 'high';

interface QualityProfile {
  // Hard ceiling on devicePixelRatio (avoids paying full cost on 2x/3x-DPR displays).
  dprCap: number;
  // Extra multiplier on top of dpr, applied to the canvas's backing-buffer resolution
  // while its CSS size stays 100%/100% — lowers GPU/CPU fill-rate on weak hardware.
  // The canvas already renders with `image-rendering: pixelated` and
  // `imageSmoothingEnabled = false`, so scaling below 1.0 reads as a deliberate
  // low-res pixel-art look rather than a blurry downscale.
  renderScale: number;
}

// 'medium' matches this game's pre-existing (pre-quality-setting) behavior exactly,
// so leaving quality untouched changes nothing for existing players.
const PROFILES: Record<GraphicsQuality, QualityProfile> = {
  low: { dprCap: 1.0, renderScale: 0.75 },
  medium: { dprCap: 1.5, renderScale: 1.0 },
  high: { dprCap: 2.0, renderScale: 1.0 }
};

const STORAGE_KEY = 'torment_graphics_quality';
const ORDER: GraphicsQuality[] = ['low', 'medium', 'high'];

class GraphicsSettingsService {
  private quality: GraphicsQuality = 'medium';
  private listeners: ((quality: GraphicsQuality) => void)[] = [];

  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === 'low' || saved === 'medium' || saved === 'high') {
      this.quality = saved;
    }
  }

  public getQuality(): GraphicsQuality {
    return this.quality;
  }

  public getProfile(): QualityProfile {
    return PROFILES[this.quality];
  }

  public setQuality(quality: GraphicsQuality): void {
    if (this.quality === quality) return;
    this.quality = quality;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, quality);
    }
    this.notify();
  }

  public cycleQuality(): GraphicsQuality {
    const next = ORDER[(ORDER.indexOf(this.quality) + 1) % ORDER.length];
    this.setQuality(next);
    return next;
  }

  public onQualityChanged(cb: (quality: GraphicsQuality) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l(this.quality);
  }
}

export const GraphicsSettings = new GraphicsSettingsService();
