// Mic capture worklet: Float32 → 16-bit PCM, posted in ~80ms chunks (1280 samples @ 16kHz),
// the cadence Deepgram's streaming STT / Voice Agent expects. Registered at /pcm-worklet.js.
class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._target = 1280;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) this._buf.push(ch[i]);
      while (this._buf.length >= this._target) {
        const chunk = this._buf.splice(0, this._target);
        const pcm = new Int16Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          const s = Math.max(-1, Math.min(1, chunk[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('pcm-worklet', PCMWorklet);
