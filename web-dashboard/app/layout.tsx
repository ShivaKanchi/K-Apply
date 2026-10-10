import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'K-Apply - Autonomous AI Job Application Suite',
  description: 'The all-in-one career platform uniting 1-click ATS browser autofill, autonomous job radar, Ollama AI pitch studio, and application pipeline tracking.',
  keywords: 'K-Apply, Job Autofill, ATS Automation, Ollama AI, Job Tracker, Career Copilot, Greenhouse, Lever, Ashby, Workday, LinkedIn',
  authors: [{ name: 'K-Apply Team' }],
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-zinc-950 text-zinc-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
