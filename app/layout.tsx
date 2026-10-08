import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Say It Right — AI Communication Coach',
  description:
    'Help people say hard things in the right way. An AI-powered communication coach providing tone analysis, alternative drafts, and reusable interpersonal communication lessons.',
  keywords: [
    'AI communication coach',
    'tone analyzer',
    'email rewriter',
    'difficult conversations',
    'workplace communication',
    'academic communication',
    'Say It Right',
  ],
  authors: [{ name: 'Say It Right Team' }],
  openGraph: {
    title: 'Say It Right — AI Communication Coach',
    description: 'Help people say hard things in the right way.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
