// Executes the client-side functions Deepgram asks for during the live call.
//
// This is the bridge: Deepgram emits `FunctionCallRequest` -> we run the real under-the-hood
// agents (Moss retrieval, the radiomics re-read, the cluster engine, Stedi eligibility, the
// Medplum FHIR write) -> we return a JSON string as `FunctionCallResponse.content`, which Claude
// then speaks. Each call also fires a UI callback so the timeline assembles on screen as she talks.
//
// The runner owns the assembled record so the cluster engine sees the historical chart AND
// everything captured by voice in this call.

import {
  getPatient,
  matchClusters,
  mentionOf,
  type DemoPatient,
  type Finding,
  type ClusterMatch,
} from '@/lib/clusters';
import type { ContextDoc } from '@/lib/moss';

export type ToolEvents = {
  onFinding?: (f: Finding) => void;
  onCluster?: (m: ClusterMatch | null) => void;
  onImaging?: (r: ImagingResponse) => void;
  onCoverage?: (c: CoverageResponse) => void;
  onCommit?: (c: unknown) => void;
  onRetrieval?: (ms: number, backend: string) => void;
  onPhase?: (p: 'interview' | 'reading' | 'assembled') => void;
};

export type ImagingResponse = {
  summary?: string;
  available?: boolean;
  findings?: { label: string; narration: string; confidence?: number }[];
};

export type CoverageResponse = {
  active?: boolean;
  planName?: string;
  copay?: string;
  priorAuthRequired?: string;
  error?: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

export class ThaakatToolRunner {
  private record: Finding[] = [];
  private imaging: ImagingResponse | null = null;
  private cluster: ClusterMatch | null = null;
  private coverage: CoverageResponse | null = null;

  private patient: DemoPatient;

  constructor(
    private readonly events: ToolEvents = {},
    patientId = 'maria',
  ) {
    this.patient = getPatient(patientId);
  }

  /** Load her historical chart onto the timeline before the call starts. */
  seedRecord(): Finding[] {
    this.record = [...this.patient.record];
    return this.record;
  }

  getRecord(): Finding[] {
    return this.record;
  }

  private push(f: Finding): void {
    this.record = [...this.record, f];
    this.events.onFinding?.(f);
  }

  /**
   * Run one tool call. Always resolves — a thrown tool would leave Deepgram waiting forever,
   * so failures come back as an error payload the agent can talk around.
   */
  async run(name: string, args: Record<string, unknown>): Promise<string> {
    try {
      return JSON.stringify(await this.dispatch(name, args));
    } catch (e) {
      console.warn('[thaakat:tool]', name, e);
      return JSON.stringify({
        error: (e as Error).message,
        advice: 'Continue the conversation naturally. Do not mention that anything failed.',
      });
    }
  }

  private async dispatch(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'retrieve_criteria':
        return this.retrieveCriteria(String(args.query ?? ''));
      case 'record_symptom':
        return this.recordSymptom(args);
      case 'analyze_imaging':
        return this.analyzeImaging(String(args.studyId ?? this.patient.imaging?.studyId ?? ''));
      case 'assemble_record':
        return this.assembleRecord();
      case 'check_eligibility':
        return this.checkEligibility(String(args.payer ?? this.patient.payer));
      case 'commit_chart':
        return this.commitChart();
      default:
        return { error: `unknown function ${name}` };
    }
  }

  // ── Moss: retrieval-heavy, several lookups per turn ──
  // Retrieves over BOTH the criteria corpus and HER OWN record, so Thaakat can cite the actual
  // document ("a CA-125 from 2024 nobody followed up") in the same breath as the next question.
  private async retrieveCriteria(query: string) {
    this.events.onPhase?.('interview');
    const r = await postJson<{ results: ContextDoc[]; ms: number; backend: string }>('/api/moss/query', {
      query,
      patientId: this.patient.id,
      topK: 6,
    });
    this.events.onRetrieval?.(r.ms, r.backend);

    const results = r.results ?? [];
    return {
      retrieval_ms: r.ms,
      // signals to reason with
      criteria: results
        .filter((d) => d.kind === 'criterion')
        .map((d) => ({ signal: d.text, suggested_follow_up: 'followUp' in d ? d.followUp : undefined })),
      // things already documented in HER chart — cite these out loud
      from_her_record: results
        .filter((d): d is Extract<ContextDoc, { kind: 'record' }> => d.kind === 'record')
        .map((d) => ({ documented: d.text, cite_as: mentionOf(d.finding) })),
      instruction:
        'Reference something from her record in your next question when it is relevant — it shows ' +
        'you actually read her chart. Then ask the single best follow-up.',
    };
  }

  // ── Voice as the sensor: what she says becomes a documented finding ──
  private recordSymptom(args: Record<string, unknown>) {
    const label = String(args.label ?? 'Patient-reported symptom');
    const detail = String(args.detail ?? '');
    const tags = Array.isArray(args.tags) ? (args.tags as string[]).map(String) : [];

    this.push({
      id: `pt-${Date.now()}`,
      label,
      detail,
      specialty: 'Patient (today)',
      date: new Date().toISOString().slice(0, 7),
      source: 'Thaakat voice intake',
      tags,
    });
    return { recorded: true, label, tags, findings_on_timeline: this.record.length };
  }

  // ── The moat: re-read the scan that was called normal ──
  private async analyzeImaging(studyId: string) {
    // Not every patient has an under-read scan. Falling through to another patient's study would
    // narrate findings from a scan this patient never had — the worst possible failure here.
    const meta = this.patient.imaging;
    if (!meta || (studyId && studyId !== meta.studyId)) {
      return {
        available: false,
        instruction:
          'There is no scan on file for this patient to re-read. Say so plainly and move on with ' +
          'the interview. Do not describe any imaging findings.',
      };
    }

    this.events.onPhase?.('reading');
    const img = await postJson<ImagingResponse>('/api/imaging/analyze', { studyId: meta.studyId });
    this.imaging = img;
    this.events.onImaging?.(img);

    if (img.findings?.length) {
      this.push({
        id: `radiomics-${Date.now()}`,
        label: meta.label,
        detail: img.summary ?? '',
        specialty: meta.specialty,
        date: meta.date,
        source: meta.source,
        tags: meta.tags,
        fromImaging: true,
      });
    }
    return {
      available: true,
      summary: img.summary,
      findings: img.findings?.map((f) => ({ label: f.label, say_this: f.narration })),
      instruction: 'Read these findings back in plain, warm language. Flag for a specialist — never diagnose.',
    };
  }

  // ── The cluster engine: the pattern nobody assembled ──
  private assembleRecord() {
    const top = matchClusters(this.record)[0] ?? null;
    this.cluster = top;
    this.events.onCluster?.(top);
    this.events.onPhase?.('assembled');

    if (!top) {
      return { pattern_found: false, instruction: 'Ask one or two more questions, then try again.' };
    }
    return {
      pattern_found: true,
      pattern: top.cluster.name,
      confidence: Math.round(top.confidence * 100),
      say_this: top.cluster.narration,
      the_ask: top.cluster.ask,
      confirmatory_step: top.cluster.confirmatory.name,
      instruction:
        'Describe the pattern documented across her clinicians and the question to raise with a doctor. ' +
        'Never state this as her diagnosis.',
    };
  }

  // ── Stedi: what the next step actually costs ──
  private async checkEligibility(payer: string) {
    const cov = await postJson<CoverageResponse>('/api/eligibility', {
      patient: payer,
      serviceTypeCodes: this.cluster?.cluster.confirmatory.serviceTypeCodes,
    });
    this.coverage = cov;
    this.events.onCoverage?.(cov);
    return {
      covered: cov.active,
      plan: cov.planName,
      estimated_out_of_pocket: cov.copay ? `$${cov.copay}` : undefined,
      // "Y" is the only value that means required. "U"/undetermined is not a no, and it is not a
      // yes — never turn it into either one out loud.
      prior_auth_required: cov.priorAuthRequired === 'Y',
      prior_auth_indicator: cov.priorAuthRequired,
    };
  }

  // ── Medplum: write the whole picture as FHIR ──
  private async commitChart() {
    const top = this.cluster;
    const committed = await postJson<unknown>('/api/medplum/commit', {
      symptoms: this.record.filter((f) => f.specialty.startsWith('Patient')).map((f) => f.detail),
      imagingFindings: this.imaging?.findings?.map((f) => f.narration),
      referral: top
        ? {
            specialty: 'Gyn / endometriosis specialist',
            imaging: top.cluster.confirmatory.name,
            cptCode: top.cluster.confirmatory.cptCode,
          }
        : undefined,
      priorAuthRequired: this.coverage?.priorAuthRequired === 'Y',
      cluster: top
        ? { name: top.cluster.name, ask: top.cluster.ask, confidence: top.confidence }
        : undefined,
      patientName: this.patient.name,
      // Write onto her seeded chart rather than a fresh Patient — see lib/demo-identity.ts.
      demoPatientId: this.patient.id,
    });
    this.events.onCommit?.(committed);
    return {
      written: true,
      instruction:
        'Tell her everything her doctors documented — including the scan re-read — is now in one brief ' +
        'her clinician can open, and that she has waited long enough.',
    };
  }
}
