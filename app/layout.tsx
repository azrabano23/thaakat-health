import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thaakat — bringing what’s hidden into the light',
  description:
    'Thaakat reads a woman’s whole medical record — including the scan that was under-read — and assembles the picture nobody’s job was to see. A voice-first diagnostic navigator for women’s health. Decision-support, not diagnosis.',
  applicationName: 'Thaakat',
  keywords: [
    'Thaakat',
    'diagnostic navigator',
    'women’s health',
    'endometriosis',
    'FHIR',
    'radiomics',
    'decision support',
  ],
  authors: [{ name: 'Thaakat' }],
  openGraph: {
    title: 'Thaakat — bringing what’s hidden into the light',
    description:
      'A voice-first diagnostic navigator that assembles a woman’s whole record — including the under-read scan — into one conversation.',
    siteName: 'Thaakat',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f2eee5',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
          Persistent on EVERY route, by design. Thaakat renders things that look exactly like a
          clinical record — FHIR resources, a radiomics read, an insurance decision — so anyone
          landing mid-flow (or seeing a screenshot out of context) has to be told immediately that
          none of it is real and none of it is for care. Do not remove this, including for demos
          and screenshots.
        */}
        <div role="note" className="demo-banner">
          <strong>DEMO — synthetic data.</strong> Not for clinical use. Decision-support, not
          diagnosis.
        </div>
        {children}
      </body>
    </html>
  );
}
