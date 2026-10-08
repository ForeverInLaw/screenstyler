import Link from 'next/link';
import { Suspense } from 'react';
import { IconArrowRight, IconLayersLinked, IconPhoto, IconWindow, IconDownload } from '@tabler/icons-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { AppHeader } from '@/components/common/AppHeader';
import { SampleScene } from '@/components/common/SampleScene';
import { isLocalOnly } from '@/lib/config/runtime';

const workflow = [
  {
    label: 'Bring your screenshot',
    description: 'Drop an image or paste from your clipboard.',
    Icon: IconPhoto,
  },
  {
    label: 'Set the scene',
    description: 'Choose a background, a frame, and some breathing room.',
    Icon: IconWindow,
  },
  {
    label: 'Point out the details',
    description: 'Add arrows, highlights, text, or a little privacy blur.',
    Icon: IconLayersLinked,
  },
  {
    label: 'Make it shareable',
    description: 'Export a crisp PNG at twice the resolution.',
    Icon: IconDownload,
  },
];

export default function Home() {
  const localOnly = isLocalOnly();
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <AppHeader active="home" />
      <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-12 sm:px-10 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="eyebrow mb-6 flex items-center gap-3">
            <span className="h-px w-6 bg-accent" />
            THE SCREENSHOT STUDIO
          </p>
          <h1 className="max-w-lg text-5xl font-medium leading-[1.06] tracking-[-.06em] sm:text-6xl xl:text-7xl">
            A screenshot.
            <br />A little style.
            <br />
            <span className="text-accent">Ready to share.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-secondary">
            Give your product the frame it deserves. Compose, annotate, and export without leaving your
            browser.
          </p>
          <Link href="/projects" className="button button-primary mt-8 min-h-12 px-6">
            Open projects
            <IconArrowRight size={18} />
          </Link>
          <p className="mt-4 text-xs text-tertiary">No account needed. Start with a local project.</p>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-[10px] text-secondary">
            <span>LOCAL FIRST</span>
            <span>PNG · 2× EXPORT</span>
            <span>{localOnly ? 'BROWSER STORAGE' : 'OPTIONAL CLOUD SYNC'}</span>
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">01 / THE FINISHED SHOT</span>
            <span className="eyebrow">SAMPLE COMPOSITION</span>
          </div>
          <div className="crop-corners p-3">
            <SampleScene />
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-tertiary">
            <span>MACOS FRAME · SAGE BACKDROP</span>
            <span>1600 × 1000</span>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <span className="text-xs text-secondary">Your image. Your finishing touch.</span>
            <div aria-label="Example backdrop colors" className="flex gap-1.5">
              <span className="size-5 rounded-full border border-border bg-[#dce1d3]" />
              <span className="size-5 rounded-full border border-border bg-[#edd2c5]" />
              <span className="size-5 rounded-full border border-border bg-[#ece9e0]" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] border-t border-border px-5 py-10 sm:px-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight">From capture to composition.</h2>
          <span className="eyebrow hidden sm:block">FOUR SIMPLE STEPS</span>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map(({ label, description, Icon }, i) => (
            <article key={label} className="flex gap-4">
              <span className="mt-1 font-mono text-[10px] text-accent">0{i + 1}</span>
              <div>
                <Icon size={22} stroke={1.5} className="mb-4 text-secondary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{label}</h3>
                <p className="mt-2 max-w-56 text-xs leading-6 text-secondary">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-6 text-xs text-tertiary sm:px-10">
        <span>Made for the details.</span>
        {!localOnly && (
          <Link href="/?auth=login" className="hover:text-accent">
            Sign in for cloud sync
            <IconArrowRight size={14} className="ml-2 inline" />
          </Link>
        )}
      </footer>
      {!localOnly && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
    </main>
  );
}
