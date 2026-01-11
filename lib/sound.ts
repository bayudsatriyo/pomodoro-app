/**
 * Sound Manager for audio notifications
 * Uses Web Audio API for cross-browser compatibility
 */
class SoundManager {
  private audioContext: AudioContext | null = null;
  private speechSynth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.speechSynth = window.speechSynthesis;
    }
  }

  /**
   * Play a tone with specified frequencies and durations
   */
  private playTone(
    frequencies: number[],
    durations: number[],
    volume: number = 0.3
  ) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    let currentTime = ctx.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(volume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        currentTime + durations[index]
      );

      oscillator.start(currentTime);
      oscillator.stop(currentTime + durations[index]);

      currentTime += durations[index];
    });
  }

  /**
   * Notification beep (for health reminders)
   */
  playNotification() {
    this.playTone([600], [0.15], 0.3);
  }

  /**
   * Session complete - double beep
   */
  playSessionComplete() {
    this.playTone([500, 500], [0.1, 0.2], 0.4);
  }

  /**
   * Break end - ascending tone
   */
  playBreakEnd() {
    this.playTone([400, 500, 600], [0.1, 0.1, 0.2], 0.3);
  }

  /**
   * Posture warning - urgent alert
   */
  playPostureWarning() {
    // Urgent beep: higher frequency, longer duration
    this.playTone([800, 900, 800], [0.15, 0.15, 0.3], 0.4);
  }

  /**
   * Posture good - gentle chime (optional)
   */
  playPostureGood() {
    // Gentle ascending chime
    this.playTone([500, 600], [0.1, 0.15], 0.2);
  }

  /**
   * Text-to-Speech - Speak out the message
   * Uses Web Speech Synthesis API
   */
  speak(text: string, lang: string = "id-ID") {
    const speechSynth = this.speechSynth;
    if (!speechSynth) {
      return;
    }

    // Cancel any ongoing speech first
    speechSynth.cancel();

    // Split long text into sentences to avoid interruption
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let index = 0;
    const speakNext = () => {
      if (index >= sentences.length) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
      utterance.lang = lang;
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      utterance.onend = () => {
        index++;
        // Small delay before next sentence
        setTimeout(speakNext, 100);
      };

      utterance.onerror = (event) => {
        console.error("[TTS] Speech error:", event.error);
        index++;
        speakNext();
      };

      speechSynth.speak(utterance);
    };

    // Resume speech synthesis if paused (common Chrome bug)
    if (speechSynth.paused) {
      speechSynth.resume();
    }

    speakNext();
  }
}

export const soundManager = new SoundManager();
