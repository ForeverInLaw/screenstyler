'use client';
import { IconBrowser } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { PanelSection } from '@/components/ui/PanelSection';
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
        <label className="control-row">
          <span>Type:</span>
          <select
            className="field"
            value={frame.type}
            onChange={(e) => handleTypeChange(e.target.value as Frame['type'])}
          >
            <option value="none">None (Standard)</option>
            <option value="window">Window Frame</option>
            <option value="browser">Browser Frame</option>
            <option value="device">Device Bezel</option>
          </select>
        </label>
        {frame.type === 'window' && (
          <label className="control-row">
            <span>Style:</span>
            <select
              className="field"
              value={frame.variant}
              onChange={(e) =>
                setFrame({ type: 'window', variant: e.target.value as 'macos' | 'macos-dark' })
              }
            >
              <option value="macos">macOS Light</option>
              <option value="macos-dark">macOS Dark</option>
            </select>
          </label>
        )}
        {frame.type === 'browser' && (
          <>
            <label className="control-row">
              <span>Variant:</span>
              <select
                className="field"
                value={frame.variant}
                onChange={(e) =>
                  setFrame({
                    ...frame,
                    variant: e.target.value as 'safari' | 'chrome' | 'arc',
                  })
                }
              >
                <option value="safari">Safari</option>
                <option value="chrome">Google Chrome</option>
                <option value="arc">Arc Browser</option>
              </select>
            </label>

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

                <label className="control-row">
                  <span>Theme:</span>
                  <select
                    className="field"
                    value={frame.theme}
                    onChange={(e) =>
                      setFrame({
                        ...frame,
                        theme: e.target.value as 'light' | 'dark',
                      })
                    }
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                  </select>
                </label>
              </>
            )}
          </>
        )}
        {frame.type === 'device' && (
          <label className="control-row">
            <span>Device:</span>
            <select
              className="field"
              value={frame.variant}
              onChange={(e) =>
                setFrame({ type: 'device', variant: e.target.value as 'iphone' | 'macbook' | 'ipad' })
              }
            >
              <option value="iphone">iPhone Mockup</option>
              <option value="ipad">iPad Mockup</option>
              <option value="macbook">MacBook Mockup</option>
            </select>
          </label>
        )}
      </div>
    </PanelSection>
  );
}
