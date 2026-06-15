'use client'

/**
 * /stream-demo  — Improved stream-processing animation (standalone prototype)
 *
 * Improvements over the landing page version:
 *  1. Real sinusoidal wave paths (SVG polyline, not Bézier guesses)
 *  2. Amplitude-modulated NOISE waves — irregular, spiky, chaotic
 *  3. PRIMARY SPEAKER wave is smooth & prominent
 *  4. Font hierarchy: phrase text large & dark, alias labels small & muted
 *  5. Brand-green (#1A8A70) glow on Arctan node
 *  6. Waves oscillate in-place (scaleY) — not translateY drift
 *  7. Output phrase "lands" into the Voice Agent box cleanly
 */

const GTA    = '"GT America Regular", "GT America Regular Placeholder", sans-serif'
const GTA_MD = '"GT America Trial Md", "GT America Trial Md Placeholder", sans-serif'

const GREEN  = '#1A8A70'
const INK    = '#1B0624'
const MUTED  = '#898683'
const OFF    = '#F7F7F5'
const WHITE  = '#FFFFFF'
const BORDER = 'rgba(0,0,0,0.09)'

const LOGO   = '/logos/arctan-mark.svg'

// ── Utility: build a sinusoidal SVG polyline points string ────────────────────
// x0..x1, centre y, amplitude (px), wavelength (px), phase offset (rad)
function sinePoints(
  x0: number, x1: number, cy: number,
  amp: number, wl: number, phase = 0,
  steps = 120,
): string {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (i / steps) * (x1 - x0)
    const y = cy + amp * Math.sin((2 * Math.PI * (x - x0)) / wl + phase)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

// ── Noise wave: random-amplitude sine sum (jagged, irregular) ─────────────────
function noisePoints(
  x0: number, x1: number, cy: number,
  baseAmp: number, seed: number,
  steps = 180,
): string {
  const pts: string[] = []
  // multiple harmonics, offset by seed
  const h = [
    { wl: 90,  amp: baseAmp,       ph: seed * 1.3 },
    { wl: 42,  amp: baseAmp * 0.6, ph: seed * 2.1 },
    { wl: 22,  amp: baseAmp * 0.35,ph: seed * 3.7 },
    { wl: 13,  amp: baseAmp * 0.2, ph: seed * 5.2 },
  ]
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (i / steps) * (x1 - x0)
    const rel = x - x0
    let y = cy
    for (const { wl, amp, ph } of h) {
      y += amp * Math.sin((2 * Math.PI * rel) / wl + ph)
    }
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

// Pre-compute paths (static — no window needed)
const CX = 460   // Arctan node centre x
const CY = 200   // vertical centre

// noise wave centre-y values (spread above/below CY)
const NOISE_WAVES = [
  { id: 'w0', cy: CY - 130, label: 'BACKGROUND NOISE', seed: 0.4,  amp: 13, dur: '5.8s', delay: '0s',    opacity: 0.55 },
  { id: 'w1', cy: CY - 72,  label: 'CROSS-TALK',       seed: 1.2,  amp: 10, dur: '6.9s', delay: '-1.4s', opacity: 0.50 },
  { id: 'w2', cy: CY + 68,  label: 'MURMUR',           seed: 2.1,  amp: 9,  dur: '7.4s', delay: '-3.1s', opacity: 0.45 },
  { id: 'w3', cy: CY + 124, label: 'ECHO',             seed: 3.0,  amp: 12, dur: '8.2s', delay: '-5.6s', opacity: 0.40 },
]

// primary speaker wave  (smooth sine, prominent)
const MAIN_CY  = CY
const MAIN_AMP = 16

// x-range for input waves (left edge → Arctan node)
const X0  = -30
const X1  = CX - 48   // waves "enter" the node circle

// output path  (node right edge → voice agent box)
const OX0 = CX + 48
const OX1 = 760

export default function StreamDemo() {
  return (
    <>
      <style>{`
        @font-face {
          font-family: "GT America Regular";
          src: url("https://framerusercontent.com/assets/P3OjLjGu6v81n98w2gJu394bcVY.woff2") format("woff2");
          font-weight: 400; font-style: normal;
        }
        @font-face {
          font-family: "GT America Trial Md";
          src: url("https://framerusercontent.com/assets/KX9hLzOanMNFpM4cKpnFoJUyc4.woff2") format("woff2");
          font-weight: 500; font-style: normal;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${OFF}; }

        /* ── Wave oscillation — scaleY about the wave's own centre ── */
        .wNoise { transform-box: fill-box; transform-origin: center;
                  animation: oscillateNoise ease-in-out infinite; }
        .wMain  { transform-box: fill-box; transform-origin: center;
                  animation: oscillateMain 7.2s ease-in-out infinite; }
        @keyframes oscillateNoise {
          0%,100% { transform: scaleY(0.55); }
          50%     { transform: scaleY(1.45); }
        }
        @keyframes oscillateMain {
          0%,100% { transform: scaleY(0.80); }
          50%     { transform: scaleY(1.20); }
        }

        /* ── Arctan glow pulse ── */
        .nodeGlow { transform-box: fill-box; transform-origin: center;
                    animation: glowPulse 3.2s ease-in-out infinite; }
        @keyframes glowPulse {
          0%,100% { opacity: 0.18; transform: scale(1); }
          50%     { opacity: 0.38; transform: scale(1.08); }
        }

        /* ── Phrase text flows along path ── */
        .phraseText { font-family: ${GTA_MD}; font-size: 17px; font-weight: 600;
                      letter-spacing: -0.03em; fill: ${INK}; }
        .phraseOut  { font-family: ${GTA_MD}; font-size: 17px; font-weight: 600;
                      letter-spacing: -0.03em; fill: ${INK}; }

        /* ── Section chrome ── */
        .demo-wrap {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 40px; gap: 32px;
          background: ${OFF};
        }
        .demo-label {
          font-family: 'Fragment Mono', monospace; font-size: 11px;
          letter-spacing: 0.1em; color: ${GREEN}; text-transform: uppercase;
        }
        .demo-h2 {
          font-family: ${GTA}; font-size: 36px; font-weight: 400;
          letter-spacing: -0.04em; line-height: 1.15em; color: ${INK};
          text-align: center;
        }
        .demo-svg-wrap {
          width: 100%; max-width: 900px;
          background: ${WHITE}; border: 1px solid ${BORDER};
          border-radius: 20px; overflow: hidden; padding: 40px 0 48px;
        }

        @media (prefers-reduced-motion: reduce) {
          .wNoise, .wMain, .nodeGlow { animation: none; }
        }
      `}</style>

      <div className="demo-wrap">
        <span className="demo-label">Signal Intelligence · Prototype</span>
        <h2 className="demo-h2">
          <span style={{ color: GREEN }}>Multiple</span> voices.<br/>
          Only the Primary speaker gets through.
        </h2>

        <div className="demo-svg-wrap">
          <svg
            viewBox="-30 60 900 310"
            width="100%"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* clip so waves don't bleed past Arctan circle */}
              <clipPath id="leftClip">
                <rect x={X0} y="60" width={X1 - X0 + 10} height="310" />
              </clipPath>
              {/* output path for textPath */}
              <path id="outPath" d={`M ${OX0},${CY} L ${OX1},${CY}`} fill="none" />
              {/* main input path for textPath */}
              <path id="mainPath"
                d={`M ${X0},${MAIN_CY} C 60,${MAIN_CY - 18} 160,${MAIN_CY + 18} 260,${MAIN_CY}
                    C 340,${MAIN_CY - 14} 390,${MAIN_CY + 10} ${X1},${MAIN_CY}`}
                fill="none" />
              <clipPath id="logoClip"><circle cx={CX} cy={CY} r="36"/></clipPath>
            </defs>

            {/* ════════ NOISE WAVES (left) ════════ */}
            {NOISE_WAVES.map((w) => {
              const pts = noisePoints(X0, X1, w.cy, w.amp, w.seed)
              return (
                <g key={w.id} clipPath="url(#leftClip)">
                  {/* Alias label */}
                  <text
                    x="4" y={w.cy - w.amp - 10}
                    fontFamily="'Fragment Mono', monospace"
                    fontSize="8.5" letterSpacing="0.09em"
                    fill={MUTED} opacity="0.8"
                  >{w.label}</text>

                  {/* Animated wave */}
                  <g className="wNoise" style={{
                    animationDuration: w.dur,
                    animationDelay: w.delay,
                  }}>
                    <polyline
                      points={pts}
                      fill="none"
                      stroke={INK}
                      strokeWidth="1.2"
                      opacity={w.opacity}
                      strokeDasharray="none"
                    />
                  </g>
                </g>
              )
            })}

            {/* ════════ PRIMARY SPEAKER WAVE ════════ */}
            {/* Label */}
            <text
              x="4" y={MAIN_CY - MAIN_AMP - 12}
              fontFamily="'Fragment Mono', monospace"
              fontSize="9" fontWeight="600" letterSpacing="0.09em"
              fill={INK} opacity="0.75"
            >PRIMARY SPEAKER</text>

            {/* Smooth sine wave */}
            <g className="wMain">
              <polyline
                points={sinePoints(X0, X1, MAIN_CY, MAIN_AMP, 120, 0)}
                fill="none"
                stroke={INK}
                strokeWidth="2"
                opacity="0.7"
              />
            </g>

            {/* Flowing phrase on main wave */}
            <text className="phraseText">
              <textPath href="#mainPath" startOffset="-30%">
                What is my order status?
                <animate
                  attributeName="startOffset"
                  values="-30%;108%"
                  dur="8.5s"
                  begin="0s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </textPath>
            </text>

            {/* ════════ ARCTAN NODE ════════ */}
            {/* Outer glow ring */}
            <circle className="nodeGlow" cx={CX} cy={CY} r="72"
              fill={GREEN} opacity="0.18" />
            {/* Mid ring */}
            <circle cx={CX} cy={CY} r="54"
              fill={WHITE}
              stroke={GREEN} strokeWidth="2" opacity="0.55" />
            {/* White disc */}
            <circle cx={CX} cy={CY} r="46"
              fill={WHITE}
              stroke="rgba(27,6,36,0.08)" strokeWidth="1" />
            {/* Arctan logomark */}
            <image href="/logos/arctan-mark.svg" x={CX - 22} y={CY - 13} width="44" height="26" />
            {/* Labels below node */}
            <text x={CX} y={CY + 76} textAnchor="middle"
              fontFamily={GTA} fontSize="14" fontWeight="400"
              letterSpacing="-0.03em">
              <tspan fill={INK}>arctan</tspan>
            </text>
            <text x={CX} y={CY + 91} textAnchor="middle"
              fontFamily="'Fragment Mono', monospace" fontSize="8"
              letterSpacing="0.12em" fill={MUTED}>VOICE ISOLATION</text>

            {/* ════════ OUTPUT STREAM ════════ */}
            {/* Clean horizontal line */}
            <line x1={OX0} y1={CY} x2={OX1} y2={CY}
              stroke={INK} strokeWidth="2" opacity="0.55" />

            {/* Flowing phrase on output (same text, faster = "cleaned") */}
            <text className="phraseOut">
              <textPath href="#outPath" startOffset="-35%">
                What is my order status?
                <animate
                  attributeName="startOffset"
                  values="-35%;110%"
                  dur="3.6s"
                  begin="0.6s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </textPath>
            </text>

            {/* ════════ VOICE AGENT BOX ════════ */}
            <rect x={OX1 + 4} y={CY - 24} width="148" height="48"
              rx="12"
              fill={WHITE} stroke={BORDER} strokeWidth="1.5" />
            {/* Headphone icon circle */}
            <circle cx={OX1 + 28} cy={CY} r="14"
              fill="rgba(26,138,112,0.12)" />
            <text x={OX1 + 28} y={CY + 5} textAnchor="middle"
              fontSize="14" fill={GREEN}>🎧</text>
            <text x={OX1 + 46} y={CY + 5}
              fontFamily={GTA} fontSize="13" fontWeight="400"
              letterSpacing="-0.02em" fill={INK}>Voice Agent</text>

          </svg>
        </div>

        {/* Comparison table */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
          maxWidth: 640, width: '100%', marginTop: 8,
        }}>
          {[
            { label: 'Noise waves',      before: 'Bézier curves, slight wobble', after: 'Real sinusoidal harmonics, amplitude-modulated' },
            { label: 'Font hierarchy',   before: 'All labels same weight', after: 'PRIMARY SPEAKER bold, noise labels muted' },
            { label: 'Primary wave',     before: 'Curved path, medium weight', after: 'Smooth sine, heavier stroke, clear dominance' },
            { label: 'Arctan node',      before: 'Lime/neon glow', after: 'Brand green (#1A8A70) double-ring with glow pulse' },
          ].map(row => (
            <div key={row.label} style={{
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 10,
                            letterSpacing: '0.08em', color: GREEN, marginBottom: 8 }}>{row.label.toUpperCase()}</div>
              <div style={{ fontFamily: GTA, fontSize: 13, color: MUTED, marginBottom: 4 }}>
                <span style={{ color: 'rgba(180,40,40,0.7)', marginRight: 4 }}>Before:</span>{row.before}
              </div>
              <div style={{ fontFamily: GTA, fontSize: 13, color: INK }}>
                <span style={{ color: GREEN, marginRight: 4 }}>After:</span>{row.after}
              </div>
            </div>
          ))}
        </div>

        <a href="/landing" style={{
          fontFamily: GTA, fontSize: 14, color: MUTED,
          textDecoration: 'none', letterSpacing: '-0.01em',
          marginTop: 8,
        }}>← Back to landing page</a>
      </div>
    </>
  )
}
