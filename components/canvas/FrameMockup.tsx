'use client';
import { type ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight, IconLock, IconX } from '@tabler/icons-react';
import type { Frame, Shadow } from '@/lib/document/schema';
import { shadowToCss } from '@/lib/style/css';

type Props = {
  frame: Frame;
  shadow: Shadow;
  cornerRadius: number;
  children: ReactNode;
};

export function FrameMockup({ frame, shadow, cornerRadius, children }: Props) {
  const outerShadow = shadowToCss(shadow);

  if (frame.type === 'none') {
    return (
      <div
        data-testid="frame-mockup-none"
        style={{
          borderRadius: `${cornerRadius}px`,
          boxShadow: outerShadow,
          overflow: 'hidden',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    );
  }

  if (frame.type === 'window') {
    const isDark = frame.variant === 'macos-dark';
    const headerBg = isDark ? '#2d2e30' : '#ebebeb';
    const contentBg = isDark ? '#1e1e1e' : '#ffffff';
    const border = isDark ? '1px solid #1a1a1a' : '1px solid #d1d1d1';

    return (
      <div
        data-testid="frame-mockup-window"
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          boxShadow: outerShadow,
          overflow: 'hidden',
          background: contentBg,
          border,
          width: '100%',
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '32px',
            background: headerBg,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderBottom: isDark ? '1px solid #232425' : '1px solid #d8d8d8',
            position: 'relative',
          }}
        >
          {/* Traffic Lights */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
          </div>
        </div>
        {/* Window Content */}
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    );
  }

  if (frame.type === 'browser') {
    const isDark = frame.theme === 'dark';
    const headerBg = isDark ? '#202124' : '#f1f3f4';
    const border = isDark ? '1px solid #3c4043' : '1px solid #dee1e6';
    const urlBg = isDark ? '#292a2d' : '#ffffff';
    const urlText = isDark ? '#e8eaed' : '#5f6368';
    const displayUrl = frame.url || 'screenstyler.com';

    if (frame.variant === 'safari') {
      return (
        <div
          data-testid="frame-mockup-browser"
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            boxShadow: outerShadow,
            overflow: 'hidden',
            background: isDark ? '#1e1e1e' : '#ffffff',
            border,
            width: '100%',
          }}
        >
          {/* Safari Header */}
          <div
            style={{
              height: '42px',
              background: headerBg,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '16px',
              borderBottom: border,
            }}
          >
            {/* Traffic Lights */}
            <div style={{ display: 'flex', gap: '8px', minWidth: '52px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            {/* Nav Arrows */}
            <div style={{ display: 'flex', gap: '12px', opacity: 0.5, alignItems: 'center' }}>
              <IconChevronLeft size={12} stroke={2.5} aria-hidden="true" />
              <IconChevronRight size={12} stroke={2.5} aria-hidden="true" />
            </div>
            {/* URL Bar */}
            <div
              style={{
                flex: 1,
                background: urlBg,
                borderRadius: '6px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: urlText,
                border: isDark ? '1px solid #303134' : '1px solid #e0e0e0',
                padding: '0 8px',
                textAlign: 'center',
              }}
            >
              <IconLock size={12} stroke={2} style={{ opacity: 0.5, marginRight: '4px' }} aria-hidden="true" />
              {displayUrl}
            </div>
          </div>
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            {children}
          </div>
        </div>
      );
    }

    if (frame.variant === 'chrome') {
      return (
        <div
          data-testid="frame-mockup-browser"
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            boxShadow: outerShadow,
            overflow: 'hidden',
            background: isDark ? '#202124' : '#ffffff',
            border,
            width: '100%',
          }}
        >
          {/* Chrome Tab & URL Bar */}
          <div style={{ background: headerBg, padding: '8px 8px 4px 8px', display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Traffic Lights */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              {/* Tab */}
              <div
                style={{
                  background: isDark ? '#35363a' : '#ffffff',
                  color: isDark ? '#ffffff' : '#4a4a4a',
                  padding: '4px 16px',
                  borderRadius: '8px 8px 0 0',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: isDark ? '1px solid #35363a' : '1px solid #dee1e6',
                  borderBottom: 'none',
                }}
              >
                <span>New Tab</span>
                <IconX size={12} stroke={2} style={{ opacity: 0.5 }} aria-hidden="true" />
              </div>
            </div>
            {/* Address Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                flex: 1,
                background: urlBg,
                borderRadius: '16px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                fontSize: '12px',
                color: urlText,
                border: isDark ? 'none' : '1px solid #dee1e6',
              }}>
                {displayUrl}
              </div>
            </div>
          </div>
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            {children}
          </div>
        </div>
      );
    }

    // Arc style browser mockup: Minimal border outline with sidebar indicator
    return (
      <div
        data-testid="frame-mockup-browser"
        style={{
          display: 'flex',
          borderRadius: '12px',
          boxShadow: outerShadow,
          overflow: 'hidden',
          background: isDark ? '#1a1b1e' : '#ffffff',
          border: isDark ? '4px solid #2a2b2f' : '4px solid #f0f0f2',
          width: '100%',
        }}
      >
        {/* Left Arc sidebar indicator */}
        <div style={{ width: '16px', background: isDark ? '#2a2b2f' : '#f0f0f2', borderRight: border }} />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    );
  }

  if (frame.type === 'device') {
    if (frame.variant === 'iphone') {
      return (
        <div
          data-testid="frame-mockup-device"
          style={{
            width: '280px',
            aspectRatio: '9 / 19.5',
            borderRadius: '36px',
            border: '10px solid #1a1a1a',
            background: '#000000',
            boxShadow: outerShadow,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '20px',
              background: '#000000',
              borderRadius: '12px',
              zIndex: 10,
            }}
          />
          {/* screen content */}
          <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      );
    }

    if (frame.variant === 'ipad') {
      return (
        <div
          data-testid="frame-mockup-device"
          style={{
            width: '420px',
            aspectRatio: '4 / 3',
            borderRadius: '24px',
            border: '14px solid #1c1c1e',
            background: '#000000',
            boxShadow: outerShadow,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      );
    }

    if (frame.variant === 'macbook') {
      return (
        <div
          data-testid="frame-mockup-device"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '480px',
          }}
        >
          {/* Screen Bezel */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 10',
              border: '12px solid #000000',
              borderRadius: '16px 16px 0 0',
              background: '#000000',
              boxShadow: outerShadow,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {children}
            </div>
          </div>
          {/* MacBook Keyboard Base */}
          <div
            style={{
              width: '116%',
              height: '10px',
              background: '#c0c0c0',
              borderRadius: '0 0 12px 12px',
              borderBottom: '2px solid #a0a0a0',
              position: 'relative',
            }}
          >
            {/* Laptop Notch */}
            <div
              style={{
                width: '60px',
                height: '4px',
                background: '#808080',
                margin: '0 auto',
                borderRadius: '0 0 4px 4px',
              }}
            />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
