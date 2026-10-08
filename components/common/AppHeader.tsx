import Link from 'next/link';
import { IconPhoto, IconStack2 } from '@tabler/icons-react';
import { AuthButton } from '@/components/auth/AuthButton';
import { Brand } from './Brand';
import { isLocalOnly } from '@/lib/config/runtime';

type NavKey = 'home' | 'projects';
const navItems = [
  { key: 'home', href: '/', label: 'Overview', Icon: IconPhoto },
  { key: 'projects', href: '/projects', label: 'Projects', Icon: IconStack2 },
] as const;

export function AppHeader({ active = 'home' }: { active?: NavKey }) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto grid min-h-20 max-w-[1440px] grid-cols-[1fr_auto] items-center justify-between gap-x-4 gap-y-2 md:flex px-5 py-3 sm:px-10">
        <Link href="/" aria-label="Screenstyler home">
          <Brand />
        </Link>
        <nav aria-label="Primary" className="order-3 col-span-2 flex items-center gap-1 md:order-none">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? 'page' : undefined}
              className={`button button-ghost px-2 sm:px-5 ${active === item.key ? 'bg-well text-foreground' : ''}`}
            >
              <item.Icon size={20} stroke={1.6} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="order-2 flex items-center gap-4 md:order-none">
          {isLocalOnly() ? (
            <span className="eyebrow hidden items-center gap-2 sm:flex">
              <span className="size-1.5 rounded-full bg-success" />
              LOCAL WORKSPACE
            </span>
          ) : (
            <AuthButton />
          )}
        </div>
      </div>
    </header>
  );
}
