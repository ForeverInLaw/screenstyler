'use client';
import { IconShadow } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { DocumentSlider } from '@/components/ui/DocumentSlider';
import { PanelSection } from '@/components/ui/PanelSection';

export function StylePanel() {
  const padding = useDocumentStore((s) => s.doc.content.padding);
  const cornerRadius = useDocumentStore((s) => s.doc.content.cornerRadius);
  const shadow = useDocumentStore((s) => s.doc.content.shadow);
  const setPadding = useDocumentStore((s) => s.setPadding);
  const setCornerRadius = useDocumentStore((s) => s.setCornerRadius);
  const setShadow = useDocumentStore((s) => s.setShadow);
  return (
    <PanelSection icon={IconShadow} title="Spacing & shadow">
      <DocumentSlider label="Padding" value={padding} min={0} max={400} suffix=" px" onChange={setPadding} />
      <DocumentSlider
        label="Corner radius"
        value={cornerRadius}
        min={0}
        max={80}
        suffix=" px"
        onChange={setCornerRadius}
      />
      <DocumentSlider
        label="Shadow blur"
        value={shadow.blur}
        min={0}
        max={200}
        suffix=" px"
        onChange={(blur) => setShadow({ ...shadow, blur })}
      />
      <DocumentSlider
        label="Shadow opacity"
        value={Math.round(shadow.opacity * 100)}
        min={0}
        max={100}
        suffix="%"
        onChange={(v) => setShadow({ ...shadow, opacity: v / 100 })}
      />
    </PanelSection>
  );
}
