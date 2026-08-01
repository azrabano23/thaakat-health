'use client';

// Live-voice control for /intake. Self-contained on purpose: the scripted "Play demo" path in
// page.tsx stays exactly as it was (it's the on-stage fallback if conference wifi eats the
// websocket), and this component drives the SAME cards through the same callbacks.

import { useEffect, useRef, useState } from 'react';
import { ThaakatVoiceClient, type VoiceStatus, type VoiceEvents } from '@/lib/voice/client';
import type { Finding } from '@/lib/clusters';

const STATUS_COPY: Record<VoiceStatus, string> = {
  idle: 'Not connected',
  connecting: 'Connecting…',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Thaakat is speaking',
  error: 'Connection problem',
};

const STATUS_COLOR: Record<VoiceStatus, string> = {
  idle: 'var(--muted)',
  connecting: 'var(--warn)',
  listening: 'var(--accent)',
  thinking: 'var(--warn)',
  speaking: 'var(--accent-2)',
  error: 'var(--bad, #ef4444)',
};

export default function LiveVoice({
  handlers,
  onSeed,
  patientId = 'maria',
  disabled,
}: {
  handlers: VoiceEvents;
  onSeed: (record: Finding[]) => void;
  /** Which seeded demo patient the live call is about — follows the patient switcher. */
  patientId?: string;
  disabled?: boolean;
}) {
  const clientRef = useRef<ThaakatVoiceClient | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastTool, setLastTool] = useState<string | null>(null);

  const live = status !== 'idle' && status !== 'error';

  useEffect(() => () => clientRef.current?.stop(), []);

  async function connect() {
    setError(null);
    // Route every callback through a ref so the client keeps working across re-renders.
    const h = handlersRef.current;
    const client = new ThaakatVoiceClient(
      {
        onStatus: setStatus,
        onError: (m) => setError(m),
        onToolCall: (n) => setLastTool(n),
        onTurn: (r, t) => h.onTurn?.(r, t),
        onFinding: (f) => h.onFinding?.(f),
        onCluster: (c) => h.onCluster?.(c),
        onImaging: (i) => h.onImaging?.(i),
        onCoverage: (c) => h.onCoverage?.(c),
        onCommit: (c) => h.onCommit?.(c),
        onRetrieval: (ms, b) => h.onRetrieval?.(ms, b),
        onPhase: (p) => h.onPhase?.(p),
      },
      patientId,
    );
    clientRef.current = client;

    // Put her historical chart on the timeline before the first word, so Thaakat's opening
    // question can already reference it.
    onSeed(client.tools.seedRecord());

    try {
      await client.start();
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  }

  function disconnect() {
    clientRef.current?.stop();
    clientRef.current = null;
    setStatus('idle');
    setLastTool(null);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {live && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: STATUS_COLOR[status],
              animation: status === 'listening' ? 'thaakatPulse 1.4s ease-in-out infinite' : undefined,
            }}
          />
          <span className="muted">{STATUS_COPY[status]}</span>
          {lastTool && <span className="pill">{lastTool}</span>}
        </span>
      )}

      {error && (
        <span className="muted" style={{ fontSize: 12, color: STATUS_COLOR.error, maxWidth: 260 }}>
          {error}
        </span>
      )}

      <button className="btn" onClick={live ? disconnect : connect} disabled={disabled && !live}>
        {live ? '■ End call' : '🎙️ Talk to Thaakat'}
      </button>

      <style>{`@keyframes thaakatPulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }`}</style>
    </div>
  );
}
