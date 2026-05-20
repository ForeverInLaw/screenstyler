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

        <aside className="rounded-xl bg-zinc-950 p-3 shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-900">
          <div className="rounded-lg bg-[#101217] p-4 text-white">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-medium text-zinc-400">Preview</p>
                <p className="text-sm font-semibold">Release notes shot</p>
              </div>
              <span className="rounded bg-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-950">
                PNG
              </span>
            </div>
            <div className="grid aspect-[4/3] place-items-center rounded-lg bg-[radial-gradient(circle_at_20%_20%,#f4c95d_0,#f4c95d_20%,transparent_21%),linear-gradient(135deg,#f7f3e8,#dbe7df_55%,#cad8f0)] p-7">
              <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/10">
                <div className="flex gap-1.5 border-b border-zinc-200 bg-zinc-100 px-3 py-2">
                  <span className="size-2 rounded-full bg-red-400" />
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span className="size-2 rounded-full bg-emerald-400" />
                </div>
                <div className="space-y-4 p-5">
                  <div className="h-3 w-28 rounded bg-zinc-900" />
                  <div className="grid grid-cols-[1fr_88px] gap-4">
                    <div className="space-y-2">
                      <div className="h-2 rounded bg-zinc-200" />
                      <div className="h-2 w-5/6 rounded bg-zinc-200" />
                      <div className="h-2 w-2/3 rounded bg-zinc-200" />
                    </div>
                    <div className="rounded-md bg-zinc-950 p-3 text-xs font-semibold text-white">
                      v1.4
                    </div>
                  </div>
                  <div className="rounded-md border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
                    Important callout
                  </div>
                </div>
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
