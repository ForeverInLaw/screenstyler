import type { Metadata } from 'next';
import { DM_Sans, Space_Grotesk, Geist_Mono } from 'next/font/google';
import './globals.css';
import './studio.css';
import { Providers } from './providers';

const studioSans = DM_Sans({
  variable: '--font-studio-sans',
  subsets: ['latin'],
});

const studioDisplay = Space_Grotesk({
  variable: '--font-studio-display',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Screenstyler',
  description: 'Turn plain screenshots into share-ready images.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${studioSans.variable} ${studioDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
