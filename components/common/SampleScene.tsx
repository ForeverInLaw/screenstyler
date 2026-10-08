import { IconArrowUpRight, IconCheck } from '@tabler/icons-react';

type Props = { variant?: 'paper' | 'sage' | 'clay'; compact?: boolean };

/** A sample composition, never mixed with the visitor's actual project data. */
export function SampleScene({ variant = 'sage', compact = false }: Props) {
  return (
    <div
      className={`sample-scene sample-${variant} ${compact ? 'sample-compact' : ''}`}
      aria-label="Example screenshot composition"
    >
      <div className="sample-window">
        <div className="sample-chrome">
          <div className="sample-dots">
            <i />
            <i />
            <i />
          </div>
          <span>screenstyler / release notes</span>
          <IconArrowUpRight size={12} />
        </div>
        <div className="sample-content">
          <div className="sample-topline">
            <span>SCREENSTYLER</span>
            <span>v.01</span>
          </div>
          <h3>
            Made for the
            <br />
            details.
          </h3>
          <p>A little framing goes a long way.</p>
          <div className="sample-release">
            <span className="sample-check">
              <IconCheck size={14} />
            </span>
            <div>
              <strong>Better screenshots, fewer steps.</strong>
              <span>Frames, backgrounds & a finishing touch.</span>
            </div>
            <span className="sample-new">NEW</span>
          </div>
          <div className="sample-bottom">
            <span>Product update</span>
            <span>01 / 03</span>
          </div>
        </div>
      </div>
    </div>
  );
}
