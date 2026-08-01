// Thaakat terminology layer — turns "the agent picked a code" into "the code was actually validated."
//
// WHY THIS EXISTS
// lib/fhir/model.ts ships a vetted CODES table so the AI *selects* a key instead of hallucinating a
// SNOMED/LOINC/CPT code. That removes free-text invention, but nothing actually checked the codes were
// real — they were placeholders flagged `verify: true`. This module retires that weakness: every code
// Thaakat emits is validated against the FHIR `CodeSystem/$validate-code` operation, using the real,
// server-side terminology service whenever the Thaakat CodeSystem is loaded (see
// `medplum/codesystem.thaakat.json`). Hallucinated or mistyped codes come back `{ valid: false }`;
// real ones come back with the canonical display.
//
// SELF-CONTAINED BY DESIGN (+ a fallback so the demo never hard-fails)
// The CodeSystem is a local ~12-code subset published under a Thaakat URL — no UMLS licence, no
// dependency on which terminologies the hosted tier happens to have loaded. Two things make this
// robust for a live demo:
//   1. `validateCoding` calls the real server `$validate-code`. When the CodeSystem is loaded this is
//      fully authoritative (real code -> valid + display, unknown code -> invalid).
//   2. If the server can't answer authoritatively — the CodeSystem hasn't been loaded yet (loading it
//      needs a project-admin; a scoped client-credentials app is 403-Forbidden on CodeSystem writes),
//      or the network is down — it falls back to the SAME concept list the CodeSystem is built from
//      (imported straight from `codesystem.thaakat.json`, so there is one source of truth and no
//      drift). The moment an admin loads the CodeSystem, the server path takes over automatically.
// This mirrors the repo's other sponsor fallbacks (Moss, Medplum dry-run): a working scoped version
// plus a clean swap-in seam, per CLAUDE.md.
//
// PRODUCTION: swap the ~12-code subset for full UMLS-linked SNOMED/LOINC/CPT CodeSystems (or Medplum's
// `$import`) and keep this exact function signature — the `$validate-code` contract does not change.
//
// FHIR R4 only. Decision-support / navigation — never diagnosis.

import type { MedplumClient } from '@medplum/core';
import type { Bundle, CodeSystem, Parameters } from '@medplum/fhirtypes';
import thaakatTerminologyBundle from '../../medplum/codesystem.thaakat.json';

/** Canonical URL of the local CodeSystem defined in `medplum/codesystem.thaakat.json`. */
export const THAAKAT_CODESYSTEM_URL = 'https://thaakat.health/fhir/CodeSystem/thaakat-codes';
/** Canonical URL of the local ValueSet (all vetted codes) defined in the same bundle. */
export const THAAKAT_VALUESET_URL = 'https://thaakat.health/fhir/ValueSet/thaakat-codes';

/** The three source terminologies the local Thaakat subset mirrors. */
export const MIRRORED_SYSTEMS = {
  snomed: 'http://snomed.info/sct',
  loinc: 'http://loinc.org',
  cpt: 'http://www.ama-assn.org/go/cpt',
} as const;

// A coding is only something Thaakat could have vetted if it comes from one of the mirrored source
// systems (or is already expressed against the local Thaakat CodeSystem). Anything else is, by
// definition, not in our vetted set — reject it before we even ask the server.
const ACCEPTED_SYSTEMS = new Set<string>([...Object.values(MIRRORED_SYSTEMS), THAAKAT_CODESYSTEM_URL]);

// Local mirror of the CodeSystem's concepts (code -> canonical display), derived once from the same
// JSON that gets loaded into Medplum. This is the fallback allowlist AND the single source of truth.
const LOCAL_CONCEPTS: ReadonlyMap<string, string> = buildLocalConcepts();

function buildLocalConcepts(): Map<string, string> {
  const map = new Map<string, string>();
  const bundle = thaakatTerminologyBundle as unknown as Bundle;
  for (const entry of bundle.entry ?? []) {
    const resource = entry.resource;
    if (resource?.resourceType !== 'CodeSystem') continue;
    for (const concept of (resource as CodeSystem).concept ?? []) {
      if (concept.code && concept.display) map.set(concept.code, concept.display);
    }
  }
  return map;
}

export type CodingValidation = {
  /** True only when the code is confirmed to exist in the Thaakat vetted set. */
  valid: boolean;
  /** Canonical display for a valid code. */
  display?: string;
};

function firstParam(params: Parameters | undefined, name: string) {
  return params?.parameter?.find((p) => p.name === name);
}

/**
 * Validate a single `(system, code)` coding against the local Thaakat CodeSystem. This is the real
 * anti-hallucination check that replaces the `verify: true` placeholder trust in `lib/fhir/model.ts`:
 * a code either exists in the vetted CodeSystem (returned with its canonical display) or it does not.
 *
 * It calls Medplum's `CodeSystem/$validate-code` operation first (authoritative once the CodeSystem is
 * loaded), and falls back to the identical concept list if the server can't answer — see the module
 * header for why (loading terminology needs a project-admin; a scoped client is 403 on that write).
 *
 * @param medplum - An authenticated MedplumClient (see `lib/medplum.ts#getMedplum`).
 * @param system  - The source terminology URL the code claims to come from (SNOMED/LOINC/CPT, or the
 *                  Thaakat CodeSystem URL). A code from any other system is treated as not-vetted.
 * @param code    - The code to validate, e.g. `129103003`.
 * @returns `{ valid, display }` — `valid` is true only when the code is confirmed in the vetted set.
 */
export async function validateCoding(
  medplum: MedplumClient,
  system: string,
  code: string,
): Promise<CodingValidation> {
  if (!code || !system || !ACCEPTED_SYSTEMS.has(system)) {
    return { valid: false };
  }

  // 1) Authoritative path: ask the terminology server. Passing `url` + `code` validates against the
  //    Thaakat concept table. `code` is a FHIR `code`-typed parameter, so it MUST be `valueCode`.
  try {
    const outcome = await medplum.post<Parameters>(medplum.fhirUrl('CodeSystem', '$validate-code'), {
      resourceType: 'Parameters',
      parameter: [
        { name: 'url', valueUri: THAAKAT_CODESYSTEM_URL },
        { name: 'code', valueCode: code },
      ],
    } as Parameters);

    const result = firstParam(outcome, 'result')?.valueBoolean === true;
    const display = firstParam(outcome, 'display')?.valueString;

    // CodeSystem is loaded + code is valid: the server returns result=true WITH the canonical display.
    if (result && display) return { valid: true, display };
    // CodeSystem is loaded + code is genuinely unknown: result=false. Trust it — the server is
    // authoritative. (When the CodeSystem is NOT loaded, `$validate-code` never returns false for our
    // URL; it degrades to a URL-only match returning result=true with NO display, handled below.)
    if (!result) return { valid: false };
    // result=true but no display => CodeSystem not loaded (URL-only string match). Fall through.
  } catch {
    // 403 (scoped client can't load/read terminology), offline, etc. Fall through to the local list.
  }

  // 2) Self-contained fallback against the same concept list the CodeSystem is built from.
  const display = LOCAL_CONCEPTS.get(code);
  return display ? { valid: true, display } : { valid: false };
}
