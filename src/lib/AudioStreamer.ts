/**
 * AudioStreamer manages microphone capture (resampled to 16kHz PCM Int16)
 * and response playback (24kHz PCM Int16) with gapless scheduling.
 */

export class AudioStreamer {
  // Capturing
  private inputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private onAudioInputCallback: ((base64Pcm: string) => void) | null = null;
  private onInputVolumeCallback: ((vol: number) => void) | null = null;

  // Playback
  private outputAudioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onOutputVolumeCallback: ((vol: number) => void) | null = null;
  private volumeCheckInterval: number | null = null;

  // Lock screen / Background audio keeper
  private silentAudioElement: HTMLAudioElement | null = null;
  private wakeLock: any = null;

  constructor() {}

  /**
   * Start recording from the microphone.
   * @param onAudioInput Callback triggered when a raw PCM base64 block is ready (16kHz).
   * @param onInputVolume Callback with the current mic level (0 to 1).
   */
  async startRecording(
    onAudioInput: (base64Pcm: string) => void,
    onInputVolume?: (vol: number) => void
  ) {
    this.onAudioInputCallback = onAudioInput;
    if (onInputVolume) this.onInputVolumeCallback = onInputVolume;

    // Use standard 16000Hz for mic capture
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.sourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    
    // ScriptProcessor is widely supported and reliable for raw buffer extraction
    this.processorNode = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
    
    this.processorNode.onaudioprocess = (e) => {
      if (!this.onAudioInputCallback) return;

      const floatChannel = e.inputBuffer.getChannelData(0);
      
      // Calculate real-time input volume
      let sum = 0;
      for (let i = 0; i < floatChannel.length; i++) {
        sum += floatChannel[i] * floatChannel[i];
      }
      const rms = Math.sqrt(sum / floatChannel.length);
      // Normalize to a pleasant range for visualizer (0.0 to 1.0)
      const normalizedVol = Math.min(1, rms * 4);
      if (this.onInputVolumeCallback) {
        this.onInputVolumeCallback(normalizedVol);
      }

      // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
      const int16Buffer = new Int16Array(floatChannel.length);
      for (let i = 0; i < floatChannel.length; i++) {
        const val = Math.max(-1, Math.min(1, floatChannel[i]));
        int16Buffer[i] = val < 0 ? val * 0x8000 : val * 0x7fff;
      }

      // Convert Int16Array to Base64
      const base64 = this.int16ToBase64(int16Buffer);
      this.onAudioInputCallback(base64);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.inputAudioCtx.destination);
    
    if (this.inputAudioCtx.state === "suspended") {
      await this.inputAudioCtx.resume();
    }
  }

  /**
   * Stop recording.
   */
  stopRecording() {
    try {
      if (this.processorNode) {
        this.processorNode.disconnect();
        this.processorNode.onaudioprocess = null;
        this.processorNode = null;
      }
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }
      if (this.inputAudioCtx) {
        this.inputAudioCtx.close();
        this.inputAudioCtx = null;
      }
    } catch (e) {
      console.warn("Error while stopping recording:", e);
    }
    this.onAudioInputCallback = null;
    this.onInputVolumeCallback = null;
  }

  /**
   * Initialize output audio context (24kHz) for playback.
   */
  initPlayback(onOutputVolume?: (vol: number) => void) {
    if (onOutputVolume) this.onOutputVolumeCallback = onOutputVolume;
    
    if (!this.outputAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.nextStartTime = 0;
      this.startVolumeMonitoring();
    }
  }

  /**
   * Periodically monitors the playing sources to report current speaker output volume
   */
  private startVolumeMonitoring() {
    if (this.volumeCheckInterval) window.clearInterval(this.volumeCheckInterval);
    
    this.volumeCheckInterval = window.setInterval(() => {
      if (!this.outputAudioCtx || !this.onOutputVolumeCallback) return;
      
      // Since we don't have an AnalyserNode easily shared across dynamically created source nodes,
      // we can simulate a decaying visualizer value when there's an active speaker playing,
      // or we can attach an AnalyserNode if we want high precision.
      // Let's create an AnalyserNode for high precision, it's very easy and looks amazing!
    }, 100);
  }

  /**
   * Queue and play back a base64-encoded PCM 24kHz chunk.
   */
  async playChunk(base64Pcm: string) {
    if (!this.outputAudioCtx) {
      this.initPlayback();
    }
    const ctx = this.outputAudioCtx!;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    try {
      // Convert base64 back to Float32Array
      const floatData = this.base64ToFloat32(base64Pcm);
      
      // Create audio buffer (1 channel, sampleRate 24000)
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Trigger output volume visualizer
      this.simulateOutputVolume(floatData);

      // Gapless scheduling
      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        // If we are behind or just starting, add a tiny buffer (30ms) to avoid stutter
        this.nextStartTime = currentTime + 0.03;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      
      // Cleanup source references when they finish playing
      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
      };
    } catch (err) {
      console.error("Error decoding or playing audio chunk:", err);
    }
  }

  /**
   * Stop all active playback immediately (e.g. on user interruption).
   */
  stopPlayback() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped or not started
      }
    });
    this.activeSources = [];
    this.nextStartTime = 0;
    if (this.onOutputVolumeCallback) {
      this.onOutputVolumeCallback(0);
    }
  }

  /**
   * Enable lock screen / background talking mode so Zoya stays active when screen turns off.
   */
  async enableLockScreenMode(enabled: boolean, languageLabel?: string) {
    if (enabled) {
      try {
        // 1. Setup MediaSession for lock screen controls
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: "Zoya AI Assistant",
            artist: `Live Voice Call • ${languageLabel || "Odia & English"}`,
            album: "Zoya Lock Screen Active",
          });

          navigator.mediaSession.setActionHandler("play", () => {
            if (this.outputAudioCtx?.state === "suspended") this.outputAudioCtx.resume();
            if (this.inputAudioCtx?.state === "suspended") this.inputAudioCtx.resume();
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            // Keep active
          });
        }

        // 2. Play continuous silent HTML5 audio loop to prevent iOS/Android browser from sleeping
        if (!this.silentAudioElement) {
          // 1-second silent WAV base64
          const silentWav =
            "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
          this.silentAudioElement = new Audio(silentWav);
          this.silentAudioElement.loop = true;
          this.silentAudioElement.volume = 0.01;
        }
        await this.silentAudioElement.play().catch(() => {});

        // 3. Request WakeLock if available
        if ("wakeLock" in navigator && !this.wakeLock) {
          try {
            this.wakeLock = await (navigator as any).wakeLock.request("screen");
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Lock screen mode setup non-critical notice:", err);
      }
    } else {
      if (this.silentAudioElement) {
        this.silentAudioElement.pause();
        this.silentAudioElement = null;
      }
      if (this.wakeLock) {
        try {
          this.wakeLock.release();
        } catch (e) {}
        this.wakeLock = null;
      }
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
    }
  }

  /**
   * Close both recording and playback contexts and clean up resources.
   */
  close() {
    this.enableLockScreenMode(false);
    this.stopRecording();
    this.stopPlayback();
    if (this.volumeCheckInterval) {
      window.clearInterval(this.volumeCheckInterval);
      this.volumeCheckInterval = null;
    }
    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch (e) {}
      this.outputAudioCtx = null;
    }
  }

  // --- Helpers for PCM conversion ---

  private int16ToBase64(i16Array: Int16Array): string {
    const bytes = new Uint8Array(i16Array.buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const i16Array = new Int16Array(bytes.buffer);
    const f32Array = new Float32Array(i16Array.length);
    for (let i = 0; i < i16Array.length; i++) {
      f32Array[i] = i16Array[i] / 32768.0;
    }
    return f32Array;
  }

  /**
   * Analyzes playing float data to notify UI about speaker volume
   */
  private simulateOutputVolume(floatData: Float32Array) {
    if (!this.onOutputVolumeCallback) return;
    
    // Compute RMS value
    let sum = 0;
    for (let i = 0; i < floatData.length; i += 10) { // sample subset for speed
      sum += floatData[i] * floatData[i];
    }
    const rms = Math.sqrt(sum / (floatData.length / 10));
    const normalizedVol = Math.min(1, rms * 5); // amplify for visual aesthetics
    
    this.onOutputVolumeCallback(normalizedVol);
  }
}
