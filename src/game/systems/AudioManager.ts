/**
 * 퍼즐 효과음과 오르골 멜로디를 담당하는 Web Audio 매니저.
 * 배경 앰비언스는 useRoomAmbience가 따로 담당한다.
 *
 * 오르골 멜로디는 임시 테스트용 자체 신시사이저 왈츠다.
 * 저작권이 있는 음원을 재현하거나 다운로드하지 않는다.
 * TODO_USER_MEMORY: 사용자가 제공하는 직접 연주/음원 파일로 교체.
 */

export type EffectName =
  | "seal-open"
  | "frame-move"
  | "color-button"
  | "keyring-attach"
  | "carousel-detach"
  | "painting-engage"
  | "tile-press"
  | "tile-wrong"
  | "magnet-snap"
  | "wrong-answer"
  | "steak-wrong"
  | "steak-right"
  | "door-bolt"
  | "hint-stamp"
  | "runaway-giggle"
  | "pickup"
  | "unlock";

type NoteStep = { frequency: number; at: number; duration: number; gain?: number };

const NOTE = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
};

class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private melodyNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  enabled = true;

  private ensureContext() {
    if (typeof window === "undefined") {
      return null;
    }
    if (this.context && this.context.state !== "closed") {
      void this.context.resume().catch(() => undefined);
      return this.context;
    }
    const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.28;
    this.master.connect(this.context.destination);
    return this.context;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMelody();
    }
  }

  private tone(
    frequency: number,
    startOffset: number,
    duration: number,
    options: { type?: OscillatorType; gain?: number; glideTo?: number; detune?: number } = {},
  ) {
    const context = this.ensureContext();
    if (!context || !this.master || !this.enabled) {
      return;
    }
    const now = context.currentTime + startOffset;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = options.type ?? "sine";
    osc.frequency.setValueAtTime(frequency, now);
    if (options.detune) {
      osc.detune.setValueAtTime(options.detune, now);
    }
    if (options.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, options.glideTo), now + duration);
    }
    const peak = options.gain ?? 0.16;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private noise(startOffset: number, duration: number, gainValue = 0.08, filterFrequency = 2400) {
    const context = this.ensureContext();
    if (!context || !this.master || !this.enabled) {
      return;
    }
    const now = context.currentTime + startOffset;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFrequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
  }

  play(effect: EffectName) {
    if (!this.enabled) {
      return;
    }
    switch (effect) {
      case "seal-open":
        this.tone(NOTE.E5, 0, 0.32, { type: "triangle", gain: 0.14 });
        this.tone(NOTE.B5, 0.12, 0.5, { type: "sine", gain: 0.1 });
        this.noise(0.02, 0.22, 0.045, 1800);
        return;
      case "frame-move":
        this.tone(NOTE.G4, 0, 0.12, { type: "triangle", gain: 0.1 });
        this.noise(0, 0.1, 0.05, 900);
        return;
      case "color-button":
        this.tone(NOTE.C5, 0, 0.14, { type: "square", gain: 0.06 });
        return;
      case "keyring-attach":
        this.tone(NOTE.B4, 0, 0.1, { type: "square", gain: 0.08 });
        this.tone(NOTE.E5, 0.09, 0.34, { type: "triangle", gain: 0.12 });
        this.noise(0, 0.08, 0.05, 3200);
        return;
      case "carousel-detach":
        this.tone(NOTE.E5, 0, 0.16, { type: "triangle", gain: 0.1 });
        this.tone(NOTE.G5, 0.14, 0.16, { type: "triangle", gain: 0.1 });
        this.tone(NOTE.C6, 0.28, 0.4, { type: "sine", gain: 0.1 });
        return;
      case "painting-engage":
        this.tone(NOTE.C4, 0, 0.5, { type: "sawtooth", gain: 0.05, glideTo: NOTE.C5 });
        this.tone(NOTE.E5, 0.4, 0.5, { type: "sine", gain: 0.1 });
        return;
      case "tile-press":
        this.tone(120, 0, 0.28, { type: "sine", gain: 0.2, glideTo: 60 });
        this.noise(0, 0.2, 0.08, 500);
        return;
      case "tile-wrong":
        this.tone(90, 0, 0.16, { type: "sine", gain: 0.14, glideTo: 70 });
        return;
      case "magnet-snap":
        this.tone(NOTE.A4, 0, 0.08, { type: "square", gain: 0.09 });
        this.noise(0, 0.06, 0.07, 2600);
        return;
      case "wrong-answer":
        this.tone(NOTE.E4, 0, 0.2, { type: "triangle", gain: 0.1 });
        this.tone(NOTE.C4, 0.16, 0.34, { type: "triangle", gain: 0.1 });
        return;
      case "steak-wrong":
        this.tone(NOTE.B4, 0, 0.22, { type: "sawtooth", gain: 0.05, glideTo: NOTE.F4 });
        this.tone(NOTE.F4, 0.2, 0.4, { type: "sine", gain: 0.08 });
        return;
      case "steak-right":
        this.tone(NOTE.C5, 0, 0.18, { type: "triangle", gain: 0.12 });
        this.tone(NOTE.E5, 0.16, 0.18, { type: "triangle", gain: 0.12 });
        this.tone(NOTE.G5, 0.32, 0.42, { type: "triangle", gain: 0.12 });
        return;
      case "door-bolt":
        this.noise(0, 0.16, 0.1, 700);
        this.tone(150, 0.1, 0.4, { type: "square", gain: 0.07, glideTo: 90 });
        this.tone(NOTE.C5, 0.42, 0.7, { type: "sine", gain: 0.1 });
        return;
      case "hint-stamp":
        this.tone(180, 0, 0.12, { type: "square", gain: 0.12, glideTo: 90 });
        this.noise(0, 0.12, 0.08, 1300);
        return;
      case "runaway-giggle":
        this.tone(NOTE.A5, 0, 0.07, { type: "sine", gain: 0.06 });
        this.tone(NOTE.C6, 0.08, 0.07, { type: "sine", gain: 0.055 });
        this.tone(NOTE.E5, 0.16, 0.09, { type: "sine", gain: 0.05 });
        return;
      case "pickup":
        this.tone(NOTE.D5, 0, 0.1, { type: "triangle", gain: 0.1 });
        this.tone(NOTE.A5, 0.09, 0.24, { type: "triangle", gain: 0.1 });
        return;
      case "unlock":
        this.tone(NOTE.G4, 0, 0.12, { type: "triangle", gain: 0.11 });
        this.tone(NOTE.D5, 0.11, 0.14, { type: "triangle", gain: 0.11 });
        this.tone(NOTE.G5, 0.24, 0.42, { type: "sine", gain: 0.12 });
        this.noise(0.02, 0.12, 0.05, 2100);
        return;
      default:
        return;
    }
  }

  /**
   * 임시 자체 제작 오르골 왈츠 (3/4). 실제 곡의 멜로디를 복제하지 않은
   * 자리표시자 연주이며, 사용자가 음원을 제공하면 교체한다.
   */
  playCarouselWaltz() {
    if (!this.enabled) {
      return;
    }
    this.stopMelody();
    const beat = 0.42;
    const bar = beat * 3;
    const melody: NoteStep[] = [
      { frequency: NOTE.E5, at: 0, duration: beat },
      { frequency: NOTE.G5, at: beat, duration: beat },
      { frequency: NOTE.B5, at: beat * 2, duration: beat },
      { frequency: NOTE.A5, at: bar, duration: beat * 2 },
      { frequency: NOTE.E5, at: bar + beat * 2, duration: beat },
      { frequency: NOTE.F5, at: bar * 2, duration: beat },
      { frequency: NOTE.A5, at: bar * 2 + beat, duration: beat },
      { frequency: NOTE.C6, at: bar * 2 + beat * 2, duration: beat },
      { frequency: NOTE.B5, at: bar * 3, duration: beat * 3, gain: 0.1 },
      { frequency: NOTE.G5, at: bar * 4, duration: beat },
      { frequency: NOTE.B5, at: bar * 4 + beat, duration: beat },
      { frequency: NOTE.E5, at: bar * 4 + beat * 2, duration: beat },
      { frequency: NOTE.A5, at: bar * 5, duration: beat * 2 },
      { frequency: NOTE.F5, at: bar * 5 + beat * 2, duration: beat },
      { frequency: NOTE.G5, at: bar * 6, duration: beat * 2 },
      { frequency: NOTE.D5, at: bar * 6 + beat * 2, duration: beat },
      { frequency: NOTE.E5, at: bar * 7, duration: beat * 3, gain: 0.11 },
    ];
    const bass: NoteStep[] = [];
    const bassRoots = [NOTE.E4 / 2, NOTE.A4 / 4, NOTE.F4 / 2, NOTE.B4 / 4, NOTE.E4 / 2, NOTE.F4 / 2, NOTE.G4 / 2, NOTE.E4 / 2];
    bassRoots.forEach((root, index) => {
      bass.push({ frequency: root * 2, at: bar * index, duration: beat, gain: 0.05 });
      bass.push({ frequency: root * 3, at: bar * index + beat, duration: beat * 0.8, gain: 0.03 });
      bass.push({ frequency: root * 3, at: bar * index + beat * 2, duration: beat * 0.8, gain: 0.03 });
    });
    for (const step of melody) {
      this.tone(step.frequency, step.at, step.duration * 1.05, { type: "sine", gain: step.gain ?? 0.09 });
      this.tone(step.frequency * 2, step.at, step.duration * 0.6, { type: "sine", gain: (step.gain ?? 0.09) * 0.22 });
    }
    for (const step of bass) {
      this.tone(step.frequency, step.at, step.duration, { type: "triangle", gain: step.gain ?? 0.04 });
    }
  }

  get carouselWaltzDuration() {
    return 0.42 * 3 * 8 + 0.6;
  }

  stopMelody() {
    for (const node of this.melodyNodes) {
      try {
        node.osc.stop();
      } catch {
        // already stopped
      }
    }
    this.melodyNodes = [];
  }
}

export const audioManager = new AudioManager();
