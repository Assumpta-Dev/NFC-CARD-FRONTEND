/**
 * Short "new order" chime via Web Audio API — no asset files required.
 * Browsers block audio until a user gesture; call unlockOrderAlertSound()
 * once after click/keydown on the orders page.
 */

let sharedCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  return sharedCtx;
}

/** Call from a click/keydown so later order alerts may play. */
export async function unlockOrderAlertSound(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  unlocked = ctx.state === "running";
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gainPeak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Play a clear two-note alert for a new incoming order. */
export async function playOrderAlertSound(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running" && !unlocked) return;

  const t = ctx.currentTime;
  // Bright ascending chime
  tone(ctx, 880, t, 0.16, 0.22);
  tone(ctx, 1175, t + 0.12, 0.22, 0.2);
  tone(ctx, 1397, t + 0.26, 0.28, 0.16);
}

const SOUND_PREF_KEY = "nfc_order_alert_sound";

export function isOrderAlertSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(SOUND_PREF_KEY);
    return v !== "off";
  } catch {
    return true;
  }
}

export function setOrderAlertSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? "on" : "off");
  } catch {
    /* ignore */
  }
}
