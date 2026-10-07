'use client';
import { IconBrowser } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { PanelSection } from '@/components/ui/PanelSection';
import { Select } from '@/components/ui/Select';
import type { Frame } from '@/lib/document/schema';

export function FramePanel() {
  const frame = useDocumentStore((s) => s.doc.content.frame);
  const setFrame = useDocumentStore((s) => s.setFrame);

  function handleTypeChange(type: Frame['type']) {
    if (type === 'none') {
      setFrame({ type: 'none' });
    } else if (type === 'window') {
      setFrame({ type: 'window', variant: 'macos' });
    } else if (type === 'browser') {
      setFrame({ type: 'browser', variant: 'safari', url: 'screenstyler.com', theme: 'light' });
    } else if (type === 'device') {
      setFrame({ type: 'device', variant: 'iphone' });
    }
  }

  return (
    <PanelSection icon={IconBrowser} title="Frame Mockup">
      <div className="grid gap-3">
        <Select
          label="Type:"
          value={frame.type}
          onValueChange={handleTypeChange}
          options={[
            { value: 'none', label: 'None (Standard)' },
            { value: 'window', label: 'Window Frame' },
            { value: 'browser', label: 'Browser Frame' },
            { value: 'device', label: 'Device Bezel' },
          ]}
        />
        {frame.type === 'window' && (
          <Select
            label="Style:"
            value={frame.variant}
            onValueChange={(variant) => setFrame({ type: 'window', variant })}
            options={[
              { value: 'macos', label: 'macOS Light' },
              { value: 'macos-dark', label: 'macOS Dark' },
            ]}
          />
        )}
        {frame.type === 'browser' && (
          <>
            <Select
              label="Variant:"
              value={frame.variant}
              onValueChange={(variant) => setFrame({ ...frame, variant })}
              options={[
                { value: 'safari', label: 'Safari' },
                { value: 'chrome', label: 'Google Chrome' },
                { value: 'arc', label: 'Arc Browser' },
              ]}
            />

            {frame.variant !== 'arc' && (
              <>
                <label className="control-row">
                  <span>URL:</span>
                  <input
                    className="field"
                    type="text"
                    value={frame.url || ''}
                    onChange={(e) => setFrame({ ...frame, url: e.target.value })}
                    placeholder="screenstyler.com"
                  />
                </label>

                <Select
                  label="Theme:"
                  value={frame.theme ?? 'light'}
                  onValueChange={(theme) => setFrame({ ...frame, theme })}
                  options={[
                    { value: 'light', label: 'Light Theme' },
                    { value: 'dark', label: 'Dark Theme' },
                  ]}
                />
              </>
            )}
          </>
        )}
        {frame.type === 'device' && (
          <Select
            label="Device:"
            value={frame.variant}
            onValueChange={(variant) => setFrame({ type: 'device', variant })}
            options={[
              { value: 'iphone', label: 'iPhone Mockup' },
              { value: 'ipad', label: 'iPad Mockup' },
              { value: 'macbook', label: 'MacBook Mockup' },
            ]}
          />
        )}
      </div>
    </PanelSection>
  );
}
