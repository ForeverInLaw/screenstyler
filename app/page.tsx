import Link from 'next/link';
import { Suspense } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import { AppHeader } from '@/components/common/AppHeader';

const workflow = [
  {
    title: 'Upload',
    desc: 'Drag & drop your screenshot or start from a blank canvas.',
    badge: '01',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/25 text-blue-400',
  },
  {
    title: 'Frame',
    desc: 'Apply canvas presets, shadows, margins, and sleek 3D angles.',
    badge: '02',
    color: 'from-indigo-500/10 to-violet-500/10 border-indigo-500/25 text-indigo-400',
  },
  {
    title: 'Annotate',
    desc: 'Draw arrows, highlight areas, type text, or blur sensitive data.',
    badge: '03',
    color: 'from-violet-500/10 to-fuchsia-500/10 border-violet-500/25 text-violet-400',
  },
  {
    title: 'Export',
    desc: 'Download clean high-resolution PNGs ready for socials or docs.',
    badge: '04',
    color: 'from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/25 text-pink-400',
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 overflow-x-hidden relative">
      {/* Ambient glowing background meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-violet-600/10 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] aspect-square rounded-full bg-fuchsia-500/5 blur-[100px] pointer-events-none" />

      <AppHeader active="home" />

      {/* Hero Section */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24 relative z-10">
        <div className="flex flex-col justify-center">
          <p className="mb-6 w-fit rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-zinc-400 backdrop-blur-sm shadow-inner shadow-white/5">
            ✨ Screenstyler Studio
          </p>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-100 to-zinc-400 sm:text-6.5xl">
            Turn raw screenshots into polished product images.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Build beautiful device frames, eye-catching gradient backdrops, 3D tilts, and professional annotations in seconds. No heavy design tools required.
          </p>
          
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/projects"
              className="group relative rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Start Designing Free
              <span className="inline-block ml-1.5 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/?auth=login"
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm px-6 py-3.5 text-center text-sm font-semibold text-zinc-200 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800/80 hover:text-white hover:border-zinc-700/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
            >
              Sign in for cloud sync
            </Link>
          </div>

          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-zinc-800/80 pt-8 text-sm">
            <div>
              <dt className="font-semibold text-zinc-200">Local-first</dt>
              <dd className="mt-1.5 text-zinc-450 leading-relaxed">Save drafts automatically, account optional.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-200">3D Tilt & Shadow</dt>
              <dd className="mt-1.5 text-zinc-450 leading-relaxed">Create beautiful mockups at arbitrary scales.</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-200">Rich Annotations</dt>
              <dd className="mt-1.5 text-zinc-450 leading-relaxed">Add blurs, highlights, arrows & text layers.</dd>
            </div>
          </dl>
        </div>

        {/* 3D Tilted Interactive-Style Hero Graphics */}
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
                <div className="rounded-md bg-zinc-900 px-3 py-0.5 text-[10px] font-medium text-zinc-550 border border-zinc-850">
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

      {/* Workflow steps / Features */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Clean screenshot design workflow.
          </h2>
          <p className="mt-4 text-zinc-450 max-w-xl mx-auto">
            Design stunning showcase graphics in 4 simple steps without loading heavy image editors.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((step) => (
            <article 
              key={step.title} 
              className="group relative rounded-2xl border border-zinc-850 bg-zinc-900/35 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 hover:border-zinc-800/80 shadow-md hover:shadow-xl hover:shadow-indigo-500/[0.02]"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold bg-gradient-to-r ${step.color}`}>
                  {step.badge}
                </span>
                <span className="size-1.5 rounded-full bg-zinc-800 group-hover:bg-indigo-500 transition-colors" />
              </div>
              
              <h3 className="mt-5 text-lg font-bold tracking-tight text-white">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-350 transition-colors">
                {step.desc}
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
