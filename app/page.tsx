import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 64, textAlign: 'center' }}>
      <h1>Screenstyler</h1>
      <p>Turn plain screenshots into share-ready images.</p>
      <Link href="/projects">Open your projects</Link>
    </main>
  );
}
