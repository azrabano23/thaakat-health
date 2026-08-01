// Tiny .env loader for the seed scripts (avoids a dotenv dependency).
//
// Mirrors Next's precedence — `.env.local` wins over `.env` — with one deliberate difference:
// an EMPTY value is not treated as a value. An unfilled copy of .env.example sitting in
// .env.local will otherwise shadow every real key in .env with an empty string, and every
// sponsor integration silently degrades to its offline fallback while looking fine.

import { readFileSync } from 'node:fs';

export function loadEnv(files = ['.env', '.env.local']): void {
  for (const file of files) {
    let contents: string;
    try {
      contents = readFileSync(file, 'utf8');
    } catch {
      continue; // file absent — fine
    }
    for (const line of contents.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, '').trim();
      if (value) process.env[m[1]] = value;
    }
  }
}
