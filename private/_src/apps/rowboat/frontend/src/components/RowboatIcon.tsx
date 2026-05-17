/**
 * Side-view rowboat — the app logo. Drawn as an SVG so it scales cleanly
 * for both the sidebar header (24–32 px) and the map marker (~44 px).
 *
 * The boat is drawn pointing RIGHT by default. `flipped` mirrors it
 * horizontally for when the boat is moving westward across the map so the
 * bow still appears to lead the direction of travel.
 *
 * `hullColor` lets callers tint the boat to match the active alignment
 * (cyan for plan mode, lime for scenario mode, white in the sidebar).
 */
export interface RowboatIconProps {
  hullColor?: string;
  flipped?: boolean;
  /** Pixel width; height is auto-scaled at 2:1. */
  width?: number;
  /** Override class on the wrapping <span>. */
  className?: string;
}

export function RowboatIcon({
  hullColor = '#22d3ee',
  flipped = false,
  width = 48,
  className,
}: RowboatIconProps) {
  const height = Math.round(width * 0.5);
  const transform = flipped ? 'scale(-1, 1) translate(-64, 0)' : undefined;
  return (
    <span
      className={className}
      style={{ display: 'inline-block', lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 32"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={transform}>
          {/* pennant at the bow */}
          <line x1="50" y1="3" x2="50" y2="11" stroke="rgba(0,0,0,0.75)" strokeWidth="0.9" />
          <path
            d="M50 3 L57 6 L50 9 Z"
            fill={hullColor}
            stroke="rgba(0,0,0,0.75)"
            strokeWidth="0.55"
          />

          {/* hull — classic banana profile with upturned bow + stern */}
          <path
            d="M5 17
               Q9 11 32 10.5
               Q55 11 58 17
               Q57 25 49 25.5
               Q41 26 32 26
               Q22 26 14 25.5
               Q7 25 5 17 Z"
            fill={hullColor}
            stroke="rgba(0,0,0,0.8)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* gunwale highlight */}
          <path
            d="M8 17 Q11 12 32 11.5 Q53 12 55 17"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.55"
            fill="none"
          />

          {/* near-side waterline shading */}
          <path
            d="M6 21 Q32 22 58 21"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="0.6"
            fill="none"
          />

          {/* thwarts (cross-benches visible as small vertical bands from the side) */}
          <line x1="20" y1="12.5" x2="20" y2="17" stroke="rgba(0,0,0,0.55)" strokeWidth="0.9" />
          <line x1="44" y1="12.5" x2="44" y2="17" stroke="rgba(0,0,0,0.55)" strokeWidth="0.9" />

          {/* rower torso + head */}
          <rect
            x="29"
            y="7.5"
            width="6"
            height="9"
            rx="2"
            fill="rgba(60,30,10,0.88)"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="0.5"
          />
          <circle
            cx="32"
            cy="5"
            r="2.8"
            fill="#fde68a"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="0.6"
          />

          {/* oar — handle in rower's hand, shaft into the water, paddle blade */}
          <line
            x1="30"
            y1="9"
            x2="22"
            y2="13"
            stroke="#7c4a18"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <line
            x1="22"
            y1="13"
            x2="11"
            y2="26"
            stroke="#7c4a18"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <g transform="rotate(50 10 28)">
            <ellipse
              cx="10"
              cy="28"
              rx="2.6"
              ry="1.4"
              fill="#a16207"
              stroke="rgba(0,0,0,0.65)"
              strokeWidth="0.5"
            />
          </g>

          {/* splash droplets where the oar dips */}
          <path
            d="M5 26 Q8 24 12 26 M3 28 Q5 27 7 28"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.7"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </span>
  );
}

/**
 * Server-side serialisation: returns the same SVG as a markup string, ready
 * to drop into a Leaflet `DivIcon` (which only takes raw HTML, not React).
 */
export function rowboatSvgMarkup(opts: {
  hullColor: string;
  flipped: boolean;
  size: number;
}): string {
  const height = Math.round(opts.size * 0.5);
  const transform = opts.flipped ? 'scale(-1, 1) translate(-64, 0)' : '';
  return `
    <svg viewBox="0 0 64 32" width="${opts.size}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="${transform}">
        <line x1="50" y1="3" x2="50" y2="11" stroke="rgba(0,0,0,0.75)" stroke-width="0.9" />
        <path d="M50 3 L57 6 L50 9 Z" fill="${opts.hullColor}" stroke="rgba(0,0,0,0.75)" stroke-width="0.55" />
        <path d="M5 17 Q9 11 32 10.5 Q55 11 58 17 Q57 25 49 25.5 Q41 26 32 26 Q22 26 14 25.5 Q7 25 5 17 Z"
              fill="${opts.hullColor}" stroke="rgba(0,0,0,0.8)" stroke-width="1.2" stroke-linejoin="round" />
        <path d="M8 17 Q11 12 32 11.5 Q53 12 55 17" stroke="rgba(0,0,0,0.35)" stroke-width="0.55" fill="none" />
        <path d="M6 21 Q32 22 58 21" stroke="rgba(0,0,0,0.18)" stroke-width="0.6" fill="none" />
        <line x1="20" y1="12.5" x2="20" y2="17" stroke="rgba(0,0,0,0.55)" stroke-width="0.9" />
        <line x1="44" y1="12.5" x2="44" y2="17" stroke="rgba(0,0,0,0.55)" stroke-width="0.9" />
        <rect x="29" y="7.5" width="6" height="9" rx="2" fill="rgba(60,30,10,0.88)" stroke="rgba(0,0,0,0.6)" stroke-width="0.5" />
        <circle cx="32" cy="5" r="2.8" fill="#fde68a" stroke="rgba(0,0,0,0.7)" stroke-width="0.6" />
        <line x1="30" y1="9" x2="22" y2="13" stroke="#7c4a18" stroke-width="1.3" stroke-linecap="round" />
        <line x1="22" y1="13" x2="11" y2="26" stroke="#7c4a18" stroke-width="1.8" stroke-linecap="round" />
        <g transform="rotate(50 10 28)">
          <ellipse cx="10" cy="28" rx="2.6" ry="1.4" fill="#a16207" stroke="rgba(0,0,0,0.65)" stroke-width="0.5" />
        </g>
        <path d="M5 26 Q8 24 12 26 M3 28 Q5 27 7 28"
              stroke="rgba(255,255,255,0.7)" stroke-width="0.7" fill="none" stroke-linecap="round" />
      </g>
    </svg>
  `;
}
