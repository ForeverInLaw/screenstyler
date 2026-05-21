import Link from 'next/link';
import { Suspense } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import { AppHeader } from '@/components/common/AppHeader';

const workflow = ['Upload', 'Frame', 'Annotate', 'Export'];

export default function Home() {
  return (
    <main className="min-h-dvh bg-stone-50 text-zinc-950">
      <AppHeader active="home" />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-5 w-fit rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm">
            Screenshot studio for product teams
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-950 sm:text-6xl">
            Turn raw screenshots into polished product images.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Build clean frames, backgrounds, annotations, and exports without opening a heavyweight design tool.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="rounded-md bg-zinc-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              Open projects
            </Link>
            <Link
              href="/?auth=login"
              className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              Sign in for cloud sync
            </Link>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-zinc-200 pt-6 text-sm">
            <div>
              <dt className="font-semibold text-zinc-950">Local-first</dt>
              <dd className="mt-1 text-zinc-600">Create without an account.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-950">2x export</dt>
              <dd className="mt-1 text-zinc-600">Ready for docs and socials.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-950">Cloud sync</dt>
              <dd className="mt-1 text-zinc-600">Sign in before editing.</dd>
            </div>
          </dl>
        </div>

        <aside className="relative flex items-center justify-center lg:justify-end">
          <div 
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 shadow-2xl backdrop-blur-md shadow-black/80 transition-all duration-500 hover:rotate-1 hover:scale-[1.01]"
            style={{
              transform: 'perspective(1000px) rotateX(10deg) rotateY(-12deg) rotateZ(3deg)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px 1px rgba(99, 102, 241, 0.1)',
            }}
          >
            <div className="rounded-xl overflow-hidden bg-zinc-950 p-4 relative">
              {/* Window Header */}
              <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex gap-2">
                  <span className="size-2.5 rounded-full bg-red-500/85" />
                  <span className="size-2.5 rounded-full bg-yellow-500/85" />
                  <span className="size-2.5 rounded-full bg-green-500/85" />
                </div>
                <div className="rounded-md bg-zinc-900 px-3 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-800">
                  release-notes-mock.png
                </div>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                  2x Export
                </span>
              </div>

              {/* Canvas Backdrop */}
              <div className="grid aspect-[4/3] place-items-center rounded-lg bg-[linear-gradient(135deg,#6366f1,#a855f7_50%,#ec4899)] p-8 relative overflow-hidden shadow-inner">
                {/* Simulated screenshot */}
                <div className="w-full max-w-xs overflow-hidden rounded-lg bg-zinc-950 shadow-2xl border border-zinc-800 relative z-10">
                  {/* Browser chrome */}
                  <div className="flex gap-1.5 border-b border-zinc-900 bg-zinc-900/60 px-3 py-1.5">
                    <span className="size-1.5 rounded-full bg-zinc-700" />
                    <span className="size-1.5 rounded-full bg-zinc-700" />
                    <span className="size-1.5 rounded-full bg-zinc-700" />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="h-2.5 w-20 rounded bg-indigo-500/80" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 rounded bg-zinc-800" />
                      <div className="h-1.5 w-5/6 rounded bg-zinc-800" />
                      <div className="h-1.5 w-2/3 rounded bg-zinc-800" />
                    </div>
                    {/* Simulated Blur target */}
                    <div className="relative rounded-md bg-zinc-900/80 p-2.5 border border-zinc-850">
                      <div className="space-y-1">
                        <div className="h-1 w-12 rounded bg-zinc-700" />
                        <div className="h-1 w-16 rounded bg-zinc-750" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlaid simulated Annotations */}
                {/* 1. Highlight */}
                <div 
                  className="absolute z-20 rounded border border-yellow-400 bg-yellow-400/20 shadow-md shadow-yellow-400/10"
                  style={{ top: '22%', left: '20%', width: '35%', height: '25%' }}
                />

                {/* 2. Arrow */}
                <svg className="absolute inset-0 w-full h-full z-30 pointer-events-none">
                  <defs>
                    <marker id="hero-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                    </marker>
                  </defs>
                  <line 
                    x1="220" 
                    y1="60" 
                    x2="160" 
                    y2="105" 
                    stroke="#ef4444" 
                    strokeWidth="3" 
                    markerEnd="url(#hero-arrow)" 
                  />
                </svg>

                {/* 3. Text */}
                <div 
                  className="absolute z-40 bg-zinc-950/95 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-bold text-red-500 shadow-md"
                  style={{ top: '12%', left: '52%' }}
                >
                  Feature highlight
                </div>

                {/* 4. Blur */}
                <div 
                  className="absolute z-20 rounded backdrop-blur-[6px] bg-white/5 border border-white/10"
                  style={{ top: '64%', left: '33%', width: '22%', height: '14%' }}
                />
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:grid-cols-4">
          {workflow.map((step, index) => (
            <article key={step} className="rounded-lg bg-stone-100 p-5">
              <p className="font-mono text-sm text-zinc-500">0{index + 1}</p>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">{step}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {index === 0 && 'Start from a screenshot or blank canvas.'}
                {index === 1 && 'Pick a device frame, padding, and background.'}
                {index === 2 && 'Add arrows, highlights, text, and blur.'}
                {index === 3 && 'Download a clean PNG for sharing.'}
              </p>
            </article>
          ))}
        </div>
      </section>
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </main>
  );
}
