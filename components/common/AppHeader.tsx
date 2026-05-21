import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';

type NavKey = 'home' | 'projects';

type Props = {
  active?: NavKey;
};

const navItems: { key: NavKey; href: string; label: string }[] = [
  { key: 'home', href: '/', label: 'Overview' },
  { key: 'projects', href: '/projects', label: 'Projects' },
];

export function AppHeader({ active = 'home' }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-white transition hover:opacity-90">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            Ss
          </span>
          <span className="text-base font-semibold tracking-tight">Screenstyler</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 rounded-lg bg-zinc-900/50 p-1 shadow-sm ring-1 ring-zinc-800/50 md:flex">
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <AuthButton />
      </div>
    </header>
  );
}
