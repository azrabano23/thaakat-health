import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noor — diagnostic navigator for women\'s health',
  description:
    'Voice-first, multimodal diagnostic navigator. Turns the 7–10 year endometriosis odyssey into one conversation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
