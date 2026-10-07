import type { Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export function PanelSection({
  title,
  detail,
  icon: SectionIcon,
  children,
}: {
  title: string;
  detail?: string;
  icon?: Icon;
  children: ReactNode;
}) {
  return (
    <section className="studio-section">
      <h3 className="studio-section-title">
        <span className="flex items-center gap-2">
          {SectionIcon && <SectionIcon size={18} stroke={1.6} aria-hidden="true" className="text-tertiary" />}
          {title}
        </span>
        {detail && <span className="font-mono text-[10px] font-normal text-tertiary">{detail}</span>}
      </h3>
      {children}
    </section>
  );
}
