import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <div style={{ padding: '48px 0 24px' }}>
        <span className="pill">YC × Medplum Hackathon · Aug 1</span>
        <h1 style={{ fontSize: 44, margin: '18px 0 8px', lineHeight: 1.1 }}>
          Noor
        </h1>
        <p style={{ fontSize: 22, color: 'var(--muted)', maxWidth: 720, margin: 0 }}>
          A voice-first diagnostic navigator for women&apos;s health. Noor listens to your
          story, <strong style={{ color: 'var(--text)' }}>reads your scan</strong>, and clears
          the path to care — turning the <strong style={{ color: 'var(--text)' }}>7–10 year
          endometriosis odyssey into one conversation.</strong>
        </p>

        <div style={{ marginTop: 28 }}>
          <Link href="/intake" className="btn">Start a visit with Noor →</Link>
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
          Decision-support / navigation, not diagnosis. Synthetic demo data only.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>🎙️ Listens</h3>
          <p className="muted">An adaptive spoken interview that captures the symptom narrative forms and rushed visits lose. <span className="pill">Deepgram</span> <span className="pill">Moss</span></p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>🩻 Reads the scan</h3>
          <p className="muted">A radiomics layer flags the endometriosis signs standard reads miss, and explains them. <span className="pill">Imaging — our moat</span></p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>✅ Clears the path</h3>
          <p className="muted">Writes a physician-ready FHIR chart and checks coverage live. <span className="pill">Medplum</span> <span className="pill">Stedi</span></p>
        </div>
      </div>
    </main>
  );
}
