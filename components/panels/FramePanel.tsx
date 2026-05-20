'use client';
import { useDocumentStore } from '@/lib/document/store';
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
    <section style={{ padding: 16, borderBottom: '1px solid #2a2d36', color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 'bold' }}>Frame Mockup</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Frame Type Selection */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
          <span>Type:</span>
          <select
            value={frame.type}
            onChange={(e) => handleTypeChange(e.target.value as Frame['type'])}
            style={{
              flex: 1,
              background: '#1f2937',
              border: '1px solid #2a2d36',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="none">None (Standard)</option>
            <option value="window">Window Frame</option>
            <option value="browser">Browser Frame</option>
            <option value="device">Device Bezel</option>
          </select>
        </label>

        {/* Window Specific Controls */}
        {frame.type === 'window' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
            <span>Style:</span>
            <select
              value={frame.variant}
              onChange={(e) => setFrame({ type: 'window', variant: e.target.value as 'macos' | 'macos-dark' })}
              style={{
                flex: 1,
                background: '#1f2937',
                border: '1px solid #2a2d36',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              <option value="macos">macOS Light</option>
              <option value="macos-dark">macOS Dark</option>
            </select>
          </label>
        )}

        {/* Browser Specific Controls */}
        {frame.type === 'browser' && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
              <span>Variant:</span>
              <select
                value={frame.variant}
                onChange={(e) =>
                  setFrame({
                    ...frame,
                    variant: e.target.value as 'safari' | 'chrome' | 'arc',
                  })
                }
                style={{
                  flex: 1,
                  background: '#1f2937',
                  border: '1px solid #2a2d36',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="safari">Safari</option>
                <option value="chrome">Google Chrome</option>
                <option value="arc">Arc Browser</option>
              </select>
            </label>

            {frame.variant !== 'arc' && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
                  <span>URL:</span>
                  <input
                    type="text"
                    value={frame.url || ''}
                    onChange={(e) => setFrame({ ...frame, url: e.target.value })}
                    placeholder="screenstyler.com"
                    style={{
                      flex: 1,
                      background: '#1f2937',
                      border: '1px solid #2a2d36',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
                  <span>Theme:</span>
                  <select
                    value={frame.theme}
                    onChange={(e) =>
                      setFrame({
                        ...frame,
                        theme: e.target.value as 'light' | 'dark',
                      })
                    }
                    style={{
                      flex: 1,
                      background: '#1f2937',
                      border: '1px solid #2a2d36',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                  </select>
                </label>
              </>
            )}
          </>
        )}

        {/* Device Specific Controls */}
        {frame.type === 'device' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
            <span>Device:</span>
            <select
              value={frame.variant}
              onChange={(e) => setFrame({ type: 'device', variant: e.target.value as 'iphone' | 'macbook' | 'ipad' })}
              style={{
                flex: 1,
                background: '#1f2937',
                border: '1px solid #2a2d36',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              <option value="iphone">iPhone Mockup</option>
              <option value="ipad">iPad Mockup</option>
              <option value="macbook">MacBook Mockup</option>
            </select>
          </label>
        )}
      </div>
    </section>
  );
}
