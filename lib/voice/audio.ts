// Browser audio for the Deepgram Voice Agent: mic -> linear16 PCM out, and
// linear16 PCM in -> speakers, with barge-in support.
//
// Deepgram sends raw headerless linear16 at 24 kHz. We schedule each chunk back-to-back on a
// Web Audio timeline so playback is gapless, and keep handles to every scheduled source so
// `interrupt()` can cut Thaakat off mid-sentence the moment the user starts talking.

const CAPTURE_WORKLET = `
class ThaakatCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    // ~21ms of audio at 48k. Batching avoids one websocket frame per 128-sample render quantum.
    this.buf = new Int16Array(1024);
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.n === this.buf.length) {
        const out = this.buf.slice();
        this.port.postMessage(out.buffer, [out.buffer]);
        this.n = 0;
      }
    }
    return true;
  }
}
registerProcessor('thaakat-capture', ThaakatCapture);
`;

export class MicCapture {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private src: MediaStreamAudioSourceNode | null = null;

  /** Actual capture rate — must be what we declare in Settings.audio.input.sample_rate. */
  sampleRate = 48000;

  async start(onPcm: (pcm: ArrayBuffer) => void): Promise<number> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      // A raw DOMException here reads as "the voice agent is broken" when it's really a
      // permission prompt that got dismissed, or a page served over plain http.
      const name = (e as Error).name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new Error('Microphone access was blocked. Allow the mic for this site and try again.');
      }
      if (name === 'NotFoundError') throw new Error('No microphone found.');
      throw e;
    }

    // Ask for 24k, but some browsers throw NotSupportedError instead of just ignoring the hint,
    // so fall back to the device default. Either way we read back the rate we ACTUALLY got and
    // declare that in Settings — guessing here is what produces chipmunk audio.
    try {
      this.ctx = new AudioContext({ sampleRate: 24000 });
    } catch {
      this.ctx = new AudioContext();
    }
    this.sampleRate = this.ctx.sampleRate;

    const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
    try {
      await this.ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    this.src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, 'thaakat-capture');
    this.node.port.onmessage = (e) => onPcm(e.data as ArrayBuffer);
    this.src.connect(this.node);
    // The worklet only gets pulled if it reaches the destination — but route it through a
    // zero gain node so the user never hears their own mic.
    const mute = this.ctx.createGain();
    mute.gain.value = 0;
    this.node.connect(mute);
    mute.connect(this.ctx.destination);

    return this.sampleRate;
  }

  stop(): void {
    this.node?.port.close();
    this.node?.disconnect();
    this.src?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.ctx = null;
    this.stream = null;
    this.node = null;
    this.src = null;
  }
}

export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private sources = new Set<AudioBufferSourceNode>();

  constructor(private readonly sampleRate: number) {}

  private ensure(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.nextStart = 0;
    }
    void this.ctx.resume();
    return this.ctx;
  }

  /** Queue one raw linear16 chunk from Deepgram. */
  push(pcm: ArrayBuffer): void {
    if (pcm.byteLength < 2) return;
    const ctx = this.ensure();

    const i16 = new Int16Array(pcm);
    const buf = ctx.createBuffer(1, i16.length, this.sampleRate);
    const f32 = buf.getChannelData(0);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    // Small lead so the first chunk doesn't start in the past and get clipped.
    const now = ctx.currentTime;
    if (this.nextStart < now) this.nextStart = now + 0.06;
    src.start(this.nextStart);
    this.nextStart += buf.duration;

    this.sources.add(src);
    src.onended = () => this.sources.delete(src);
  }

  /** Barge-in: kill everything queued so the agent stops talking immediately. */
  interrupt(): void {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already ended */
      }
    }
    this.sources.clear();
    this.nextStart = this.ctx ? this.ctx.currentTime : 0;
  }

  close(): void {
    this.interrupt();
    void this.ctx?.close();
    this.ctx = null;
  }
}
