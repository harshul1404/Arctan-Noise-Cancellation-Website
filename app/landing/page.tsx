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
  { model: 'AssemblyAI Universal-2', raw: 27.2, arctan: 15.8 },
  { model: 'Cartesia Ink-Whisper',   raw: 28.3, arctan: 14.4 },
  { model: 'Deepgram Nova 3',        raw: 24.1, arctan: 12.7 },
  { model: 'Soniox STT Async v4',    raw: 27.1, arctan: 11.9 },
  { model: 'Speechmatics',           raw: 25.9, arctan: 11.7 },
]
const BENCH_MAX = 35 // normalisation ceiling (px above max raw value)

// Prefix for all public/ assets — must match next.config.mjs basePath
const BP = process.env.NEXT_PUBLIC_BASE_PATH || ''

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

  // Load Tally embed script once
  useEffect(() => {
    if (!document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) {
      const s = document.createElement('script')
      s.src = 'https://tally.so/widgets/embed.js'
      s.async = true
      document.head.appendChild(s)
    }
  }, [])

  const openTally = () => {
    const tally = (window as any).Tally
    if (tally) {
      tally.openPopup('KYROzV', { transparentBackground: true, width: 480 })
    } else {
      window.open('https://tally.so/r/KYROzV', '_blank')
    }
  }

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
      // Cover: find scale that fills both dimensions
      const scale = Math.max(cW / iW, cH / iH)
      const dW = iW * scale, dH = iH * scale
      // On mobile (portrait), shift anchor rightward so headphones are visible
      const anchorX = cW < cH ? 0.72 : 0.5
      const dx = (cW - dW) * anchorX, dy = (cH - dH) / 2
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
    // Only recalculate section height when the viewport WIDTH changes (intentional
    // window resize). iOS Safari fires resize on every scroll as the URL bar
    // shows/hides (height-only change) — recalculating height there causes the
    // seq-section to grow/shrink, shifting all sections below it.
    let lastResizeWidth = window.innerWidth
    const onResize = () => {
      sizeCanvas()
      if (window.innerWidth !== lastResizeWidth) {
        lastResizeWidth = window.innerWidth
        applyHeight()
      }
      drawFrame(currentFrame < 0 ? 0 : currentFrame)
      update()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    // Load frame 1 first — render it immediately so canvas isn't blank on load
    const firstImg = new Image()
    firstImg.onload = () => {
      images[0] = firstImg
      loadedCount++
      drawFrame(0)
      update()
    }
    firstImg.src = `${BP}/frames/1.webp`

    // Load remaining frames in the background; each one triggers a redraw if it's the current target
    FRAME_NUMS.slice(1).forEach((n, idx) => {
      const i = idx + 1
      const img = new Image()
      img.onload = () => {
        images[i] = img
        loadedCount++
        // Redraw if this newly loaded frame is what the scroll position needs
        const scrolledIn = Math.max(0, -(section.getBoundingClientRect?.() || { top: 0 }).top)
        const progress   = Math.min(1, scrolledIn / EXTRA_SCROLL)
        const target = Math.round(progress * (TOTAL - 1))
        if (target === i) { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
      }
      img.src = `${BP}/frames/${n}.webp`
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
          ascent-override: 88%;
          descent-override: 22%;
          line-gap-override: 0%;
          size-adjust: 106%;
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
          ascent-override: 88%;
          descent-override: 22%;
          line-gap-override: 0%;
          size-adjust: 104%;
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
          font-weight: 500;
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

        /* ── WER bar chart ────────────────────────────────────────────────── */
        .wer-bars { display: flex; flex-direction: column; border-top: 1px solid rgba(0,0,0,0.08); }
        .wer-bar-row {
          display: grid;
          grid-template-columns: 140px 1fr 110px;
          align-items: center;
          gap: 24px;
          padding: 22px 0;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .wer-bar-track {
          height: 40px;
          background: rgba(27,6,36,0.05);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .wer-bar-fill {
          position: absolute; left: 0; top: 0; bottom: 0;
          border-radius: 4px;
        }
        .wer-bar-brand {
          font-family: "GT America Trial Md", sans-serif;
          font-size: 15px; font-weight: 500;
          letter-spacing: -0.01em;
        }
        .wer-bar-num {
          font-family: "GT America Trial Md", sans-serif;
          font-size: 26px; font-weight: 500;
          letter-spacing: -0.04em;
          text-align: right; line-height: 1;
        }
        .wer-axis { display: grid; grid-template-columns: 140px 1fr 110px; gap: 24px; margin-top: 8px; }
        .wer-axis-ticks { display: flex; justify-content: space-between; }
        .wer-axis-tick {
          font-family: "GT America Regular", sans-serif;
          font-size: 11px; letter-spacing: 0.02em;
          color: rgba(27,6,36,0.28);
        }
.wer-factors {
          margin-top: 56px;
          display: flex; flex-wrap: wrap; gap: 10px;
        }
        .wer-factor-tag {
          font-family: "GT America Regular", sans-serif;
          font-size: 13px; letter-spacing: -0.01em;
          color: rgba(27,6,36,0.55);
          padding: 7px 16px; border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.10);
        }
        @media (max-width: 768px) {
          .rsp-wer-section { padding: 60px 20px !important; }
          .rsp-wer-h2      { font-size: 30px !important; }
          .wer-bar-row     { grid-template-columns: 90px 1fr 76px !important; gap: 12px !important; }
          .wer-axis        { grid-template-columns: 90px 1fr 76px !important; gap: 12px !important; }
          .wer-bar-track   { height: 32px !important; }
          .wer-bar-num     { font-size: 20px !important; }
          .wer-bar-brand   { font-size: 12px !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .rsp-wer-section { padding: 80px 32px !important; }
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
          .rsp-stats-grid  { grid-template-columns: 1fr !important; gap: 0 !important; }
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
          .rsp-contact-section { padding: 80px 20px !important; }
          .rsp-contact-h2      { font-size: 32px !important; letter-spacing: -0.04em !important; }
          .rsp-contact-btns    { flex-direction: column !important; align-items: stretch !important; width: 100% !important; max-width: 320px !important; }

          /* Footer */
          .rsp-footer          { padding: 48px 20px 32px !important; }
          .rsp-footer-top      { margin-bottom: 28px !important; }
          .rsp-footer-bottom   { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .rsp-footer-legal    { flex-wrap: wrap !important; gap: 12px !important; }

          /* Stream / signal-isolation diagram */
          .rsp-stream-section { padding: 60px 20px !important; }
          .rsp-stream-head    { margin-bottom: 36px !important; }
          .rsp-stream-h2      { font-size: 30px !important; }
          .rsp-stream-svg     { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .rsp-stream-svg > div { min-width: 680px; }

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
          .rsp-stream-svg > div { min-width: 820px; }
        }
      `}</style>

      <div style={{ fontFamily: GTA, color: D.ink, background: D.white }}>

        {/* ══════ NAV — mirrors Duna nav: transparent → white blur on scroll ══════ */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          background: navScrolled ? 'rgba(255,255,255,0.25)' : 'transparent',
          backdropFilter: navScrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: navScrolled ? 'blur(12px)' : 'none',
          borderBottom: navScrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          transition: 'background 0.4s ease',
        }}>
          <div className="rsp-nav-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={`${BP}/logos/arctan-mark.svg`} alt="Arctan logomark" width="34" height="20" style={{ display: 'block' }} />
              <span style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', color: D.heading }}>arctan</span>
            </a>
            <div className="rsp-nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {[
                { label: 'How it works', href: '#product' },
                { label: 'Integration',  href: '#integration' },
                { label: 'Benchmarks',   href: '#benchmarks' },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, color: D.inkSub, transition: 'opacity 0.15s' }}>{label}</a>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={openTally} style={{ padding: '9px 22px', borderRadius: 9999, background: '#18160d', color: '#ffffff', fontFamily: GTA, fontWeight: 400, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                Try it Free
              </button>
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
                <a ref={seqCtaRef} href="#contact" onClick={(e) => { e.preventDefault(); openTally() }} className="seq-cta" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '12px 28px', borderRadius: 9999,
                  background: '#18160d', color: '#ffffff',
                  fontFamily: GTA, fontSize: 16, fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}>
                  Try it Free
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
                  { src: `${BP}/logos/iccs.jpeg`,         alt: 'ICCS',                  w: 160, h: 60 },
                  { src: `${BP}/logos/megaaopes.svg`,     alt: 'Megaaopes',             w: 42,  h: 42 },
                  { src: `${BP}/logos/creed.avif`,        alt: 'Creed Infotech',        w: 130, h: 38 },
                  { src: `${BP}/logos/ikarus.avif`,       alt: 'Ikarus 3D',             w: 88,  h: 42 },
                  { src: `${BP}/logos/grssl.avif`,        alt: 'Grassroots',            w: 130, h: 32 },
                  { src: `${BP}/logos/diverseline.avif`,  alt: 'Diverse Line Impex',    w: 152, h: 38 },
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
                { n: '10',  suffix: 'ms', label: 'Processing Latency' },
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
                    marginBottom: 15,
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
        <section id="product" className="rsp-stream-section" style={{ background: D.offWhite, padding: '60px 40px', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Header */}
            <div className="rsp-stream-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 32 }}>
              <div>
                <h2 className="rsp-stream-h2" style={{ fontFamily: GTA, fontWeight: 400, fontSize: 44, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: D.ink, margin: 0 }}>
                  <span style={{ color: '#1A8A70' }}>Multiple</span> voices.<br/>Only the Primary speaker gets through.
                </h2>
              </div>
            </div>

            {/* Stream animation — scrolls horizontally on small screens to stay legible */}
            <div className="rsp-stream-svg" style={{ width: '100%', overflow: 'hidden' }}>
              {/* Intrinsic-ratio wrapper: locks height to viewBox aspect ratio.
                  contain:layout stops Safari from letting animated <g> bounding
                  boxes (which can exceed the SVG viewport) escape into HTML layout. */}
              <div style={{ position: 'relative', paddingBottom: '36%', height: 0, contain: 'layout' }}>
              <svg
                viewBox="0 0 1000 360"
                preserveAspectRatio="xMidYMid meet"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', overflow: 'hidden', contain: 'layout paint' }}
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
                {/* Arctan logomark */}
                <image href={`${BP}/logos/arctan-mark.svg`} x="426" y="166" width="48" height="28" />
                {/* label */}
                <text x="450" y="252" textAnchor="middle" fontSize="14" fontWeight="400" letterSpacing="-0.03em" fontFamily="sans-serif">
                  <tspan fill={D.ink}>arctan</tspan>
                </text>
                <text x="450" y="267" textAnchor="middle" fontSize="8" letterSpacing="0.12em" fill={D.muted} fontFamily="sans-serif">VOICE ISOLATION</text>

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
              </div>{/* end intrinsic-ratio wrapper */}
            </div>

          </div>
        </section>

        {/* ══════ BENCHMARK — STT WER comparison ══════ */}
        <section id="benchmarks" ref={benchmarkRef} className="rsp-bench-section" style={{ background: D.white, padding: '100px 40px' }}>
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
                <div style={{ width: 28, height: 8, borderRadius: 4, background: '#1A8A70' }} />
                <span style={{ fontFamily: GTA, fontSize: 13, color: D.ink, letterSpacing: '-0.01em' }}>With Arctan</span>
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
                        <span style={{ fontFamily: GTA_MD, fontSize: 15, color: '#0F6B54', width: 52, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>
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

        {/* ══════ WER COMPETITOR COMPARISON ══════ */}
        <section id="wer" className="rsp-wer-section" style={{ background: D.offWhite, padding: '100px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 72, flexWrap: 'wrap' as const, gap: 32 }}>
              <h2 className="rsp-wer-h2" style={{ fontFamily: GTA, fontWeight: 400, fontSize: 44, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: D.ink, margin: 0 }}>
                The industry's <span style={{ color: D.teal }}>lowest</span> WER.
              </h2>
            </div>

            {/* WER bar chart */}
            {(() => {
              const MAX = 20
              const rows = [
                { brand: 'Arctan',      wer: 13.3, isArctan: true  },
                { brand: 'ai-coustics', wer: 15.9, isArctan: false },
                { brand: 'Krisp',       wer: 16.7, isArctan: false },
              ]
              return (
                <div>
                  <p style={{ fontFamily: GTA, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: D.muted, margin: '0 0 20px' }}>
                    Word Error Rate : lower is better
                  </p>
                  <div className="wer-bars">
                    {rows.map(({ brand, wer, isArctan }) => (
                      <div key={brand} className="wer-bar-row">
                        <div className="wer-bar-brand" style={{ color: isArctan ? D.teal : D.muted }}>{brand}</div>
                        <div className="wer-bar-track">
                          <div className="wer-bar-fill" style={{ width: `${(wer / MAX) * 100}%`, background: isArctan ? D.teal : 'rgba(27,6,36,0.14)' }} />
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <div className="wer-bar-num" style={{ color: isArctan ? D.teal : '#C0392B' }}>
                            {wer}<span style={{ fontSize: '0.55em', letterSpacing: '-0.01em' }}>%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="wer-axis">
                    <div />
                    <div className="wer-axis-ticks">
                      {[0, 5, 10, 15, 20].map(v => (
                        <span key={v} className="wer-axis-tick">{v}%</span>
                      ))}
                    </div>
                    <div />
                  </div>
                </div>
              )
            })()}

            {/* Footer note */}
            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.teal, flexShrink: 0 }} />
              <span style={{ fontFamily: GTA, fontSize: 13, color: D.muted, letterSpacing: '-0.01em' }}>
                Compared against other noise-suppression providers on real-world voice agent calls with background noise, cross-talk, and mumbles.
              </span>
            </div>

          </div>
        </section>

        {/* ══════ SDK / INTEGRATION ══════ */}
        <section id="integration" className="rsp-intg-section" style={{ background: D.heroBg, padding: '100px 40px' }}>
          <div className="rsp-intg-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <h2 className="rsp-intg-h2" style={{ fontFamily: GTA, fontSize: 40, fontWeight: 400, letterSpacing: '-0.05em', lineHeight: '1.1em', fontFeatureSettings: '"blwf" on,"cv09" on,"cv03" on,"cv04" on,"cv11" on', color: 'white', marginBottom: 24 }}>
                <span style={{ color: '#1A8A70' }}>Native</span> in the language<br/>you ship in.
              </h2>
              <p style={{ fontFamily: GTA, fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.65em', color: 'rgba(255,255,255,0.5)', marginBottom: 36 }}>
                First-party SDKs for Node, Python, Go, and Rust.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 36 }}>
                {/* LiveKit — official wordmark from livekit.com/brand */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 22px', borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <svg width="88" height="20" viewBox="0 0 123 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#lk-wm-clip)">
                      <path d="M4.6991 0H0V27.5637H17.0471V23.538H4.6991V0Z" fill="white"/>
                      <path d="M24.8037 12.5483H20.2505V27.5626H24.8037V12.5483Z" fill="white"/>
                      <path d="M38.2076 27.0186L32.4161 8.01416H27.8628L33.9461 27.563H42.4691L48.5523 8.01416H43.9623L38.2076 27.0186Z" fill="white"/>
                      <path d="M59.8485 7.58105C53.9468 7.58105 50.1953 11.7886 50.1953 17.7724C50.1953 23.7206 53.8376 28.0002 59.8485 28.0002C64.4374 28.0002 67.7523 25.9691 68.9906 21.7981H64.3606C63.6691 23.684 62.393 24.8104 59.8798 24.8104C57.1116 24.8104 55.1818 22.8879 54.8177 19.1171H69.3147C69.384 18.6364 69.4201 18.1515 69.4228 17.6659C69.4239 11.5702 65.6356 7.58105 59.8485 7.58105ZM54.8533 15.9585C55.3277 12.4416 57.185 10.773 59.8485 10.773C62.6524 10.773 64.5465 12.8397 64.7658 15.9585H54.8533Z" fill="white"/>
                      <path d="M96.048 0H90.1474L78.7103 12.6216V0H74.0112V27.5637H78.7103V13.6372L91.3132 27.5637H97.323L84.1376 13.0562L96.048 0Z" fill="white"/>
                      <path d="M103.914 8.01416H99.3608V23.0284H103.914V8.01416Z" fill="white"/>
                      <path d="M20.251 8.01416H15.6978V12.5477H20.251V8.01416Z" fill="white"/>
                      <path d="M108.468 23.0298H103.915V27.5633H108.468V23.0298Z" fill="white"/>
                      <path d="M122.073 23.0298H117.52V27.5633H122.073V23.0298Z" fill="white"/>
                      <path d="M122.073 12.5484V8.0149H117.52V0H112.966V8.0149H108.413V12.5484H112.966V23.0302H117.52V12.5484H122.073Z" fill="white"/>
                    </g>
                    <defs>
                      <clipPath id="lk-wm-clip">
                        <rect width="123" height="28" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                {/* Pipecat — official icon from github.com/pipecat-ai/pipecat */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.3088 5.05615C3.64682 4.92779 4.02833 5.02411 4.26653 5.29797L7.36884 8.86461H16.6312L19.7335 5.29797C19.9717 5.02411 20.3532 4.92779 20.6912 5.05615C21.0292 5.18452 21.253 5.51072 21.253 5.87504V13.75H24V15.5H19.5181V8.19909L17.6762 10.3167C17.5115 10.506 17.2738 10.6146 17.0241 10.6146H6.9759C6.72616 10.6146 6.48854 10.506 6.32383 10.3167L4.48193 8.19909V15.5H0V13.75H2.74699V5.87504C2.74699 5.51072 2.97078 5.18452 3.3088 5.05615Z" fill="white"/>
                    <path d="M19.5181 17.25H24V19H19.5181V17.25Z" fill="white"/>
                    <path d="M0 17.25H4.48193V19H0V17.25Z" fill="white"/>
                    <path d="M9.25301 14.3333C9.25301 14.9777 8.73517 15.5 8.09639 15.5C7.4576 15.5 6.93976 14.9777 6.93976 14.3333C6.93976 13.689 7.4576 13.1667 8.09639 13.1667C8.73517 13.1667 9.25301 13.689 9.25301 14.3333Z" fill="white"/>
                    <path d="M17.0602 14.3333C17.0602 14.9777 16.5424 15.5 15.9036 15.5C15.2648 15.5 14.747 14.9777 14.747 14.3333C14.747 13.689 15.2648 13.1667 15.9036 13.1667C16.5424 13.1667 17.0602 13.689 17.0602 14.3333Z" fill="white"/>
                  </svg>
                  <span style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.01em', color: 'white' }}>Pipecat</span>
                </div>
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
                  <img src={`${BP}/logos/soc2-icon.png`} alt="SOC 2" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <span style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: D.bodyText, textAlign: 'center' as const, letterSpacing: '-0.01em' }}>SOC 2 Type 2</span>
              </div>

              {/* ISO 27001 */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, height: 100, borderRadius: 18, border: `1px solid ${D.border}`, background: D.white, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                  <img src={`${BP}/logos/iso27001-icon.avif`} alt="ISO 27001" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <span style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: D.bodyText, textAlign: 'center' as const, letterSpacing: '-0.01em' }}>ISO 27001</span>
              </div>

            </div>
          </div>
        </section>

        {/* ══════ EVALUATION ACCESS / CONTACT — dark, 2-col form ══════ */}
        <section id="contact" className="rsp-contact-section" style={{ background: D.heroBg, padding: '120px 40px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const }}>

            {/* Icon */}
            <div style={{ width: 88, height: 88, borderRadius: 22, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
              <svg viewBox="540 500 1330 780" xmlns="http://www.w3.org/2000/svg" width="52" height="32" style={{ display: 'block' }}>
                <path d="M0 0 C3.09573297 0.00849676 6.18960449 -0.02034959 9.28515625 -0.05200195 C65.060163 -0.24651953 115.50289465 28.02947232 158.36328125 61.44604492 C158.88728516 61.85209961 159.41128906 62.2581543 159.95117188 62.67651367 C164.11260806 65.90295896 168.24537039 69.16426889 172.36328125 72.44604492 C173.02440918 72.97278809 173.68553711 73.49953125 174.36669922 74.04223633 C182.11739284 80.2350571 189.70984591 86.51333286 196.9921875 93.25463867 C199.06502046 95.17038709 201.16634184 97.03718936 203.30078125 98.88354492 C208.2183075 103.16009015 212.9967696 107.58781302 217.79003906 112.00219727 C219.33797489 113.42281994 220.89237939 114.83597143 222.44921875 116.24682617 C228.0592878 121.33970576 233.53189411 126.52724254 238.81640625 131.96166992 C240.80917953 133.90554079 242.81735823 135.7102847 244.9296875 137.51635742 C250.57936789 142.41671178 255.78829272 147.76410828 261.05078125 153.07104492 C262.07984078 154.10513534 263.10913632 155.13899094 264.13867188 156.17260742 C266.0310052 158.07302349 267.92169335 159.97502092 269.8112793 161.87817383 C271.55584691 163.63358971 273.30535351 165.38410727 275.05908203 167.13037109 C277.31414079 169.39665975 279.43769664 171.73501549 281.55078125 174.13354492 C285.55144889 178.61349388 289.74343346 182.84777176 294.015625 187.06713867 C296.71559083 189.80304415 299.22084973 192.66367178 301.71875 195.58276367 C303.36726877 197.45056285 305.08631706 199.20060116 306.86328125 200.94604492 C309.90444698 203.93990363 312.71728738 207.07491486 315.50390625 210.30541992 C317.46911498 212.56788711 319.47462588 214.78911455 321.48828125 217.00854492 C330.64774657 227.16326623 339.50924185 237.58675795 348.39453125 247.98120117 C350.38571162 250.3092798 352.38634137 252.62871942 354.39453125 254.94213867 C359.86609594 261.25873266 365.16708581 267.66295724 370.28930664 274.26635742 C373.38621301 278.24499482 376.58356879 282.11709832 379.86328125 285.94604492 C384.07380754 290.86664581 388.11823463 295.89193348 392.09545898 301.00244141 C395.64460989 305.55541792 399.27208475 310.03918162 402.92578125 314.50854492 C408.02671124 320.76206392 413.00859939 327.08566521 417.890625 333.51245117 C419.61486638 335.77637553 421.34845719 338.03300937 423.08203125 340.28979492 C430.59191432 350.08288588 437.96300897 359.95463803 445.15234375 369.98510742 C448.51363486 374.67023011 451.93527241 379.30962168 455.36328125 383.94604492 C465.01873827 397.02711567 474.5552845 410.16342259 483.69287109 423.61303711 C486.91715715 428.35400069 490.19506457 433.04731808 493.55078125 437.69604492 C498.21680506 444.17263911 502.64751384 450.79141709 507.04492188 457.45239258 C508.8636207 460.20266935 510.69331173 462.94555079 512.5234375 465.68823242 C513.51102433 467.16829588 514.49799024 468.64877382 515.484375 470.12963867 C518.37935637 474.4757568 521.28169953 478.81680088 524.19140625 483.15307617 C532.55026583 495.62525141 540.74228845 508.18687675 548.74902344 520.88793945 C550.27430815 523.30504974 551.80581469 525.71807131 553.33984375 528.12963867 C561.45272795 540.89893344 569.38763431 553.77707266 577.28344727 566.68145752 C578.38571176 568.48269926 579.48875175 570.28346473 580.59179688 572.08422852 C584.93602888 579.18031713 589.25730671 586.28961063 593.54394531 593.4206543 C594.66431618 595.28372942 595.78795561 597.14484912 596.91699219 599.00268555 C606.24204275 614.39662991 611.50349073 630.37401878 607.59765625 648.42260742 C606.67423158 651.84514172 605.61087465 655.12927222 604.36328125 658.44604492 C603.94755859 659.5965332 603.94755859 659.5965332 603.5234375 660.77026367 C598.93155403 671.54108711 588.70660664 677.94428672 578.36328125 682.44604492 C565.58328779 685.49259946 549.70651021 685.35775517 538.36328125 678.44604492 C537.56148437 677.98842773 536.7596875 677.53081055 535.93359375 677.05932617 C526.23404295 671.09916448 520.24129153 663.32056268 514.59570312 653.5690918 C513.17311543 651.1184534 511.73007812 648.68045561 510.28515625 646.24291992 C508.02533199 642.42921709 505.77022733 638.61279826 503.51953125 634.79370117 C499.50578603 627.98773355 495.44985425 621.2084793 491.36328125 614.44604492 C490.84652832 613.58897949 490.32977539 612.73191406 489.79736328 611.84887695 C482.64504258 599.99500221 475.39993981 588.22403657 467.8046875 576.64868164 C466.30587766 574.35832555 464.81801805 572.06114549 463.33203125 569.76245117 C454.74384214 556.50073653 445.99821646 543.34469798 437.23828125 530.19604492 C436.64967316 529.31183868 436.06106506 528.42763245 435.45462036 527.51663208 C423.80895166 510.02795907 411.99993155 492.66439473 399.83837891 475.5300293 C398.36533658 473.44894864 396.90022096 471.36251544 395.4375 469.27416992 C384.55114312 453.74624498 373.22851609 438.54502561 361.82666016 423.39331055 C360.35024667 421.42870027 358.87766753 419.46127418 357.40625 417.49291992 C347.48481053 404.22362562 337.52929038 391.0022833 327.02758789 378.18432617 C323.73291884 374.15634525 320.51813611 370.08456212 317.36328125 365.94604492 C312.0107638 358.93120091 306.44509349 352.09776226 300.85595703 345.27075195 C299.54141923 343.66380796 298.23129823 342.05325302 296.921875 340.44213867 C288.26413105 329.80194173 279.3380542 319.3885126 270.3984375 308.98510742 C268.37757019 306.63230081 266.36516566 304.27265281 264.359375 301.90698242 C258.44512428 294.94377095 252.39168353 288.1459423 246.1640625 281.46166992 C243.69996408 278.81662079 241.27442487 276.13957473 238.86328125 273.44604492 C231.51304024 265.25539523 224.13367674 257.10510055 216.27845764 249.3936615 C214.50009877 247.58517993 212.84832414 245.72655388 211.20483398 243.79589844 C207.07419812 239.04622344 202.66589259 234.60476158 198.2109375 230.16088867 C197.35197372 229.30096817 196.49300995 228.44104767 195.60801697 227.55506897 C193.8015111 225.74788631 191.99375663 223.941951 190.18481445 222.13720703 C187.43391315 219.39166099 184.68838904 216.64081947 181.94335938 213.8894043 C180.17870593 212.12541173 178.41374228 210.36172942 176.6484375 208.59838867 C175.83673599 207.78466293 175.02503448 206.97093719 174.18873596 206.1325531 C169.96560226 201.92653803 165.67453328 197.86671884 161.14581299 193.99046326 C158.02181269 191.28377185 155.05020646 188.41403391 152.05078125 185.57104492 C146.85224694 180.67754644 141.54337772 176.03494372 135.9609375 171.57885742 C133.22773239 169.33475217 130.64191532 166.9773674 128.05078125 164.57104492 C122.38963639 159.37366617 116.43019783 154.66848768 110.34667969 149.98364258 C108.21796375 148.33338988 106.1062204 146.66296114 103.99609375 144.98901367 C70.76277297 118.69852742 33.01921066 96.3961629 -10.8515625 100.66137695 C-53.29301701 105.86776581 -91.33102614 139.14554248 -122.45166016 166.01293945 C-125.89686631 168.98087134 -129.38934808 171.86543456 -132.94921875 174.69604492 C-139.49366611 180.00130698 -145.52301094 185.85103966 -151.625 191.65307617 C-154.66293695 194.53872851 -157.74488204 197.36073308 -160.88671875 200.13354492 C-165.42485653 204.16830564 -169.67710923 208.45680914 -173.94433594 212.77294922 C-177.50749659 216.36213773 -181.16918927 219.7648503 -185.015625 223.05151367 C-188.77988518 226.28968448 -192.04999234 229.91514051 -195.32421875 233.63354492 C-200.66083598 239.61811567 -206.3628693 245.22667455 -212.0769043 250.84912109 C-216.26953729 254.99454895 -220.26545099 259.2246212 -224.10888672 263.69555664 C-226.02010402 265.88530225 -228.05113437 267.92271679 -230.13671875 269.94604492 C-233.52598968 273.29524002 -236.72070662 276.73480858 -239.82421875 280.34838867 C-241.89522216 282.74521805 -244.01275093 285.09604674 -246.13671875 287.44604492 C-263.13593822 306.30232198 -279.54315543 325.75370503 -295.359375 345.61010742 C-297.08586703 347.76007862 -298.82257366 349.89939472 -300.5703125 352.03198242 C-306.81721948 359.66083875 -312.93031149 367.36858665 -318.89453125 375.22070312 C-322.33121327 379.74487033 -325.80460117 384.2361144 -329.32421875 388.69604492 C-338.20413702 399.96530693 -346.83629679 411.38594665 -355.328125 422.94995117 C-357.91041949 426.46463972 -360.51289617 429.96227304 -363.13671875 433.44604492 C-377.41245579 452.42748787 -391.42274509 471.59873807 -404.7734375 491.24291992 C-406.92890369 494.41440496 -409.1105557 497.56477447 -411.32421875 500.69604492 C-413.95726863 504.43701849 -416.50773502 508.22963199 -419.0390625 512.03979492 C-419.93352753 513.38396867 -420.82814776 514.72803916 -421.72290039 516.07202148 C-422.1959964 516.78265747 -422.66909241 517.49329346 -423.15652466 518.22546387 C-425.19073207 521.27717341 -427.2308422 524.32491463 -429.27122498 527.37249756 C-431.46256486 530.64608203 -433.65149041 533.92127794 -435.84033203 537.1965332 C-436.95017448 538.8562713 -438.06084518 540.51545587 -439.17236328 542.17407227 C-446.26768609 552.76370033 -453.21510387 563.42864692 -459.97875977 574.23339844 C-462.49261163 578.24035273 -465.08526224 582.19142727 -467.69921875 586.13354492 C-473.51627696 595.01292768 -478.86405906 604.17269478 -484.26049805 613.31063843 C-490.78226176 624.35407095 -497.4150617 635.31569351 -504.22851562 646.18237305 C-505.62767037 648.43149975 -507.00248058 650.69385216 -508.37109375 652.96166992 C-517.13904256 667.43197707 -525.94184686 678.01723946 -542.91552734 682.8527832 C-547.60895105 683.876022 -552.22232888 683.9776119 -557.01171875 683.94604492 C-558.02250488 683.94032471 -559.03329102 683.93460449 -560.07470703 683.92871094 C-571.99697722 683.64347538 -580.98648302 679.68272357 -589.63671875 671.44604492 C-599.2645006 661.29071338 -603.1117508 647.07810343 -602.8828125 633.42260742 C-601.91370908 617.76312677 -595.25875779 605.71776194 -587.13671875 592.63354492 C-585.89438034 590.61280436 -584.65219715 588.59196836 -583.41015625 586.57104492 C-582.78206055 585.55268555 -582.15396484 584.53432617 -581.50683594 583.48510742 C-579.14641765 579.64927363 -576.80798532 575.80035493 -574.47143555 571.94995117 C-572.14240114 568.11334673 -569.80558801 564.28150816 -567.46826172 560.44995117 C-566.22387142 558.40903166 -564.98075213 556.36733676 -563.73876953 554.32495117 C-554.93129065 539.85030145 -545.90815235 525.54527255 -536.56958008 511.40740967 C-533.54448201 506.82720035 -530.53158138 502.23909673 -527.52206421 497.64863586 C-502.15106675 458.95387032 -502.15106675 458.95387032 -489.45361328 441.0222168 C-486.73410266 437.16622701 -484.04866157 433.2867887 -481.36010742 429.40917969 C-472.03160347 415.95855148 -462.55067156 402.64591297 -452.81689453 389.4855957 C-449.29171114 384.7138536 -445.81357943 379.9137654 -442.38671875 375.07104492 C-438.5605297 369.67736253 -434.58680762 364.41095761 -430.53125 359.18823242 C-427.59112794 355.39920929 -424.69136907 351.57993574 -421.7902832 347.76098633 C-415.24753693 339.14885305 -408.65747684 330.58072197 -401.94433594 322.10083008 C-400.07979815 319.74126377 -398.2251188 317.37400759 -396.36962891 315.00732422 C-391.49474415 308.79096637 -386.58170511 302.60684405 -381.63671875 296.44604492 C-380.9921875 295.63780273 -380.34765625 294.82956055 -379.68359375 293.99682617 C-372.49597768 284.98400839 -365.1970197 276.07389281 -357.72998047 267.29150391 C-354.76052228 263.79315974 -351.84073616 260.25942955 -348.94921875 256.69604492 C-345.57625166 252.5534882 -342.10228151 248.52792835 -338.53125 244.55541992 C-336.73500782 242.55548017 -334.96361222 240.5365834 -333.19921875 238.50854492 C-329.78346057 234.59481744 -326.30439984 230.7399618 -322.82421875 226.88354492 C-320.91117726 224.75187012 -319.01784263 222.60585382 -317.13671875 220.44604492 C-306.52207466 208.27328794 -295.53730608 196.42549368 -284.46630859 184.66821289 C-281.64036806 181.66384133 -278.82511998 178.65258691 -276.04541016 175.60522461 C-268.55038896 167.3893434 -260.80189294 159.45618333 -252.92626953 151.60522461 C-250.87154367 149.55590981 -248.82228772 147.50123229 -246.7734375 145.44604492 C-245.4417271 144.11499467 -244.10970687 142.78425431 -242.77734375 141.45385742 C-241.87861542 140.55209274 -241.87861542 140.55209274 -240.96173096 139.6321106 C-237.24594454 135.93647318 -233.40802019 132.43588354 -229.43055725 129.02313232 C-226.75582211 126.6715878 -224.29773338 124.13022426 -221.82421875 121.57104492 C-217.31048361 116.97805882 -212.59885275 112.86410809 -207.55078125 108.85620117 C-204.11543559 106.01490322 -200.8794387 103.00302749 -197.63671875 99.94604492 C-192.63679804 95.23887871 -187.51462584 90.78901727 -182.15234375 86.49291992 C-179.72739553 84.51982541 -177.39522566 82.47732039 -175.07421875 80.38354492 C-170.41496488 76.20174109 -165.5557144 72.31639072 -160.63671875 68.44604492 C-159.55169937 67.58064069 -158.46708442 66.71472922 -157.3828125 65.84838867 C-149.32503248 59.4318182 -141.10957166 53.30342113 -132.63671875 47.44604492 C-131.9509375 46.97021973 -131.26515625 46.49439453 -130.55859375 46.00415039 C-119.60897158 38.44428311 -108.40524108 31.65155783 -96.63671875 25.44604492 C-95.96962891 25.09058594 -95.30253906 24.73512695 -94.61523438 24.36889648 C-76.47758341 14.75864858 -57.71502135 7.78506621 -37.63671875 3.44604492 C-36.43031738 3.17606689 -35.22391602 2.90608887 -33.98095703 2.62792969 C-22.67177212 0.26419407 -11.52720548 -0.04803002 0 0 Z" fill="#FFFFFF" transform="translate(1197.63671875,554.553955078125)"/>
                <path d="M0 0 C0.70527832 0.54978516 1.41055664 1.09957031 2.13720703 1.66601562 C10.54015842 8.26431932 18.58347256 15.17366462 26.36499023 22.49243164 C27.5830282 23.61552921 28.81695847 24.72143836 30.05883789 25.81811523 C37.22880758 32.1580874 44.00529036 38.85252127 50.76000977 45.62963867 C52.69109547 47.56610549 54.62749882 49.49713956 56.56445312 51.42773438 C62.04566658 56.90599734 67.49468452 62.36119782 72.51586914 68.27075195 C75.19058833 71.3872244 78.05036646 74.33250567 80.875 77.3125 C85.70269847 82.44006341 90.26295674 87.67949054 94.65625 93.1875 C97.50173365 96.60208038 100.51588233 99.82790507 103.5625 103.0625 C107.85531072 107.63056932 111.94532661 112.25113421 115.796875 117.203125 C118.11065733 120.14047987 120.49000483 123.01474358 122.88110352 125.88916016 C129.35803677 133.68178886 135.60547772 141.61432808 141.72265625 149.69140625 C144.50698142 153.36564491 147.33646157 157.00228467 150.17993164 160.63085938 C161.63300398 175.25464615 172.55025148 190.19168127 182.97265625 205.56640625 C185.20536657 208.8531193 187.47744316 212.10589221 189.80249023 215.32788086 C193.51054269 220.47392298 197.1439647 225.64725204 200.6484375 230.93359375 C201.07717667 231.57866379 201.50591583 232.22373383 201.94764709 232.88835144 C203.29999661 234.92453447 204.65031457 236.96205026 206 239 C206.64680222 239.97607208 206.64680222 239.97607208 207.30667114 240.97186279 C213.10779232 249.73051238 218.87023565 258.51405707 224.60107422 267.31884766 C226.0443979 269.53634024 227.49375571 271.74922761 228.94970703 273.95849609 C240.06990494 290.86675863 245.58181586 306.3972289 243 327 C241.27735834 334.11071703 237.99706798 339.92402804 234 346 C233.4225 346.886875 232.845 347.77375 232.25 348.6875 C223.10224618 358.08935809 211.45142559 362.992691 198.46459961 363.29248047 C182.93365181 363.41863577 169.51295683 359.59426404 157.81396484 348.88330078 C150.97308053 341.78093449 145.89083033 332.85935339 140.75 324.5 C139.43253466 322.37745332 138.11482353 320.25505919 136.796875 318.1328125 C135.531187 316.08858067 134.2655584 314.04431206 133 312 C124.36449761 298.07328979 115.31415012 284.48191569 106 271 C105.33919434 270.03980957 104.67838867 269.07961914 103.99755859 268.09033203 C91.79983989 250.37101227 79.23442831 232.96062658 66 216 C65.57686523 215.45601562 65.15373047 214.91203125 64.71777344 214.3515625 C57.83296693 205.5047645 50.81103348 196.77391154 43.71337891 188.09716797 C41.95456334 185.94438574 40.20183056 183.78674069 38.44921875 181.62890625 C32.2912005 174.07126202 26.026541 166.69004471 19.37890625 159.55859375 C17.3760414 157.40444518 15.42400168 155.22420052 13.5 153 C6.86973177 145.36803657 0.03140291 137.94570064 -7.17578125 130.85546875 C-9.01389838 128.98586353 -10.72985688 127.05149393 -12.4375 125.0625 C-18.02293744 118.58847024 -24.10264705 112.67348117 -30.6015625 107.125 C-32.53680783 105.41038525 -34.40984157 103.66557599 -36.2734375 101.875 C-55.5078957 83.43188174 -78.30739207 65.0035321 -106.34765625 65.40795898 C-130.25497536 66.58732479 -150.56377978 83.60429643 -167.19140625 99.3671875 C-169.27858931 101.32374019 -171.38138057 103.18807852 -173.5546875 105.04296875 C-178.90916126 109.70452547 -183.8926018 114.74299084 -188.90014648 119.76977539 C-190.5592732 121.43426277 -192.22368051 123.09333447 -193.88867188 124.75195312 C-198.89566852 129.75581666 -203.81954233 134.78675874 -208.41870117 140.17358398 C-211.29097099 143.49108445 -214.35072188 146.63420591 -217.375 149.8125 C-222.3919295 155.12468743 -227.20412874 160.51026317 -231.76171875 166.2265625 C-234.439905 169.54508299 -237.21372124 172.77222729 -240 176 C-245.09921633 181.92197919 -250.07814815 187.92945015 -255 194 C-256.04246664 195.27254691 -257.08547223 196.54465243 -258.12890625 197.81640625 C-263.76268212 204.6955431 -269.29216807 211.61413901 -274.57421875 218.76953125 C-276.40990049 221.2387461 -278.29838612 223.66098288 -280.20703125 226.07421875 C-287.48522548 235.28321699 -294.33072285 244.66654673 -300.88671875 254.40234375 C-303.22516354 257.87449298 -305.61869094 261.29874774 -308.05810547 264.70043945 C-321.86634815 283.96599292 -334.89873897 303.85866896 -347.45703125 323.95703125 C-350.05918352 328.11426258 -352.72917127 332.22375167 -355.4375 336.3125 C-356.02192871 337.20219482 -356.02192871 337.20219482 -356.61816406 338.10986328 C-364.76066042 350.31655804 -375.90239779 358.81869852 -390.18359375 362.57421875 C-404.30669062 364.70933326 -418.10152276 363.70350485 -430.25 355.8125 C-438.80705364 349.35693787 -446.10096055 341.05579791 -448.61328125 330.3984375 C-449.16696969 325.53269063 -449.22469284 320.7062722 -449.25 315.8125 C-449.270625 314.83474609 -449.29125 313.85699219 -449.3125 312.84960938 C-449.36792624 302.36712247 -446.88729532 293.58704131 -441.625 284.5625 C-440.97144531 283.41672485 -440.97144531 283.41672485 -440.3046875 282.24780273 C-434.91179696 272.92480534 -428.9710233 263.95879841 -423 255 C-421.87699394 253.31015508 -420.75399076 251.62030826 -419.631073 249.93040466 C-415.46943394 243.66935533 -411.29617325 237.41614953 -407.1159668 231.16748047 C-405.70050829 229.04862058 -404.28792749 226.92783559 -402.87817383 224.80517578 C-399.09448483 219.10884787 -395.27267124 213.45010732 -391.3125 207.875 C-390.81194092 207.16835205 -390.31138184 206.4617041 -389.7956543 205.73364258 C-378.31250805 189.55341128 -366.59715504 173.57604368 -354.45556641 157.88232422 C-353.42035703 156.5436016 -352.38629821 155.20398893 -351.35302734 153.86376953 C-344.80177645 145.36855987 -338.21768375 136.92913925 -331.296875 128.73046875 C-328.97623647 125.9717505 -326.70469755 123.17772525 -324.4375 120.375 C-320.83885417 115.96049246 -317.07849938 111.73143357 -313.2421875 107.5234375 C-310.95484096 104.94917642 -308.78451729 102.30710511 -306.625 99.625 C-302.53026437 94.5638495 -298.20819338 89.78056797 -293.7734375 85.01953125 C-291.6627814 82.74408266 -289.61188183 80.42304398 -287.57421875 78.08203125 C-276.44400247 65.31900201 -264.45785628 53.35470718 -252.5 41.375 C-251.84434052 40.71675232 -251.18868103 40.05850464 -250.51315308 39.38031006 C-243.85137905 32.69781917 -237.19752844 26.11006858 -230 20 C-228.26654912 18.40046378 -226.53691609 16.79677225 -224.8125 15.1875 C-218.82186497 9.73922699 -212.51575478 4.79441557 -206 0 C-205.34725098 -0.48259277 -204.69450195 -0.96518555 -204.02197266 -1.46240234 C-183.81707673 -16.31627357 -162.67329975 -27.83936471 -138.10449219 -33.49902344 C-136.12172478 -33.97102329 -134.15732913 -34.51836942 -132.1953125 -35.0703125 C-85.78823074 -46.61362496 -36.2921918 -28.34263182 0 0 Z" fill="#FFFFFF" transform="translate(1304,876)"/>
              </svg>
            </div>

            {/* Heading */}
            <h2 className="rsp-contact-h2" style={{ fontFamily: GTA_MD, fontSize: 52, fontWeight: 500, letterSpacing: '-0.05em', lineHeight: '1.05em', color: 'white', marginBottom: 20 }}>
              Ready to ship Voice AI<br/>that works?
            </h2>

            {/* Subtext */}
            <p style={{ fontFamily: GTA, fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.65em', color: 'rgba(255,255,255,0.5)', marginBottom: 44, maxWidth: 440 }}>
              Get started with Arctan for free, no credit card required. Or book a 30-minute call with our team.
            </p>

            {/* CTA buttons */}
            <div className="rsp-contact-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' as const }}>
              <button
                onClick={openTally}
                style={{ padding: '14px 36px', borderRadius: 9999, background: D.lime, color: '#ffffff', fontFamily: GTA, fontWeight: 400, fontSize: 16, letterSpacing: '-0.01em', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
              >
                Try it Free
              </button>
              <a
                href="https://calendly.com/rohan-arctan/30min?month=2025-10"
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '14px 36px', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', color: 'white', fontFamily: GTA, fontWeight: 400, fontSize: 16, letterSpacing: '-0.01em', border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' as const }}
              >
                Get a Demo
              </a>
            </div>

          </div>
        </section>

        {/* ══════ FOOTER ══════ */}
        <footer className="rsp-footer" style={{ background: D.white, borderTop: `1px solid ${D.border}`, padding: '52px 40px 36px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Top row: brand left, nav links right */}
            <div className="rsp-footer-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 40, marginBottom: 48 }}>

              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <img src={`${BP}/logos/arctan-mark.svg`} alt="Arctan logomark" width="34" height="20" style={{ display: 'block' }} />
                  <span style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', color: D.ink }}>arctan</span>
                </div>
                <p style={{ fontFamily: GTA, fontSize: 14, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '1.7em', color: D.inkSub, maxWidth: 260, margin: 0 }}>
                  The audio intelligence layer for Voice AI.
                </p>
              </div>

            </div>

            {/* Bottom row: copyright left, social + legal right */}
            <div className="rsp-footer-bottom" style={{ borderTop: `1px solid ${D.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16 }}>
              <span style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, color: D.muted }}>© 2026 Arctan, Inc. All rights reserved.</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {/* Legal */}
                <a href="/legal/privacy-policy" style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em', color: D.muted, textDecoration: 'none' }}>Privacy Policy</a>
                <a href="/legal/terms-and-conditions" style={{ fontFamily: GTA, fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em', color: D.muted, textDecoration: 'none' }}>Terms of Service</a>
                {/* Social */}
                <a href="https://x.com/ArctanAI" target="_blank" rel="noopener noreferrer" style={{ width: 30, height: 30, borderRadius: 8, background: D.offWhite, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.muted, fontFamily: GTA, fontSize: 13, textDecoration: 'none' }}>𝕏</a>
                <a href="https://www.linkedin.com/company/arctan-ai/" target="_blank" rel="noopener noreferrer" style={{ width: 30, height: 30, borderRadius: 8, background: D.offWhite, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.muted, fontFamily: GTA, fontSize: 13, textDecoration: 'none' }}>in</a>
              </div>
            </div>

          </div>
        </footer>
      </div>
    </>
  )
}
