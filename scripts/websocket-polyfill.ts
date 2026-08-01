// Import this BEFORE @medplum/core in any script run under plain Node.
//
// @medplum/core's subscriptions module reads `WebSocket` at import time. Node 20 only exposes the
// global behind --experimental-websocket, so on Node 20 `pnpm seed` died with
// "ReferenceError: WebSocket is not defined" before reaching a single line of seed code — which is
// the likeliest reason this project went un-seeded for so long. Next.js supplies its own global, so
// this only affects the CLI scripts.
//
// The stand-in is deliberately non-functional: the seed scripts write over HTTPS and never open a
// subscription. A stub that throws when used is safer than a silent no-op that would let a future
// script believe it had subscribed to something.

if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  class UnsupportedWebSocket {
    constructor() {
      throw new Error(
        'WebSocket is not available in this Node runtime. Medplum subscriptions are not supported ' +
          'in CLI scripts — run Node 22+, or start Node with --experimental-websocket.',
      );
    }
  }
  (globalThis as { WebSocket?: unknown }).WebSocket = UnsupportedWebSocket;
}

export {};
