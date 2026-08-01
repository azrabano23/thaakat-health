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
      <body>{children}</body>
    </html>
  );
}
