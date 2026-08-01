// Live Deepgram Voice Agent client for Thaakat (browser).
//
// Auth: the browser NEVER sees DEEPGRAM_API_KEY. /api/deepgram/token mints a short-lived
// access token, and we pass it as a websocket subprotocol — the two schemes are NOT
// interchangeable:
//   API key      -> ['token',  <key>]
//   access token -> ['bearer', <jwt>]
// (Sec-WebSocket-Protocol is the only custom header browsers allow on a WS handshake.)

import { AGENT_WS_URL, OUTPUT_SAMPLE_RATE, buildSettings } from './agent-settings';
import { AudioPlayer, MicCapture } from './audio';
import { ThaakatToolRunner, type ToolEvents } from './tools';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export type VoiceEvents = ToolEvents & {
  onStatus?: (s: VoiceStatus) => void;
  onTurn?: (role: 'patient' | 'thaakat', text: string) => void;
  onToolCall?: (name: string) => void;
  onError?: (message: string) => void;
};

type DeepgramEvent = {
  type: string;
  role?: string;
  content?: string;
  description?: string;
  message?: string;
  functions?: { id: string; name: string; arguments: string; client_side?: boolean }[];
};

export class ThaakatVoiceClient {
  private ws: WebSocket | null = null;
  private mic = new MicCapture();
  private player = new AudioPlayer(OUTPUT_SAMPLE_RATE);
  private runner: ThaakatToolRunner;
  private keepAlive: ReturnType<typeof setInterval> | null = null;
  private ready = false;
  private stopped = false;

  constructor(
    private readonly events: VoiceEvents = {},
    patientId = 'maria',
  ) {
    this.runner = new ThaakatToolRunner(events, patientId);
  }

  get tools(): ThaakatToolRunner {
    return this.runner;
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.events.onStatus?.('connecting');

    const tokenRes = await fetch('/api/deepgram/token', { method: 'POST' });
    const tokenBody = (await tokenRes.json().catch(() => ({}))) as {
      access_token?: string;
      scheme?: 'bearer' | 'token';
      fallback?: boolean;
      hint?: string;
      error?: string;
    };
    if (!tokenRes.ok || !tokenBody.access_token) {
      throw new Error(tokenBody.error ?? `Could not mint a Deepgram token (${tokenRes.status}).`);
    }
    // A short-lived JWT authenticates as 'bearer'; a raw API key as 'token'. Using the wrong
    // subprotocol fails the handshake, so follow whatever the route says it handed us.
    const scheme = tokenBody.scheme ?? 'bearer';
    if (tokenBody.fallback && tokenBody.hint) console.warn('[thaakat:voice]', tokenBody.hint);

    // Start the mic FIRST — Settings must declare the real capture rate.
    const sampleRate = await this.mic.start((pcm) => {
      if (this.ready && this.ws?.readyState === WebSocket.OPEN) this.ws.send(pcm);
    });

    // From here on the mic is live. Anything that throws before we hand control back must release
    // it, or the browser keeps showing a recording indicator for a call that never connected.
    let ws: WebSocket;
    try {
      ws = new WebSocket(AGENT_WS_URL, [scheme, tokenBody.access_token]);
    } catch (e) {
      this.mic.stop();
      throw e;
    }
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify(buildSettings(sampleRate)));
      this.keepAlive = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'KeepAlive' }));
      }, 8000);
    };

    ws.onmessage = (ev) => {
      if (ev.data instanceof ArrayBuffer) {
        this.player.push(ev.data);
        return;
      }
      try {
        this.handleEvent(JSON.parse(ev.data as string) as DeepgramEvent);
      } catch {
        /* non-JSON frame — ignore */
      }
    };

    ws.onerror = () => {
      if (!this.stopped) {
        this.events.onStatus?.('error');
        this.events.onError?.('Voice connection error.');
      }
    };

    // The handshake can also fail asynchronously, long after start() resolved — conference wifi
    // dropping mid-call is the expected case. The caller's try/catch cannot see that, so release
    // the mic here rather than leaving it open behind a dead socket.
    ws.onclose = () => {
      if (this.keepAlive) clearInterval(this.keepAlive);
      this.keepAlive = null;
      this.ready = false;
      this.mic.stop();
      this.player.close();
      if (!this.stopped) this.events.onStatus?.('idle');
    };
  }

  private handleEvent(msg: DeepgramEvent): void {
    switch (msg.type) {
      case 'Welcome':
        break;

      case 'SettingsApplied':
        this.ready = true; // only now start streaming mic audio
        this.events.onStatus?.('listening');
        break;

      case 'UserStartedSpeaking':
        this.player.interrupt(); // barge-in
        this.events.onStatus?.('listening');
        break;

      case 'ConversationText':
        if (msg.content) {
          this.events.onTurn?.(msg.role === 'user' ? 'patient' : 'thaakat', msg.content);
        }
        break;

      case 'AgentThinking':
        this.events.onStatus?.('thinking');
        break;

      case 'AgentStartedSpeaking':
        this.events.onStatus?.('speaking');
        break;

      case 'AgentAudioDone':
        this.events.onStatus?.('listening');
        break;

      case 'FunctionCallRequest':
        void this.handleFunctionCalls(msg);
        break;

      case 'Error':
        this.events.onStatus?.('error');
        this.events.onError?.(msg.description ?? msg.message ?? 'Deepgram error');
        break;

      case 'Warning':
        console.warn('[thaakat:voice] warning:', msg.description ?? msg.message);
        break;

      default:
        break;
    }
  }

  private async handleFunctionCalls(msg: DeepgramEvent): Promise<void> {
    for (const fn of msg.functions ?? []) {
      if (fn.client_side === false) continue; // server-side ones Deepgram handles itself

      this.events.onToolCall?.(fn.name);
      let args: Record<string, unknown> = {};
      try {
        args = fn.arguments ? JSON.parse(fn.arguments) : {};
      } catch {
        /* malformed args — run with none and let the tool complain */
      }

      const content = await this.runner.run(fn.name, args);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'FunctionCallResponse', id: fn.id, name: fn.name, content }));
      }
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.keepAlive) clearInterval(this.keepAlive);
    this.keepAlive = null;
    this.ready = false;
    this.mic.stop();
    this.player.close();
    this.ws?.close();
    this.ws = null;
    this.events.onStatus?.('idle');
  }
}
