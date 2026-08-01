// Live Deepgram Voice Agent loop: mic → wss://agent.deepgram.com → Claude (think) → Aura (speak),
// with function-calling into our /api routes and barge-in. Needs DEEPGRAM_API_KEY (managed Claude).
import { useCallback, useRef, useState } from 'react';

export type FunctionDef = { name: string; description: string; parameters: object };
export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export type VoiceAgentOptions = {
  systemPrompt: string;
  greeting?: string;
  functions: FunctionDef[];
  onTranscript: (role: 'patient' | 'thaakat', text: string) => void;
  onFunctionCall: (name: string, args: any) => Promise<any>;
  onStatus?: (s: VoiceStatus) => void;
};

const AGENT_URL = 'wss://agent.deepgram.com/v1/agent/converse';
const OUT_RATE = 24000;

class AgentPlayer {
  private next = 0;
  private sources: AudioBufferSourceNode[] = [];
  constructor(private ctx: AudioContext) {}
  enqueue(pcm: ArrayBuffer) {
    const i16 = new Int16Array(pcm);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    const buf = this.ctx.createBuffer(1, f32.length, OUT_RATE);
    buf.copyToChannel(f32, 0);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    const t = Math.max(this.ctx.currentTime, this.next);
    src.start(t);
    this.next = t + buf.duration;
    this.sources.push(src);
    src.onended = () => (this.sources = this.sources.filter((s) => s !== src));
  }
  interrupt() {
    for (const s of this.sources) try { s.stop(); } catch {}
    this.sources = [];
    this.next = 0;
  }
}

export function useVoiceAgent(opts: VoiceAgentOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const ws = useRef<WebSocket | null>(null);
  const micCtx = useRef<AudioContext | null>(null);
  const outCtx = useRef<AudioContext | null>(null);
  const player = useRef<AgentPlayer | null>(null);
  const node = useRef<AudioWorkletNode | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const keepAlive = useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (s: VoiceStatus) => { setStatus(s); optsRef.current.onStatus?.(s); };

  const stop = useCallback(() => {
    if (keepAlive.current) clearInterval(keepAlive.current);
    try { ws.current?.close(); } catch {}
    node.current?.disconnect();
    stream.current?.getTracks().forEach((t) => t.stop());
    micCtx.current?.close().catch(() => {});
    outCtx.current?.close().catch(() => {});
    ws.current = null;
    set('idle');
  }, []);

  const start = useCallback(async () => {
    try {
      set('connecting');
      const { access_token } = await fetch('/api/deepgram/token', { method: 'POST' }).then((r) => r.json());
      if (!access_token) throw new Error('No Deepgram token — set DEEPGRAM_API_KEY.');

      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const mCtx = new AudioContext({ sampleRate: 16000 });
      micCtx.current = mCtx;
      await mCtx.audioWorklet.addModule('/pcm-worklet.js');
      const srcNode = mCtx.createMediaStreamSource(stream.current);
      const worklet = new AudioWorkletNode(mCtx, 'pcm-worklet');
      node.current = worklet;
      srcNode.connect(worklet);

      const oCtx = new AudioContext({ sampleRate: OUT_RATE });
      outCtx.current = oCtx;
      player.current = new AgentPlayer(oCtx);

      const socket = new WebSocket(AGENT_URL, ['token', access_token]);
      socket.binaryType = 'arraybuffer';
      ws.current = socket;

      worklet.port.onmessage = (e) => socket.readyState === WebSocket.OPEN && socket.send(e.data);

      socket.onopen = () => {
        const o = optsRef.current;
        socket.send(JSON.stringify({
          type: 'Settings',
          audio: {
            input: { encoding: 'linear16', sample_rate: 16000 },
            output: { encoding: 'linear16', sample_rate: OUT_RATE, container: 'none' },
          },
          agent: {
            language: 'en',
            listen: { provider: { type: 'deepgram', model: 'nova-3-medical', keyterms: ['endometriosis', 'endometrioma', 'dysmenorrhea', 'dyspareunia', 'adenomyosis', 'laparoscopy', 'CA-125', 'uterosacral'] } },
            think: { provider: { type: 'anthropic', model: 'claude-haiku-4-5', temperature: 0.3 }, prompt: o.systemPrompt, functions: o.functions },
            speak: { provider: { type: 'deepgram', model: 'aura-2-thalia-en' } },
            greeting: o.greeting,
          },
        }));
        keepAlive.current = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ type: 'KeepAlive' })), 6000);
        set('listening');
      };

      socket.onmessage = async (ev) => {
        if (typeof ev.data !== 'string') { set('speaking'); player.current?.enqueue(ev.data); return; }
        let msg: any;
        try { msg = JSON.parse(ev.data); } catch { return; }
        switch (msg.type) {
          case 'ConversationText': optsRef.current.onTranscript(msg.role === 'user' ? 'patient' : 'thaakat', msg.content); break;
          case 'UserStartedSpeaking': player.current?.interrupt(); set('listening'); break;
          case 'AgentThinking': set('thinking'); break;
          case 'AgentAudioDone': set('listening'); break;
          case 'FunctionCallRequest':
            for (const fn of msg.functions ?? []) {
              let result: any;
              try { result = await optsRef.current.onFunctionCall(fn.name, JSON.parse(fn.arguments || '{}')); }
              catch (e) { result = { error: String(e) }; }
              socket.send(JSON.stringify({ type: 'FunctionCallResponse', id: fn.id, name: fn.name, content: JSON.stringify(result ?? {}) }));
            }
            break;
          case 'Error': set('error'); console.error('[deepgram]', msg); break;
        }
      };
      socket.onerror = () => set('error');
      socket.onclose = () => keepAlive.current && clearInterval(keepAlive.current);
    } catch (e) {
      console.error('[useVoiceAgent]', e);
      set('error');
    }
  }, []);

  return { status, start, stop };
}
