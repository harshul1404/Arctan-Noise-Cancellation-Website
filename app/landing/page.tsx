'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Exact Duna design tokens (verified from live duna.com CSS) ───────────────
const D = {
  // Backgrounds
  heroBg:   '#160F0C',   // dark hero — rgb(22,15,12)
  cream:    '#EDECE7',   // token a318f3c5
  offWhite: '#F7F7F5',   // token 80102957 — subtle warm off-white
  white:    '#FFFFFF',
  darkCard: '#1A1816',   // token 9dabeecc

  // Text — exact token values from duna.com CSS
  heading:  '#222221',   // token 30df3c5e — H1 primary (near-black warm)
  ink:      '#1B0624',   // token 0bf1f760 — H2 / body primary
  inkSub:   'rgba(27,6,36,0.6)',  // token 3a929211 #1b062499
  bodyText: '#292421',   // token 90006810
  muted:    '#898683',   // token d601907d
  muted2:   '#928e8b',   // token a67ab0af
  dark38:   '#38322f',   // token bc0b8d9a — dark section subtext
  darkPure: '#000000',   // stat numbers are pure black on duna

  // Brand
  lime:     '#1A8A70',   // brand green
  teal:     '#1A8A70',   // brand green
  tealBg:   'rgba(26,138,112,0.2)',

  // Borders
  border:   'rgba(0,0,0,0.1)',
  borderW:  'rgba(255,255,255,0.1)',
  borderW2: 'rgba(255,255,255,0.12)',
}

// ─── Duna GT America font URLs (verified from duna.com @font-face) ───────────
// Primary: GT America Regular (weight 400) — all headings, body, nav
// Display: GT America Trial Md (weight 500) — stat numbers only
const GTA = '"GT America Regular", "GT America Regular Placeholder", sans-serif'
const GTA_MD = '"GT America Trial Md", "GT America Trial Md Placeholder", sans-serif'

// ─── Duna framerusercontent image library ────────────────────────────────────
const IMG = {
  heroMain:    'https://framerusercontent.com/images/mzMKLKsYnRpGNC2hdtBEBC5cVMs.png?scale-down-to=1024&width=1920&height=1172',
  heroWide:    'https://framerusercontent.com/images/6Bxhs0KhT97hQ9m5gnB4rLqmgiI.png?scale-down-to=1024&width=3538&height=1690',
  feature1:    'https://framerusercontent.com/images/f6Bk0XNzze6mKxyPKEF0r9Bzw.webp?width=1091&height=520',
  feature2:    'https://framerusercontent.com/images/5B9mAEjXmYMRNVwwsmmk417ZHg.png?scale-down-to=1024&width=1536&height=1024',
  feature3:    'https://framerusercontent.com/images/TbrjyKNLMQaEawIOOmcFYFjAcw.png?scale-down-to=1024&width=1536&height=1024',
  feature4:    'https://framerusercontent.com/images/xJFroCHV50Jp9iobGWuvDxgRj9w.png?scale-down-to=2048&width=1754&height=4358',
  person1:     'https://framerusercontent.com/images/9gm12rZwwXI6LcagsAfqgSAYLJU.jpg?scale-down-to=1024&width=2400&height=1600',
  person2:     'https://framerusercontent.com/images/JNF6ehK6QCuGgpXd9YNG6ERIRHA.jpg?scale-down-to=1024&width=3024&height=1990',
  logo1:       'https://framerusercontent.com/images/hwoLf3wYDppXocE2aAmDHfggk.png?width=1560&height=1560',
  logo2:       'https://framerusercontent.com/images/VxleX3JynR6sWxI3JyqGDh0YI.png?lossless=1&width=1560&height=1560',
  logo3:       'https://framerusercontent.com/images/51nJHt0gduvuefwpixxXden3zkU.png?width=1560&height=1560',
  logo4:       'https://framerusercontent.com/images/o350xL6ITazPV7ORFy37HtwvV0.png?width=1560&height=1560',
  logo5:       'https://framerusercontent.com/images/WHQZJy960BK8OlFAEot1CpW44QE.png?scale-down-to=512&width=2080&height=2080',
  logo6:       'https://framerusercontent.com/images/iDatCSbuHdXichckvmQZPRgGOtw.png?scale-down-to=512&width=2080&height=2080',
  logo7:       'https://framerusercontent.com/images/YAVSfthtZ6rCGU30lxFwontOkU.png?scale-down-to=512&width=2080&height=2080',
  logo8:       'https://framerusercontent.com/images/WTmmBHdaOrsCQzRCljOojafr2U.png?width=1992&height=1992',
  icon1:       'https://framerusercontent.com/images/P6IHUcEYNqv1ONhK22AWcLxz1fk.png?scale-down-to=512&width=2400&height=2400',
  icon2:       'https://framerusercontent.com/images/1hVX9EHxwT3Ye99XoqWmVOsw8o.png?scale-down-to=512&width=1040&height=1040',
  icon3:       'https://framerusercontent.com/images/pjr2IQ1oDDS9j0svWPEsZcLOk.png?scale-down-to=512&width=1040&height=1040',
  icon4:       'https://framerusercontent.com/images/tPzypYczrepl9SNLzrR4Tmx6lk.png?width=1040&height=1040',
  dunaLogo:    'https://framerusercontent.com/images/NE8JsjXIjzJVlyyyktYN06ZoPY.png',
  ogImage:     'https://framerusercontent.com/images/R0DdHhOBgKcuDCdUZPBqDoSyc.jpg',
}

// ─── Pre-computed bar visualizer data ────────────────────────────────────────
const NOISY_H  = [72,28,85,15,68,42,90,22,78,35,92,18,60,48,88,12,75,32,82,25,95,20,65,38,80,15,70,45,88,8,75,30]
const NOISY_SP = [0.4,0.7,0.3,0.8,0.5,0.4,0.6,0.9,0.3,0.7,0.4,0.8,0.5,0.6,0.3,0.7,0.4,0.8,0.5,0.3,0.6,0.9,0.4,0.7,0.3,0.8,0.5,0.4,0.7,0.9,0.3,0.6]
const CLEAN_H  = [50,40,28,18,12,18,28,40,50,62,72,79,82,79,72,62,50,40,28,18,12,18,28,40,50,62,72,79,82,79,72,62]
const CLEAN_SP = [1.8,1.9,2.0,1.9,1.8,1.9,2.0,1.9,1.8,1.9,2.0,1.9,2.1,1.9,2.0,1.9,1.8,1.9,2.0,1.9,1.8,1.9,2.0,1.9,1.8,1.9,2.0,2.1,1.8,1.9,2.0,1.9]

// ─── Benchmark chart data — STT model WER comparison ─────────────────────────
const STT_MODELS = [
  { model: 'AssemblyAI Universal-2', raw: 27.2, arctan: 14.3 },
  { model: 'Cartesia Ink-Whisper',   raw: 28.3, arctan: 13.0 },
  { model: 'Deepgram Nova 3',        raw: 24.1, arctan: 11.5 },
  { model: 'Soniox STT Async v4',    raw: 27.1, arctan:  8.9 },
  { model: 'Speechmatics',           raw: 25.9, arctan:  8.7 },
]
const BENCH_MAX = 35 // normalisation ceiling (px above max raw value)

export default function LandingPage() {
  const [scrolled, setScrolled]       = useState(false)
  const [mounted, setMounted]         = useState(false)
  const [barsVisible, setBarsVisible] = useState(false)
  const benchmarkRef                  = useRef<HTMLDivElement>(null)

  // Scroll-sequence (Shopify-style)
  const seqSectionRef  = useRef<HTMLDivElement>(null)
  const seqPinRef      = useRef<HTMLDivElement>(null)
  const seqCanvasRef   = useRef<HTMLCanvasElement>(null)
  const seqOverlayRef  = useRef<HTMLDivElement>(null)
  const seqHeadRef        = useRef<HTMLHeadingElement>(null)
  const seqSubRef         = useRef<HTMLParagraphElement>(null)
  const seqCtaRef         = useRef<HTMLAnchorElement>(null)
  const seqExtraScrollRef = useRef(2640) // kept in sync by seq useEffect

  // Wave comparison canvases
  const noisyCanvasRef = useRef<HTMLCanvasElement>(null)
  const cleanCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
    // Nav becomes visible only AFTER the hero scroll section is fully done
    const fn = () => setScrolled(window.scrollY > seqExtraScrollRef.current)
    window.addEventListener('scroll', fn, { passive: true })
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setBarsVisible(true) },
      { threshold: 0.25 }
    )
    if (benchmarkRef.current) obs.observe(benchmarkRef.current)
    return () => { window.removeEventListener('scroll', fn); obs.disconnect() }
  }, [])

  // ── Scroll image-sequence: CSS sticky + rAF scroll listener (no CDN) ──────
  useEffect(() => {
    const FRAME_NUMS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25]
    const TOTAL        = FRAME_NUMS.length   // 24 frames
    const PX_PER_FRAME = 55                  // fast: full sequence in ~1320px scroll
    const EXTRA_SCROLL = TOTAL * PX_PER_FRAME // 1320 px
    seqExtraScrollRef.current = EXTRA_SCROLL  // keep nav threshold in sync

    const section = seqSectionRef.current
    const canvas  = seqCanvasRef.current
    if (!section || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas to exactly fill the viewport (for full-bleed cover rendering)
    const sizeCanvas = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Give the section its tall height so sticky has room to work
    const applyHeight = () => {
      section.style.height = `${window.innerHeight + EXTRA_SCROLL}px`
    }
    sizeCanvas()
    applyHeight()

    const images: HTMLImageElement[] = new Array(TOTAL)
    let loadedCount  = 0
    let currentFrame = -1
    let raf          = 0

    // Draw frame scaled to cover the full canvas (object-fit: cover behaviour)
    const drawFrame = (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, TOTAL - 1))
      if (clamped === currentFrame) return
      const img = images[clamped]
      if (!img?.complete) return
      const cW = canvas.width, cH = canvas.height
      const iW = img.naturalWidth, iH = img.naturalHeight
      // Cover: find scale that fills both dimensions, then centre
      const scale = Math.max(cW / iW, cH / iH)
      const dW = iW * scale, dH = iH * scale
      const dx = (cW - dW) / 2, dy = (cH - dH) / 2
      ctx.clearRect(0, 0, cW, cH)
      ctx.drawImage(img, dx, dy, dW, dH)
      currentFrame = clamped
    }

    const update = () => {
      const scrolledIn = Math.max(0, -section.getBoundingClientRect().top)
      const progress   = Math.min(1, scrolledIn / EXTRA_SCROLL)

      // Advance image sequence
      drawFrame(Math.round(progress * (TOTAL - 1)))

      // Scroll-staged reveals — all three rise from bottom one by one:
      // Phase 1 (0→0.33):  heading  rises from bottom of viewport to centre (always visible)
      // Phase 2 (0.33→0.66): subtitle rises from 80px below centre
      // Phase 3 (0.66→1.0): CTA button rises from 80px below centre
      const RISE = 80 // px for sub + cta
      const HEAD_RISE = window.innerHeight * 0.38 // heading starts ~38% below centre (closer to bottom)
      const head = seqHeadRef.current
      if (head) {
        const t = Math.min(1, Math.max(0, progress / 0.33))
        head.style.opacity = '1' // always visible
        head.style.transform = `translateY(${(1 - t) * HEAD_RISE}px)`
      }
      const sub = seqSubRef.current
      if (sub) {
        const t = Math.min(1, Math.max(0, (progress - 0.33) / 0.33))
        sub.style.opacity = String(t)
        sub.style.transform = `translateY(${(1 - t) * RISE}px)`
      }
      const cta = seqCtaRef.current
      if (cta) {
        const t = Math.min(1, Math.max(0, (progress - 0.66) / 0.34))
        cta.style.opacity = String(t)
        cta.style.transform = `translateY(${(1 - t) * RISE}px)`
      }
    }

    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    const onResize = () => { sizeCanvas(); applyHeight(); drawFrame(currentFrame < 0 ? 0 : currentFrame); update() }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    // Preload all frames
    FRAME_NUMS.forEach((n, i) => {
      const img = new Image()
      img.onload = () => {
        images[i] = img
        loadedCount++
        if (loadedCount === TOTAL) { drawFrame(0); update() }
      }
      img.src = `/frames/${n}.png`
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  // ── Wave comparison animation ────────────────────────────────────────────
  useEffect(() => {
    const nc = noisyCanvasRef.current
    const cc = cleanCanvasRef.current
    if (!nc || !cc) return
    const nCtx = nc.getContext('2d')
    const cCtx = cc.getContext('2d')
    if (!nCtx || !cCtx) return

    // Fix canvas internal resolution to match CSS size
    const W = 800, H = 200
    nc.width = W; nc.height = H
    cc.width = W; cc.height = H

    let t = 0
    let raf = 0

    // Noisy layers — Duna warm-white muted tones (no red), phase subtracted so wave travels left → right
    const NOISY = [
      { freq: 0.018, amp: 0.30, phaseOff: 0.0,  speed: 1.0, alpha: 0.52 },
      { freq: 0.033, amp: 0.20, phaseOff: 2.1,  speed: 1.5, alpha: 0.32 },
      { freq: 0.013, amp: 0.24, phaseOff: 4.3,  speed: 0.65, alpha: 0.24 },
      { freq: 0.026, amp: 0.13, phaseOff: 1.5,  speed: 2.0, alpha: 0.16 },
    ]

    const drawLine = (
      ctx: CanvasRenderingContext2D,
      freq: number, amp: number, phase: number,
      color: string, width: number, blur = 0
    ) => {
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth   = width
      ctx.lineJoin    = 'round'
      if (blur) { ctx.shadowBlur = blur; ctx.shadowColor = color }
      for (let x = 0; x <= W; x += 2) {
        const y = H / 2 + Math.sin(x * freq + phase) * H * amp
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()
    }

    const frame = () => {
      t += 0.016

      // — Left: noisy multi-wave in muted Duna cream (phase subtracted = left→right travel) ——
      nCtx.clearRect(0, 0, W, H)
      NOISY.forEach(({ freq, amp, phaseOff, speed, alpha }) => {
        drawLine(nCtx, freq, amp, phaseOff - t * speed,
          `rgba(255,252,245,${alpha})`, 2)
      })

      // — Right: single clean sine in Duna lime, no glow (left→right travel) ——————
      cCtx.clearRect(0, 0, W, H)
      drawLine(cCtx, 0.020, 0.26, -(t * 0.80),
        '#1A8A70', 2, 0)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const navScrolled = mounted && scrolled

  return (
    <>
      {/* GT America is loaded via @font-face in the style block below */}
      <style suppressHydrationWarning>{`
        /* ── GT America fonts — loaded direct from Duna's Framer CDN ── */
        @font-face {
          font-family: "GT America Regular";
          src: url("https://framerusercontent.com/assets/P3OjLjGu6v81n98w2gJu394bcVY.woff2") format("woff2");
          font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "GT America Regular Placeholder";
          src: local("Arial");
          font-weight: 400; font-style: normal;
        }
        @font-face {
          font-family: "GT America Trial Md";
          src: url("https://framerusercontent.com/assets/vj1ePfzjNhdO4y4kOKfTXMmk9Q.woff2") format("woff2");
          font-weight: 500; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "GT America Trial Md Placeholder";
          src: local("Arial");
          font-weight: 500; font-style: normal;
        }
        @font-face {
          font-family: "Fragment Mono";
          src: url("https://fonts.gstatic.com/s/fragmentmono/v7/4iCr6Kp1eZB6yIAuCzlt_y.woff2") format("woff2");
          font-weight: 400; font-style: normal; font-display: swap;
        }
        @import url('https://fonts.googleapis.com/css2?family=Fragment+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; }
        img { display: block; }
        input, select, textarea { outline: none; font-family: inherit; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }

        /* ── Animations ────────────────────────── */
        @keyframes noisyBeat {
          0%,100% { transform: scaleY(1); opacity: 0.85; }
          50%     { transform: scaleY(0.08); opacity: 0.3; }
        }
        @keyframes cleanBeat {
          0%,100% { transform: scaleY(1); opacity: 0.9; }
          50%     { transform: scaleY(0.45); opacity: 0.7; }
        }
        @keyframes arcGlow {
          0%,100% { box-shadow: 0 0 24px rgba(174,236,29,0.35); }
          50%     { box-shadow: 0 0 56px rgba(174,236,29,0.8), 0 0 90px rgba(174,236,29,0.25); }
        }
        @keyframes signalFlow {
          0%   { left: -8px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: calc(100% + 8px); opacity: 0; }
        }
        @keyframes scanLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* ── How it works animations ── */
        @keyframes pipelineSignal {
          0%   { left: -6px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: calc(100% + 6px); opacity: 0; }
        }
        @keyframes nodeGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(174,236,29,0); }
          50%     { box-shadow: 0 0 0 6px rgba(174,236,29,0.10), 0 0 24px rgba(174,236,29,0.07); }
        }
        @keyframes classForward {
          0%,100% { opacity: 0.55; transform: translateX(0); }
          50%     { opacity: 1; transform: translateX(3px); }
        }
        @keyframes dotPulse {
          0%,100% { transform: scale(1); opacity: 0.6; }
          50%     { transform: scale(1.5); opacity: 1; }
        }
        /* ── Scroll-sequence section: full-bleed background, text overlay ── */
        .seq-section {
          position: relative;
          /* height set by JS: 100vh + EXTRA_SCROLL */
        }
        .seq-pin {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          background: #e9e4da; /* cream fallback while frames load */
        }
        /* Canvas covers 100% as background */
        .seq-bg-canvas {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: block;
        }
        /* Text overlay — full-bleed container; inner div matches nav max-width */
        .seq-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: center;
          pointer-events: none;
        }
        /* Inner wrapper aligns left edge with nav logo (max-width 1200, padding 40px) */
        .seq-overlay-inner {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .seq-overlay a { pointer-events: auto; }
        /* ── Heading: GT America Md bold display — visible at bottom, rises to centre on scroll ── */
        .seq-heading {
          font-family: "GT America Trial Md", "GT America Trial Md Placeholder", sans-serif;
          font-weight: 700;
          font-size: clamp(40px, 6.2vw, 92px);
          letter-spacing: -0.04em;
          line-height: 1.0em;
          color: #222221;
          margin: 0 0 32px;
          opacity: 1;
          transform: translateY(38vh);
          will-change: opacity, transform;
          text-shadow: 0 0 40px rgba(255,255,255,0.9), 0 0 80px rgba(255,255,255,0.6);
        }
        /* Body: Duna.com hero subtitle style — GT America Regular 17px / 1.5 lh */
        .seq-sub {
          font-family: "GT America Regular", "GT America Regular Placeholder", sans-serif;
          font-weight: 400;
          font-size: 24px;
          letter-spacing: -0.01em;
          line-height: 1.4em;
          color: rgba(34,34,33,0.65);
          max-width: 460px;
          margin: 0 0 36px;
          opacity: 0;
          transform: translateY(80px);
          will-change: opacity, transform;
          text-shadow: 0 0 30px rgba(255,255,255,0.95), 0 0 60px rgba(255,255,255,0.7);
        }
        /* CTA: starts hidden, rises from bottom on third scroll phase */
        .seq-cta {
          opacity: 0;
          transform: translateY(80px);
          will-change: opacity, transform;
        }
        @media (max-width: 768px) {
          .seq-overlay-inner { padding: 0 20px !important; }
          .seq-heading { font-size: clamp(32px, 9vw, 56px) !important; letter-spacing: -0.03em !important; }
          .seq-sub { font-size: 18px !important; }
        }

        /* ── Benchmark section ─────────────────────────────────────────── */
        .bench-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          align-items: center;
          gap: 28px;
          padding: 22px 0;
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        .bench-track {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }
        .bench-fill {
          height: 100%;
          border-radius: 4px;
          width: 0%;
          transition: width 0.95s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bench-fill-arctan {
          animation: arctan-shimmer 2.8s ease-in-out infinite;
          animation-play-state: paused;
        }
        .bench-fill-arctan.bars-ready {
          animation-play-state: running;
        }
        @keyframes arctan-shimmer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.72; }
        }
        @media (max-width: 768px) {
          /* stack the model name above its bars, both full-width */
          .bench-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            padding: 18px 0 !important;
          }
          .bench-model-label { grid-column: 1 / -1; }
          .bench-bars-col    { grid-column: 1 / -1; }
        }

        /* ── Stream / signal-isolation animation ──────────────────────── */
        .streamWave     { animation-name: streamOscillate; animation-timing-function: ease-in-out; animation-iteration-count: infinite; will-change: transform; transform-box: fill-box; transform-origin: center; }
        .streamWaveMain { animation-name: streamOscillateMain; animation-timing-function: ease-in-out; animation-iteration-count: infinite; will-change: transform; animation-duration: 7.6s; transform-box: fill-box; transform-origin: center; }
        @keyframes streamOscillate {
          0%,100% { transform: scaleY(0.62); }
          50%     { transform: scaleY(1.38); }
        }
        @keyframes streamOscillateMain {
          0%,100% { transform: scaleY(0.82); }
          50%     { transform: scaleY(1.18); }
        }
        .arctanGlow {
          transform-box: fill-box; transform-origin: center;
          animation: arctanPulse 3.4s ease-in-out infinite;
        }
        @keyframes arctanPulse {
          0%,100% { opacity: 0.16; transform: scale(1); }
          50%     { opacity: 0.34; transform: scale(1.09); }
        }
        @media (prefers-reduced-motion: reduce) {
          .streamWave, .streamWaveMain, .arctanGlow { animation: none; }
        }

        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ═══════════════════════════════════════
           RESPONSIVE — mobile breakpoints
           All !important needed to override inline styles
        ═══════════════════════════════════════ */
        @media (max-width: 768px) {
          /* Nav */
          .rsp-nav-inner   { padding: 0 20px !important; }
          .rsp-nav-links   { display: none !important; }
          .rsp-nav-contact { display: none !important; }

          /* Stats */
          .rsp-section     { padding: 60px 20px !important; }
          .rsp-stats-grid  { grid-template-columns: repeat(2,1fr) !important; gap: 28px !important; }
          .rsp-stats-num   { font-size: 52px !important; }
          .rsp-stats-h2    { font-size: 30px !important; margin-bottom: 40px !important; }

          /* Wave comparison: stack panels */
          .rsp-wave-section          { padding: 60px 20px !important; }
          .rsp-wave-grid             { grid-template-columns: 1fr !important; }
          .rsp-wave-panel-right      { border-right: none !important; border-top: 1px solid rgba(255,252,245,0.08) !important; }

          /* How it works */
          .rsp-hiw-section  { padding: 60px 20px !important; }
          .rsp-hiw-head     { margin-bottom: 40px !important; }
          .rsp-hiw-h2       { font-size: 28px !important; }
          .rsp-hiw-card     { padding: 24px 16px 20px !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-flow-row     { min-width: 620px; }

          /* Integration */
          .rsp-intg-section { padding: 60px 20px !important; }
          .rsp-intg-grid    { grid-template-columns: 1fr !important; gap: 40px !important; }
          .rsp-intg-h2      { font-size: 28px !important; }
          .rsp-code-wrap    { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-code-inner   { padding: 18px !important; font-size: 11px !important; }

          /* Safe & Secure */
          .rsp-safe-section { padding: 48px 20px !important; }
          .rsp-safe-grid    { grid-template-columns: 1fr !important; gap: 36px !important; }
          .rsp-safe-h2      { font-size: 26px !important; }
          .rsp-safe-grid > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.1) !important; padding-right: 0 !important; padding-bottom: 36px !important; }
          .rsp-cert-flex    { padding-left: 0 !important; justify-content: flex-start !important; gap: 28px !important; }

          /* Contact */
          .rsp-contact-section { padding: 60px 20px !important; }
          .rsp-contact-grid    { grid-template-columns: 1fr !important; gap: 48px !important; }
          .rsp-contact-h2      { font-size: 30px !important; }

          /* Footer */
          .rsp-footer          { padding: 48px 20px 32px !important; }
          .rsp-footer-grid     { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .rsp-footer-bottom   { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .rsp-footer-legal    { flex-wrap: wrap !important; gap: 12px !important; }

          /* Stream / signal-isolation diagram */
          .rsp-stream-section { padding: 60px 20px !important; }
          .rsp-stream-head    { margin-bottom: 36px !important; }
          .rsp-stream-h2      { font-size: 30px !important; }
          .rsp-stream-svg     { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-stream-svg svg { min-width: 680px; }

          /* Benchmark */
          .rsp-bench-section  { padding: 60px 20px !important; }
          .rsp-bench-h2       { font-size: 30px !important; }
        }

        /* ── Tablet (769–1024): trim padding, stack 2-col layouts built for ~1100px ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .rsp-section, .rsp-hiw-section, .rsp-intg-section, .rsp-safe-section,
          .rsp-contact-section, .rsp-stream-section, .rsp-bench-section, .rsp-wave-section {
            padding-top: 76px !important; padding-bottom: 76px !important;
          }
          .rsp-stats-h2, .rsp-stream-h2, .rsp-bench-h2, .rsp-hiw-h2,
          .rsp-intg-h2, .rsp-safe-h2, .rsp-contact-h2 { font-size: 38px !important; }

          /* stack 2-col grids so nothing overflows the narrower tablet width */
          .rsp-intg-grid, .rsp-safe-grid, .rsp-contact-grid, .rsp-wave-grid {
            grid-template-columns: 1fr !important; gap: 48px !important;
          }
          .rsp-wave-panel-right { border-right: none !important; border-top: 1px solid rgba(255,252,245,0.08) !important; }

          /* horizontally scroll wide diagrams/code rather than overflow the page */
          .rsp-hiw-card    { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-flow-row    { min-width: 620px; }
          .rsp-code-wrap   { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-stream-svg     { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-stream-svg svg { min-width: 820px; }
        }
      `}</style>

      <div style={{ fontFamily: GTA, color: D.ink, background: D.white }}>

        {/* ══════ NAV — mirrors Duna nav: transparent → white blur on scroll ══════ */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          background: navScrolled ? 'rgba(255,255,255,0.10)' : 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: '1px solid transparent',
          transition: 'background 0.4s ease',
        }}>
          <div className="rsp-nav-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={IMG.dunaLogo} alt="Arctan" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }}/>
              <span style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', color: D.heading }}>arctan</span>
            </a>
            <div className="rsp-nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {[
                { label: 'Product',  href: '#' },
                { label: 'Docs',     href: '#' },
                { label: 'Pricing',  href: '#' },
                { label: 'Company',  href: '#' },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, color: D.inkSub, transition: 'opacity 0.15s' }}>{label}</a>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a href="#contact" className="rsp-nav-contact" style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, color: D.inkSub }}>Contact</a>
              <a href="#contact" style={{ padding: '9px 22px', borderRadius: 9999, background: '#18160d', color: '#ffffff', fontFamily: GTA, fontWeight: 400, fontSize: 15 }}>
                Get early access
              </a>
            </div>
          </div>
        </nav>

        {/* ══════ SCROLL SEQUENCE — Shopify Winter 2026 "developer" style
              Full-bleed canvas background + text overlay, CSS sticky, rAF scroll ══════ */}
        <div ref={seqSectionRef} className="seq-section">
          <div ref={seqPinRef} className="seq-pin">

            {/* Full-bleed background canvas */}
            <canvas ref={seqCanvasRef} className="seq-bg-canvas" />

            {/* Text overlay — full-bleed; inner div aligns with nav logo */}
            <div ref={seqOverlayRef} className="seq-overlay">
              <div className="seq-overlay-inner">
                {/* Heading — rises from bottom on first scroll phase */}
                <h1 ref={seqHeadRef} className="seq-heading">
                  <span style={{ color: '#1A8A70' }}>Clear</span> Speech<br/>for your<br/>Voice Agents
                </h1>

                {/* Description — hidden initially, JS fades in on second scroll phase */}
                <p ref={seqSubRef} className="seq-sub">
                  Voice AI breaks in the real world.<br/>
                  Background Noises. Side Talks. Mumbles.<br/>
                  We fix that.
                </p>

                {/* CTA — hidden initially, JS fades in on third scroll phase */}
                <a ref={seqCtaRef} href="#contact" className="seq-cta" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '12px 28px', borderRadius: 9999,
                  background: '#18160d', color: '#ffffff',
                  fontFamily: GTA, fontSize: 16, fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}>
                  Get early access
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ══════ LOGO STRIP — exact match of Duna "Built for businesses where compliance matters"
              White bg, small centered label, continuous scrolling ticker (duplicated for seamless loop)
              Natural dims: creed 272×160 | ikarus 120×80 | grssl 432×98 | diverseline 320×80
              Heights at ~38px for icon logos, ~28px for wordmarks ══════ */}
        <div style={{ background: D.white, padding: '40px 0 44px', borderBottom: `1px solid ${D.border}`, overflow: 'hidden' }}>
          <p style={{
            fontFamily: GTA, textAlign: 'center' as const,
            fontSize: 14, fontWeight: 400, letterSpacing: '-0.01em',
            color: D.muted, marginBottom: 32,
          }}>
          </p>
          {/* Seamless continuous ticker — 6 identical sets of 4 logos.
              Total width ≈ 6 × 780px = 4680px. translateX(-50%) = -2340px = 3 sets.
              At any scroll position the visible ~1440px is always filled. */}
          <div style={{ overflow: 'hidden', userSelect: 'none' as const }}>
            <div style={{
              display: 'flex', alignItems: 'center', flexShrink: 0, width: 'max-content',
              animation: 'tickerScroll 32s linear infinite',
            }}>
              {Array(6).fill(null).flatMap((_, rep) =>
                ([
                  { src: '/logos/iccs.jpeg',         alt: 'ICCS',                  w: 160, h: 60 },
                  { src: '/logos/megaaopes.svg',     alt: 'Megaaopes',             w: 42,  h: 42 },
                  { src: '/logos/creed.avif',        alt: 'Creed Infotech',        w: 130, h: 38 },
                  { src: '/logos/ikarus.avif',       alt: 'Ikarus 3D',             w: 88,  h: 42 },
                  { src: '/logos/grssl.avif',        alt: 'Grassroots',            w: 130, h: 32 },
                  { src: '/logos/diverseline.avif',  alt: 'Diverse Line Impex',    w: 152, h: 38 },
                ] as const).map(({ src, alt, w, h }) => (
                  <img
                    key={`${rep}-${alt}`}
                    src={src}
                    alt={alt}
                    style={{
                      width: w, height: h,
                      objectFit: 'contain' as const,
                      flexShrink: 0,
                      filter: 'grayscale(1)',
                      opacity: 0.38,
                      marginRight: 96,
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ══════ STATS — exact match of Duna "Designed to convert. Built to scale."
              Background: WHITE #FFFFFF (confirmed from duna.com)
              H2: 44px GT America Regular weight 400 letter-spacing -0.05em — left-aligned
              Numbers: GT America Trial Md 80px weight 500 letter-spacing 0 color #000
              3-col grid: col 1 gets 2px lime top border, cols 2-3 get 1px hairline
              Content: 57% → 20ms → 90% (user-specified order) ══════ */}
        <section className="rsp-section" style={{ background: D.white, padding: '100px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Heading — left-aligned, mirrors Duna's "Designed to convert.\nBuilt to scale." */}
            <div style={{ marginBottom: 80 }}>
              <h2 className="rsp-stats-h2" style={{
                fontFamily: GTA,
                fontSize: 44, fontWeight: 400,
                letterSpacing: '-0.05em', lineHeight: '1.1em',
                fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on',
                color: D.ink,
              }}>
                Better Audio.<br/>Better <span style={{ color: '#1A8A70' }}>Outcomes.</span>
              </h2>
            </div>

            {/* 3-col metric grid — first col: 2px lime top border; cols 2-3: 1px hairline */}
            <div className="rsp-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
              {[
                { n: '57',  suffix: '%',  label: 'Reduction in WER' },
                { n: '10',  suffix: 'ms', label: 'Latency' },
                { n: '90',  suffix: '%',  label: 'Fewer wasted LLM calls' },
              ].map((s, i) => (
                <div key={i} style={{
                  paddingTop: 40,
                  borderTop: `1px solid ${D.border}`,
                }}>
                  {/* Large stat — number full size, suffix half size */}
                  <div className="rsp-stats-num" style={{
                    fontFamily: GTA_MD,
                    fontSize: 80, fontWeight: 500,
                    letterSpacing: '0em', lineHeight: '1em',
                    fontFeatureSettings: "'zero' on, 'tnum' on",
                    color: D.darkPure,
                    marginBottom: 20,
                  }}>
                    {s.n}<span style={{ fontSize: 40, verticalAlign: 'baseline', letterSpacing: '-0.01em' }}>{s.suffix}</span>
                  </div>

                  {/* Stat label */}
                  <div style={{
                    fontFamily: GTA, fontSize: 16, fontWeight: 400,
                    letterSpacing: '-0.01em', lineHeight: '1.4em',
                    color: D.ink,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ STREAM PROCESSING ANIMATION — How Arctan works ══════ */}
        <section className="rsp-stream-section" style={{ background: D.offWhite, padding: '100px 40px', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Header */}
            <div className="rsp-stream-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 80, flexWrap: 'wrap', gap: 32 }}>
              <div>
                <div style={{ fontFamily: GTA, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: D.teal, marginBottom: 18 }}>
                  Signal Intelligence
                </div>
                <h2 className="rsp-stream-h2" style={{ fontFamily: GTA, fontWeight: 400, fontSize: 44, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: D.ink, margin: 0 }}>
                  <span style={{ color: '#1A8A70' }}>Multiple</span> voices.<br/>Only the Primary speaker gets through.
                </h2>
              </div>
            </div>

            {/* Stream animation — scrolls horizontally on small screens to stay legible */}
            <div className="rsp-stream-svg" style={{ width: '100%', overflow: 'hidden' }}>
              <svg
                viewBox="0 0 1000 360"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', display: 'block' }}
              >
                <defs>
                  <clipPath id="arctanLogoClip"><rect x="432" y="162" width="36" height="36" rx="8" /></clipPath>
                </defs>

                {/* ════════════════ INPUT — noisy overlapping waves (bob vertically) ════════════════ */}

                {/* ── BACKGROUND NOISE (equalizer-bar symbols) ── */}
                <g className="streamWave" style={{ animationDuration: '6.5s', animationDelay: '-0.5s' }}>
                  <path id="wBg" d="M -260,70 C -170,70 -90,70 -30,70 C 10,70 24,50 56,58 C 92,66 96,98 132,92 C 172,86 178,122 214,130 C 256,139 286,152 326,164 C 360,173 388,180 412,180"
                        fill="none" stroke="rgba(27,6,36,0.16)" strokeWidth="1" strokeDasharray="4 5" />
                  <text x="6" y="56" fontFamily="'Fragment Mono', monospace" fontSize="9" letterSpacing="0.07em" fill="rgba(27,6,36,0.40)">BACKGROUND NOISE</text>
                  {['0s', '2.2s', '4.4s'].map((b, k) => (
                    <g key={k} opacity="0">
                      <g fill="none" stroke="rgba(27,6,36,0.42)" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="-7.5" y1="3"   x2="-7.5" y2="-3" />
                        <line x1="-2.5" y1="6"   x2="-2.5" y2="-6" />
                        <line x1="2.5"  y1="7.5" x2="2.5"  y2="-7.5" />
                        <line x1="7.5"  y1="4.5" x2="7.5"  y2="-4.5" />
                      </g>
                      <animateMotion dur="6.6s" begin={b} repeatCount="indefinite" calcMode="linear"><mpath href="#wBg" /></animateMotion>
                      <animate attributeName="opacity" to="0.85" begin={b} dur="0.01s" fill="freeze" />
                    </g>
                  ))}
                </g>

                {/* ── CROSS-TALK (overlapping speech bubbles) ── */}
                <g className="streamWave" style={{ animationDuration: '7.3s', animationDelay: '-2.0s' }}>
                  <path id="wCross" d="M -260,118 C -170,118 -90,118 -30,118 C 6,118 20,138 52,132 C 90,124 100,96 138,102 C 178,108 188,140 226,148 C 264,154 292,162 330,168 C 362,172 388,180 412,180"
                        fill="none" stroke="rgba(27,6,36,0.16)" strokeWidth="1" strokeDasharray="4 5" />
                  <text x="6" y="104" fontFamily="'Fragment Mono', monospace" fontSize="9" letterSpacing="0.07em" fill="rgba(27,6,36,0.40)">CROSS-TALK</text>
                  {['0.8s', '3.2s', '5.6s'].map((b, k) => (
                    <g key={k} opacity="0">
                      <g fill="none" stroke="rgba(27,6,36,0.42)" strokeWidth="1.4">
                        <rect x="-9" y="-6" width="11" height="8" rx="2.5" />
                        <rect x="-1" y="-1" width="11" height="8" rx="2.5" />
                      </g>
                      <animateMotion dur="7.2s" begin={b} repeatCount="indefinite" calcMode="linear"><mpath href="#wCross" /></animateMotion>
                      <animate attributeName="opacity" to="0.8" begin={b} dur="0.01s" fill="freeze" />
                    </g>
                  ))}
                </g>

                {/* ── MURMUR (tilde squiggle + dot) ── */}
                <g className="streamWave" style={{ animationDuration: '8.1s', animationDelay: '-3.4s' }}>
                  <path id="wMur" d="M -260,248 C -170,248 -90,248 -30,248 C 8,248 22,268 54,260 C 92,252 100,226 138,232 C 178,238 188,212 226,204 C 264,196 296,188 330,184 C 362,182 388,181 412,180"
                        fill="none" stroke="rgba(27,6,36,0.16)" strokeWidth="1" strokeDasharray="4 5" />
                  <text x="6" y="234" fontFamily="'Fragment Mono', monospace" fontSize="9" letterSpacing="0.07em" fill="rgba(27,6,36,0.40)">MURMUR</text>
                  {['0.4s', '3.0s', '5.6s'].map((b, k) => (
                    <g key={k} opacity="0">
                      <path d="M -9,0 q 4.5,-6 9,0 q 4.5,6 9,0" fill="none" stroke="rgba(27,6,36,0.42)" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="13" cy="0" r="1.4" fill="rgba(27,6,36,0.42)" />
                      <animateMotion dur="7.6s" begin={b} repeatCount="indefinite" calcMode="linear"><mpath href="#wMur" /></animateMotion>
                      <animate attributeName="opacity" to="0.8" begin={b} dur="0.01s" fill="freeze" />
                    </g>
                  ))}
                </g>

                {/* ── ECHO (concentric arcs) ── */}
                <g className="streamWave" style={{ animationDuration: '9.0s', animationDelay: '-5.1s' }}>
                  <path id="wEcho" d="M -260,298 C -170,298 -90,298 -30,298 C 8,298 24,276 56,284 C 94,292 104,318 142,312 C 182,306 192,272 230,258 C 268,244 298,206 332,192 C 362,182 388,181 412,180"
                        fill="none" stroke="rgba(27,6,36,0.16)" strokeWidth="1" strokeDasharray="4 5" />
                  <text x="6" y="284" fontFamily="'Fragment Mono', monospace" fontSize="9" letterSpacing="0.07em" fill="rgba(27,6,36,0.40)">ECHO</text>
                  {['1.4s', '4.0s', '6.6s'].map((b, k) => (
                    <g key={k} opacity="0">
                      <g fill="none" stroke="rgba(27,6,36,0.42)" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M -3,-5 A 6 6 0 0 1 -3,5" />
                        <path d="M 1,-7 A 8.5 8.5 0 0 1 1,7" />
                        <path d="M 5,-9 A 11 11 0 0 1 5,9" />
                      </g>
                      <animateMotion dur="8.0s" begin={b} repeatCount="indefinite" calcMode="linear"><mpath href="#wEcho" /></animateMotion>
                      <animate attributeName="opacity" to="0.78" begin={b} dur="0.01s" fill="freeze" />
                    </g>
                  ))}
                </g>

                {/* ── SPEAKER VOICE — solid, prominent; carries the real phrase ── */}
                <g className="streamWaveMain" style={{ animationDelay: '-1.0s' }}>
                  <path id="wMain" d="M -260,180 C -120,164 -20,196 60,182 C 160,166 250,170 330,182 C 366,186 388,181 412,180"
                        fill="none" stroke={D.ink} strokeWidth="1.75" opacity="0.6" />
                  <text x="6" y="166" fontFamily="'Fragment Mono', monospace" fontSize="9" fontWeight="600" letterSpacing="0.06em" fill={D.ink}>PRIMARY SPEAKER</text>
                  <text fontSize="15.5" fontWeight="600" letterSpacing="-0.025em" fill={D.ink} fontFamily="sans-serif">
                    <textPath href="#wMain" startOffset="-34%">
                      What is my order status?
                      <animate attributeName="startOffset" values="-34%;114%" dur="9s" begin="0s" repeatCount="indefinite" calcMode="linear" />
                    </textPath>
                  </text>
                </g>

                {/* ════════════════ OUTPUT — clean single line into the agent ════════════════ */}
                <line x1="494" y1="180" x2="744" y2="180" stroke={D.ink} strokeWidth="1.75" opacity="0.5" />
                {/* single clean phrase, repeating — vanishes exactly at the agent box edge */}
                <text fontSize="15.5" fontWeight="600" letterSpacing="-0.025em" fill={D.ink} fontFamily="sans-serif">
                  <textPath href="#oClean" startOffset="-36%">
                    What is my order status?
                    <animate attributeName="startOffset" values="-36%;112%" dur="3.3s" begin="0.8s" repeatCount="indefinite" calcMode="linear" />
                  </textPath>
                </text>
                {/* output text path: ends exactly at the agent box edge so words vanish "into" it */}
                <path id="oClean" d="M 494,180 L 744,180" fill="none" stroke="none" />

                {/* ════════════════ ARCTAN — speech-enhancement node (on top, absorbs noise) ════════════════ */}
                <circle className="arctanGlow" cx="450" cy="180" r="58" fill={D.lime} opacity="0.2" />
                <circle cx="450" cy="180" r="42" fill={D.white} stroke="rgba(27,6,36,0.10)" strokeWidth="1" />
                <circle cx="450" cy="180" r="42" fill="none" stroke={D.lime} strokeWidth="1.5" opacity="0.32" />
                {/* Arctan logo */}
                <image href={IMG.dunaLogo} x="432" y="162" width="36" height="36" clipPath="url(#arctanLogoClip)" preserveAspectRatio="xMidYMid slice" />
                {/* label */}
                <text x="450" y="252" textAnchor="middle" fontSize="14" fontWeight="500" letterSpacing="-0.03em" fill={D.ink} fontFamily="sans-serif">arctan</text>
                <text x="450" y="267" textAnchor="middle" fontSize="8" letterSpacing="0.12em" fill={D.muted} fontFamily="sans-serif">SPEECH ENHANCEMENT</text>

                {/* ════════════════ VOICE AGENT (the bot) ════════════════ */}
                <rect x="742" y="156" width="226" height="48" rx="24" fill={D.white} stroke="rgba(27,6,36,0.12)" strokeWidth="1" />
                {/* headset / agent glyph */}
                <g transform="translate(770,180)" fill="none" stroke={D.teal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M -7,1 a7,7 0 0 1 14,0" />
                  <rect x="-9.5" y="1" width="4.5" height="8" rx="1.8" fill={D.teal} stroke="none" />
                  <rect x="5"    y="1" width="4.5" height="8" rx="1.8" fill={D.teal} stroke="none" />
                  <path d="M 7,9 v1.5 a3,3 0 0 1 -3,3 h-2.5" />
                </g>
                <text x="790" y="181" dominantBaseline="middle" fontSize="13" fontWeight="500" letterSpacing="-0.015em" fill={D.ink} fontFamily="sans-serif">Voice Agent</text>

              </svg>
            </div>

          </div>
        </section>

        {/* ══════ SIGNAL INTELLIGENCE — HyperFrames animation ══════ */}
        <section className="rsp-stream-section" style={{ background: D.white, padding: '100px 40px', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Header */}
            <div className="rsp-stream-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 80, flexWrap: 'wrap', gap: 32 }}>
              <div>
                <div style={{ fontFamily: GTA, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: D.teal, marginBottom: 18 }}>
                  Signal Intelligence
                </div>
                <h2 className="rsp-stream-h2" style={{ fontFamily: GTA, fontWeight: 400, fontSize: 44, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: D.ink, margin: 0 }}>
                  <span style={{ color: '#1A8A70' }}>Multiple</span> voices.<br/>Only the Primary speaker gets through.
                </h2>
              </div>
            </div>

            {/* HyperFrames animation — responsive iframe wrapper */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '60.98%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 40px rgba(22,56,40,0.08)' }}>
              <iframe
                src="/arctan-stream/index.html"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Arctan Signal Intelligence animation"
                loading="lazy"
              />
            </div>

          </div>
        </section>

        {/* ══════ SDK / INTEGRATION ══════ */}
        <section className="rsp-intg-section" style={{ background: D.heroBg, padding: '100px 40px' }}>
          <div className="rsp-intg-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 11, color: D.lime, letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 20 }}>Integration</span>
              <h2 className="rsp-intg-h2" style={{ fontFamily: GTA, fontSize: 40, fontWeight: 400, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: 'white', marginBottom: 24 }}>
                <span style={{ color: '#1A8A70' }}>Native</span> in the language<br/>you ship in.
              </h2>
              <p style={{ fontFamily: GTA, fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.65em', color: 'rgba(255,255,255,0.5)', marginBottom: 36 }}>
                First-party SDKs for Node, Python, Go, and Rust. Or hit the REST endpoint directly — every feature is exposed over plain HTTP.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, marginBottom: 36 }}>
                {['Typed clients with auto-retry and backpressure','Streaming and batch modes in every SDK','Open-source under Apache 2.0'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: D.lime, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: D.heading, fontWeight: 400 }}>→</span>
                    </div>{item}
                  </div>
                ))}
              </div>
            </div>

            {/* Code block */}
            <div className="rsp-code-wrap" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.45)' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}/>)}
                </div>
                <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Python</span>
              </div>
              <div className="rsp-code-inner" style={{ padding: '28px', fontFamily: "'Fragment Mono', monospace", fontSize: 13, lineHeight: '1.9em', minWidth: 'max-content' }}>
                <div><span style={{ color: '#C792EA' }}>from</span> <span style={{ color: '#82AAFF' }}>arctan</span> <span style={{ color: '#C792EA' }}>import</span> <span style={{ color: '#FFCB6B' }}>arctan_enhancer</span></div>
                <div style={{ marginTop: 16 }}/>
                <div><span style={{ color: '#C3E88D' }}>await</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>session.start(</span></div>
                <div style={{ paddingLeft: 24 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>agent</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span><span style={{ color: '#82AAFF' }}>Assistant</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>(),</span></div>
                <div style={{ paddingLeft: 24 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>room</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>ctx.room,</span></div>
                <div style={{ paddingLeft: 24 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>room_options</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span><span style={{ color: '#82AAFF' }}>room_io.RoomOptions</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>(</span></div>
                <div style={{ paddingLeft: 48 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>audio_input</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span><span style={{ color: '#82AAFF' }}>room_io.AudioInputOptions</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>(</span></div>
                <div style={{ paddingLeft: 72 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>noise_cancellation</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span><span style={{ color: '#82AAFF' }}>arctan_enhancer</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>.</span><span style={{ color: '#FFCB6B' }}>noise_canceller</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>(</span></div>
                <div style={{ paddingLeft: 96 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>key</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>=</span><span style={{ color: '#82AAFF' }}>os.environ</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>[</span><span style={{ color: '#C3E88D' }}>"ARCTAN_KEY"</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>]</span></div>
                <div style={{ paddingLeft: 72 }}><span style={{ color: 'rgba(255,255,255,0.7)' }}>),</span></div>
                <div style={{ paddingLeft: 48 }}><span style={{ color: 'rgba(255,255,255,0.7)' }}>),</span></div>
                <div style={{ paddingLeft: 24 }}><span style={{ color: 'rgba(255,255,255,0.7)' }}>),</span></div>
                <div><span style={{ color: 'rgba(255,255,255,0.7)' }}>)</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ BENCHMARK — STT WER comparison ══════ */}
        <section ref={benchmarkRef} className="rsp-bench-section" style={{ background: D.offWhite, padding: '100px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexWrap: 'wrap', gap: 32 }}>
              <div>
                <h2 className="rsp-bench-h2" style={{ fontFamily: GTA, fontWeight: 400, fontSize: 44, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: D.ink, margin: 0 }}>
                  Every model.<br/><span style={{ color: '#1A8A70' }}>Half</span> the errors.
                </h2>
              </div>
            </div>

            {/* ── Legend ── */}
            <div style={{ display: 'flex', gap: 28, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 8, borderRadius: 4, background: 'rgba(27,6,36,0.18)' }} />
                <span style={{ fontFamily: GTA, fontSize: 13, color: D.inkSub, letterSpacing: '-0.01em' }}>Only STT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 8, borderRadius: 4, background: D.darkPure }} />
                <span style={{ fontFamily: GTA, fontSize: 13, color: D.ink, letterSpacing: '-0.01em' }}>+ Arctan</span>
              </div>
            </div>

            {/* ── Rows ── */}
            <div style={{ borderTop: `1px solid ${D.border}` }}>
              {STT_MODELS.map((row, i) => {
                const rawPct    = (row.raw    / BENCH_MAX) * 100
                const arctanPct = (row.arctan / BENCH_MAX) * 100
                const delay     = i * 0.08
                return (
                  <div key={row.model} className="bench-row">

                    {/* Model name */}
                    <div className="bench-model-label" style={{ fontFamily: GTA, fontSize: 15, color: D.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                      {row.model}
                    </div>

                    {/* Double bar */}
                    <div className="bench-bars-col" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {/* Only STT */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="bench-track" style={{ background: 'rgba(27,6,36,0.06)' }}>
                          <div className="bench-fill" style={{
                            width: barsVisible ? `${rawPct}%` : '0%',
                            background: 'rgba(27,6,36,0.20)',
                            transitionDelay: `${delay}s`,
                          }} />
                        </div>
                        <span style={{ fontFamily: GTA_MD, fontSize: 13, color: D.inkSub, width: 44, textAlign: 'right', flexShrink: 0 }}>
                          {row.raw}%
                        </span>
                      </div>
                      {/* + Arctan */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="bench-track" style={{ background: 'rgba(26,138,112,0.12)' }}>
                          <div className={`bench-fill bench-fill-arctan${barsVisible ? ' bars-ready' : ''}`} style={{
                            width: barsVisible ? `${arctanPct}%` : '0%',
                            background: '#1A8A70',
                            transitionDelay: `${delay + 0.13}s`,
                            animationDelay: `${delay + 1.1}s`,
                          }} />
                        </div>
                        <span style={{ fontFamily: GTA_MD, fontSize: 13, color: '#1A8A70', width: 44, textAlign: 'right', flexShrink: 0 }}>
                          {row.arctan}%
                        </span>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* ── Footer note ── */}
            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.teal, flexShrink: 0 }} />
              <span style={{ fontFamily: GTA, fontSize: 13, color: D.muted, letterSpacing: '-0.01em' }}>
                Tested on real-world voice agent calls with background noise, side-talk, and mumbles. Full methodology available on request.
              </span>
            </div>

          </div>
        </section>

        {/* Audio Enhancement section removed */}

        {/* HOW IT WORKS section removed */}
        {false && <section className="rsp-hiw-section" style={{ background: D.white, padding: '100px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Header */}
            <div className="rsp-hiw-head" style={{ marginBottom: 72 }}>
              <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: D.teal, textTransform: 'uppercase' as const, display: 'block', marginBottom: 18 }}>
                How it works
              </span>
              <h2 className="rsp-hiw-h2" style={{ fontFamily: GTA, fontSize: 44, fontWeight: 400, letterSpacing: '-0.05em', lineHeight: '1.1em', color: D.ink, margin: '0 0 20px' }}>
                One layer. Every model.<br/>Any environment.
              </h2>
              <p style={{ fontFamily: GTA, fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.6em', color: D.inkSub, maxWidth: 560 }}>
                Arctan sits between your microphone and your AI stack — stripping noise and cross-talk in under 20ms so only clean speech reaches your STT engine.
              </p>
            </div>

            {/* ── Signal flow diagram card ── */}
            <div className="rsp-hiw-card" style={{ background: D.offWhite, border: `1px solid ${D.border}`, borderRadius: 24, padding: '52px 52px 44px' }}>

              {/* Main flow row */}
              <div className="rsp-flow-row" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>

                {/* ─ 1. NOISY INPUT ─ */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    background: D.white, borderRadius: 14, padding: '16px 18px',
                    border: `1px solid ${D.border}`,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 9, color: D.muted, letterSpacing: '0.07em', marginBottom: 10 }}>AUDIO IN</div>
                    {/* Noisy bar visualiser */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 52, gap: 2, width: 136 }}>
                      {NOISY_H.slice(0, 24).map((h, i) => (
                        <div key={i} style={{
                          flex: 1, height: `${h}%`,
                          background: `rgba(27,6,36,${0.10 + h / 260})`,
                          borderRadius: '1px 1px 0 0',
                          transformOrigin: 'bottom',
                          animationName: 'noisyBeat',
                          animationDuration: `${NOISY_SP[i]}s`,
                          animationDelay: `${i * 0.04}s`,
                          animationIterationCount: 'infinite',
                          animationTimingFunction: 'ease-in-out',
                        } as React.CSSProperties} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 10, color: D.muted, letterSpacing: '0.04em', textAlign: 'center' as const, marginTop: 10 }}>NOISY SIGNAL</div>
                </div>

                {/* Connector: input → ARCTAN */}
                <div style={{ flex: '0 0 44px', height: 2, background: D.border, position: 'relative' as const, marginBottom: 22 }}>
                  <div style={{ position: 'absolute' as const, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', background: D.ink, opacity: 0.2, animation: 'pipelineSignal 2.4s linear 0s infinite' }} />
                </div>

                {/* ─ 2. ARCTAN NODE ─ */}
                <div style={{
                  flexShrink: 0,
                  background: D.lime, borderRadius: 18, padding: '24px 32px',
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 7,
                  boxShadow: '0 4px 32px rgba(174,236,29,0.28)',
                  animation: 'nodeGlow 3s ease-in-out infinite',
                  position: 'relative' as const, zIndex: 2,
                  marginBottom: 22,
                }}>
                  <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 15, letterSpacing: '0.06em', color: D.heading, fontWeight: 400, whiteSpace: 'nowrap' as const }}>ARCTAN</span>
                  <span style={{ fontFamily: GTA, fontSize: 11, letterSpacing: '-0.01em', color: 'rgba(34,34,33,0.52)', whiteSpace: 'nowrap' as const }}>audio intelligence · &lt;20ms</span>
                </div>

                {/* ─ Y-FORK SVG CONNECTOR ─
                    SVG height = gap(16) + noiseRow(62) + gap(16) + cleanRow(62) = 156
                    ARCTAN center (stem) at y = 78 (mid of 156)
                    Noise row center at y = 31 (62/2)
                    Clean row center at y = 16+62+16+31 = 125
                ─ */}
                <svg width="72" height="156" viewBox="0 0 72 156" fill="none"
                  style={{ flexShrink: 0, display: 'block', overflow: 'visible', marginBottom: 22 }}>
                  {/* Horizontal stem from ARCTAN to fork */}
                  <line x1="0" y1="78" x2="22" y2="78" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
                  {/* Fork dot */}
                  <circle cx="22" cy="78" r="4" fill="rgba(0,0,0,0.13)" />
                  {/* Upper branch — noise (dashed, muted) */}
                  <line x1="22" y1="78" x2="22" y2="38" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="22" y1="38" x2="72" y2="38" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" strokeDasharray="4 3" />
                  {/* Lower branch — clean (solid lime) */}
                  <line x1="22" y1="78" x2="22" y2="118" stroke={D.lime} strokeWidth="2" />
                  <line x1="22" y1="118" x2="72" y2="118" stroke={D.lime} strokeWidth="2" />
                  {/* Animated lime pulse on clean branch */}
                  <circle cx="47" cy="118" r="3.5" fill={D.lime} opacity="0.8" style={{ animation: 'dotPulse 2s ease-in-out 0.4s infinite' }} />
                </svg>

                {/* ─ 3. OUTPUT BRANCHES ─ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 16, marginBottom: 22 }}>

                  {/* ─ NOISE BRANCH (suppressed) ─ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Noisy output bars — muted, with suppression overlay */}
                    <div style={{
                      flexShrink: 0, position: 'relative' as const,
                      background: D.white, borderRadius: 12, padding: '12px 14px',
                      border: `1px solid ${D.border}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: 38, gap: 1.5, width: 110 }}>
                        {[45,82,12,67,34,88,20,56,78,15,91,38,62,25,74,41,83,18,59,77].map((h, i) => (
                          <div key={i} style={{
                            flex: 1, height: `${h}%`,
                            background: `rgba(27,6,36,${0.07 + h / 380})`,
                            borderRadius: '1px 1px 0 0',
                            transformOrigin: 'bottom',
                            animationName: 'noisyBeat',
                            animationDuration: `${[0.4,0.7,0.3,0.8,0.5,0.4,0.6,0.9,0.3,0.7,0.4,0.8,0.5,0.6,0.3,0.7,0.4,0.8,0.5,0.3][i]}s`,
                            animationDelay: `${i * 0.03}s`,
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-in-out',
                          } as React.CSSProperties} />
                        ))}
                      </div>
                      {/* Suppression overlay with ✕ */}
                      <div style={{
                        position: 'absolute' as const, inset: 0, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(247,247,245,0.80)',
                      }}>
                        <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 22, color: `rgba(27,6,36,0.28)`, lineHeight: 1 }}>✕</span>
                      </div>
                    </div>
                    {/* Labels */}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                      {['Background noise', 'Cross-talk / echo'].map(item => (
                        <span key={item} style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 10, color: D.muted, textDecoration: 'line-through', letterSpacing: '0.03em' }}>{item}</span>
                      ))}
                    </div>
                  </div>

                  {/* ─ CLEAN SIGNAL → STT → LLM → TTS ─ */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Clean signal bars (lime, smooth bell) */}
                    <div style={{
                      flexShrink: 0,
                      background: D.white, borderRadius: 12, padding: '12px 14px',
                      border: `1px solid rgba(174,236,29,0.40)`,
                      boxShadow: '0 1px 8px rgba(174,236,29,0.12)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: 38, gap: 1.5, width: 110 }}>
                        {[20,28,38,52,65,75,82,85,82,75,65,52,38,28,20,28,38,52,65,75].map((h, i) => (
                          <div key={i} style={{
                            flex: 1, height: `${h}%`,
                            background: `rgba(174,236,29,${0.32 + h / 230})`,
                            borderRadius: '1px 1px 0 0',
                            transformOrigin: 'bottom',
                            animationName: 'cleanBeat',
                            animationDuration: `${CLEAN_SP[i % CLEAN_SP.length]}s`,
                            animationDelay: `${i * 0.06}s`,
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-in-out',
                          } as React.CSSProperties} />
                        ))}
                      </div>
                    </div>

                    {/* Pipeline: STT → LLM → TTS */}
                    {(['STT', 'LLM', 'TTS'] as const).map((node, i) => (
                      <div key={node} style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Connector */}
                        <div style={{ width: 26, height: 2, background: i === 0 ? D.lime : D.border, position: 'relative' as const }}>
                          <div style={{
                            position: 'absolute' as const, top: '50%', transform: 'translateY(-50%)',
                            width: 6, height: 6, borderRadius: '50%',
                            background: i === 0 ? D.lime : 'rgba(174,236,29,0.5)',
                            animation: `pipelineSignal ${1.8 + i * 0.3}s linear ${i * 0.52}s infinite`,
                          }} />
                        </div>
                        {/* Node */}
                        <div style={{
                          background: D.white, border: `1px solid ${D.border}`, borderRadius: 10,
                          padding: '10px 16px',
                          display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}>
                          <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 11, color: D.inkSub, letterSpacing: '0.04em' }}>{node}</span>
                          <span style={{ fontFamily: GTA, fontSize: 9, color: D.muted }}>
                            {node === 'STT' ? 'speech → text' : node === 'LLM' ? 'language model' : 'text → speech'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Footnote */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 36, paddingTop: 24, borderTop: `1px solid ${D.border}` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.lime, flexShrink: 0, animation: 'dotPulse 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 10, letterSpacing: '0.07em', color: D.muted }}>
                  only clean speech is forwarded to stt · noise and cross-talk are suppressed in real time · &lt;20ms end-to-end latency
                </span>
              </div>

            </div>
          </div>
        </section>}


        {/* Integration section moved above benchmark */}



        {/* ══════ SAFE & SECURE — section-level 2-col, no card box ══════ */}
        <section className="rsp-safe-section" style={{ background: D.white, padding: '72px 40px', borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }}>
          <div className="rsp-safe-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.8fr', alignItems: 'center', gap: 0 }}>

            {/* Left — heading */}
            <div style={{ paddingRight: 60, borderRight: `1px solid ${D.border}` }}>
              <h2 className="rsp-safe-h2" style={{ fontFamily: GTA, fontWeight: 400, fontSize: 36, letterSpacing: '-0.04em', lineHeight: '1.18em', color: D.darkPure, margin: 0 }}>
                Enterprise-grade security.<br/>
                <span style={{ color: '#1A8A70' }}>From Cloud to Local.</span>
              </h2>
            </div>

            {/* Right — 2 cert badges in a row */}
            <div className="rsp-cert-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 60, gap: 48 }}>

              {/* SOC 2 */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, height: 100, borderRadius: 18, border: `1px solid ${D.border}`, background: D.white, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                  <img src="/logos/soc2-icon.png" alt="SOC 2" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <span style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: D.bodyText, textAlign: 'center' as const, letterSpacing: '-0.01em' }}>SOC 2 Type 2</span>
              </div>

              {/* ISO 27001 */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, height: 100, borderRadius: 18, border: `1px solid ${D.border}`, background: D.white, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                  <img src="/logos/iso27001-icon.avif" alt="ISO 27001" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <span style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: D.bodyText, textAlign: 'center' as const, letterSpacing: '-0.01em' }}>ISO 27001</span>
              </div>

            </div>
          </div>
        </section>

        {/* ══════ EVALUATION ACCESS / CONTACT — dark, 2-col form ══════ */}
        <section id="contact" className="rsp-contact-section" style={{ background: D.heroBg, padding: '100px 40px' }}>
          <div className="rsp-contact-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <div style={{ width: 28, height: 1, background: D.lime }}/>
                <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 11, color: D.lime, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Evaluation Access</span>
              </div>
              <h2 className="rsp-contact-h2" style={{ fontFamily: GTA, fontSize: 44, fontWeight: 400, letterSpacing: '-0.06em', lineHeight: '1.05em', color: 'white', marginBottom: 20 }}>
                Tell us what<br/>you're building.
              </h2>
              <p style={{ fontFamily: GTA, fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.6em', color: 'rgba(255,255,255,0.45)', marginBottom: 36 }}>
                For engineering teams shipping voice AI on embedded hardware.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {['ARM inference binary + benchmark recordings','Python scoring scripts, run on your hardware','Direct engineering support, not a sales queue'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: GTA, fontSize: 15, fontWeight: 400, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.65)' }}>
                    <span style={{ color: D.lime }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {[{p:'Your name *',t:'text'},{p:'Company / project *',t:'text'},{p:'Work email *',t:'email'}].map(({p,t}) => (
                <input key={p} type={t} placeholder={p} style={{ width: '100%', padding: '14px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: GTA, fontSize: 15, letterSpacing: '-0.01em' }}/>
              ))}
              <select style={{ width: '100%', padding: '14px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: GTA, fontSize: 15 }}>
                <option value="">Your role / interest *</option>
                <option>Engineer</option><option>Founder / CTO</option><option>Product</option><option>Other</option>
              </select>
              <textarea placeholder="Briefly describe your use case (optional)" rows={4} style={{ width: '100%', padding: '14px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: GTA, fontSize: 15, letterSpacing: '-0.01em', resize: 'vertical' as const }}/>
              <button style={{ width: '100%', padding: '15px', borderRadius: 9999, background: D.lime, color: D.heading, fontFamily: GTA, fontWeight: 400, fontSize: 16, letterSpacing: '-0.01em', border: 'none', cursor: 'pointer' }}>
                Get early access →
              </button>
              <p style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.22)', textAlign: 'center' as const }}>We reply within one business day.</p>
            </div>
          </div>
        </section>

        {/* ══════ FOOTER — Duna 4-col, dark #160F0C, GT America Regular ══════ */}
        <footer className="rsp-footer" style={{ background: D.white, borderTop: `1px solid ${D.border}`, padding: '64px 40px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="rsp-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 56 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <img src={IMG.dunaLogo} alt="Arctan" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }}/>
                  <span style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', color: D.ink }}>arctan</span>
                </div>
                <p style={{ fontFamily: GTA, fontSize: 14, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.7em', color: D.inkSub, maxWidth: 240 }}>
                  The audio intelligence layer for Voice AI. Remove noise, isolate speakers, and make your AI actually work.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  {['𝕏','in','⊙'].map(icon => (
                    <a key={icon} href="#" style={{ width: 32, height: 32, borderRadius: 8, background: D.offWhite, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.muted, fontFamily: GTA, fontSize: 13 }}>{icon}</a>
                  ))}
                </div>
              </div>
              {[
                { heading: 'Product',    links: ['Noise Suppression','Echo Cancellation','Speaker Isolation','VAD','Pricing'] },
                { heading: 'Developers', links: ['Python SDK','Node SDK','Go SDK','REST API','Open Source'] },
                { heading: 'Company',    links: ['About','Blog','Careers','Press','Security','Status'] },
              ].map(col => (
                <div key={col.heading}>
                  <h4 style={{ fontFamily: GTA, fontSize: 11, fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: D.ink, marginBottom: 16 }}>{col.heading}</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {col.links.map(link => (
                      <li key={link}><a href="#" style={{ fontFamily: GTA, fontSize: 14, fontWeight: 400, letterSpacing: '-0.01em', color: D.inkSub }}>{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="rsp-footer-bottom" style={{ borderTop: `1px solid ${D.border}`, paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
              <span style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: D.muted }}>© 2026 Arctan, Inc. All rights reserved.</span>
              <div className="rsp-footer-legal" style={{ display: 'flex', gap: 24 }}>
                {['Privacy Policy','Terms of Service','Security','Status'].map(l => (
                  <a key={l} href="#" style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em', color: D.muted }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
