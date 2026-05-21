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
    <header className="border-b border-zinc-200/80 bg-stone-50/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-zinc-950">
          <span className="grid size-9 place-items-center rounded-lg bg-zinc-950 text-sm font-semibold text-white shadow-sm">
            Ss
          </span>
          <span className="text-base font-semibold tracking-tight">Screenstyler</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-zinc-200 md:flex">
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
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
