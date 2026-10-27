/**
 * Subtle synthesized UI sound effects using Web Audio API.
 * Avoids external audio file network dependencies, 404s, and latency.
 */

let sharedAudioCtx: AudioContext | null = null;
let isUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Automatically unlock the AudioContext on first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (isUnlocked) return;
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
        isUnlocked = true;
      }
    } catch {
      /* ignore */
    }
  };

  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((ev) => {
    window.addEventListener(ev, unlockAudio, { passive: true, once: true });
  });
}

function playChimeNodes(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;

    // Tone 1: Gentle warm fundamental note (A5 - 880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(840, now + 0.16);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.05, now + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.19);

    // Tone 2: Subtle harmonic sparkle note (E6 - 1318.5 Hz) triggered 35ms after
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.035);
    osc2.frequency.exponentialRampToValueAtTime(1380, now + 0.18);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.0001, now + 0.035);
    gain2.gain.linearRampToValueAtTime(0.035, now + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.035);
    osc2.stop(now + 0.23);
  } catch {
    // Ignore any web audio processing errors
  }
}

/**
 * Plays a warm, subtle, luxury 2-harmonic notification chime.
 * Tuned to mimic high-end micro-interactions (soft, non-startling).
 */
export function playNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playChimeNodes(ctx)).catch(() => {});
      return;
    }

    playChimeNodes(ctx);
  } catch {
    // Graceful silent fallback
  }
}
