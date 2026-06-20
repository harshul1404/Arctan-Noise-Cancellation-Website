import Link from 'next/link'

const GTA    = '"GT America Regular", "GT America Regular Placeholder", sans-serif'
const GTA_MD = '"GT America Trial Md", "GT America Trial Md Placeholder", sans-serif'
const TEAL   = '#1A8A70'
const INK    = '#1B0624'
const MUTED  = '#6B6866'
const OFF    = '#F7F7F5'
const WHITE  = '#FFFFFF'
const BORDER = 'rgba(0,0,0,0.08)'

export default function PrivacyPolicy() {
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
        .legal-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(247,247,245,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${BORDER};
          height: 60px;
        }
        .legal-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 40px;
          height: 100%; display: flex; align-items: center; justify-content: space-between;
        }
        .legal-section h2 {
          font-family: ${GTA_MD};
          font-size: 18px;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: ${INK};
          margin: 0 0 12px;
        }
        .legal-section p, .legal-section li {
          font-family: ${GTA};
          font-size: 16px;
          font-weight: 400;
          line-height: 1.7em;
          letter-spacing: -0.01em;
          color: ${MUTED};
        }
        .legal-section ul {
          padding-left: 20px;
          margin: 8px 0;
        }
        .legal-section li { margin-bottom: 4px; }
        @media (max-width: 768px) {
          .legal-nav-inner { padding: 0 20px; }
          .legal-content { padding: 48px 20px 80px !important; }
          .legal-title { font-size: 36px !important; }
        }
      `}</style>

      <nav className="legal-nav">
        <div className="legal-nav-inner">
          <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logos/arctan-mark.svg" alt="Arctan logomark" width="34" height="20" style={{ display: 'block' }} />
            <span style={{ fontFamily: GTA, fontSize: 16, fontWeight: 400, letterSpacing: '-0.02em', color: INK }}>arctan</span>
          </Link>
          <Link href="/landing" style={{ fontFamily: GTA, fontSize: 14, fontWeight: 400, color: MUTED, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            ← Back to home
          </Link>
        </div>
      </nav>

      <main className="legal-content" style={{ maxWidth: 720, margin: '0 auto', padding: '72px 40px 120px' }}>
        <div style={{ marginBottom: 56 }}>
          <span style={{ fontFamily: "'Fragment Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: TEAL, textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>Legal</span>
          <h1 className="legal-title" style={{ fontFamily: GTA_MD, fontSize: 48, fontWeight: 500, letterSpacing: '-0.05em', lineHeight: '1.05em', color: INK, marginBottom: 16 }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: GTA, fontSize: 14, color: MUTED, letterSpacing: '-0.01em' }}>
            Last updated: January 9, 2025
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          <div className="legal-section">
            <h2>1. Information We Collect</h2>
            <p style={{ marginBottom: 12 }}><strong style={{ color: INK }}>Personal Information</strong></p>
            <ul>
              <li>Contact details (name, email address, phone number) provided during account creation</li>
              <li>Payment information for purchases and subscriptions</li>
            </ul>
            <p style={{ marginTop: 16, marginBottom: 12 }}><strong style={{ color: INK }}>Usage Data</strong></p>
            <ul>
              <li>Technical details: IP address, browser type, operating system, device information</li>
              <li>Interaction metrics: pages visited, features used, session duration</li>
            </ul>
            <p style={{ marginTop: 16, marginBottom: 12 }}><strong style={{ color: INK }}>User-Provided Data</strong></p>
            <ul>
              <li>Content, queries, or audio files uploaded to our AI tools</li>
              <li>Feedback and survey responses</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>We utilize data to deliver and enhance our services, process payments, manage accounts, and provide communications regarding updates and support. We also analyze usage patterns to improve our audio intelligence algorithms and maintain security and legal compliance.</p>
          </div>

          <div className="legal-section">
            <h2>3. How We Share Your Information</h2>
            <p>Information is shared only with trusted service providers necessary for our operations. We disclose data when legally required or during business transactions such as mergers or acquisitions. We do not sell your personal information to third parties.</p>
          </div>

          <div className="legal-section">
            <h2>4. Data Security</h2>
            <p>Arctan applies industry-standard protections including encryption, access controls, and regular security audits. While we take every precaution, no system can guarantee complete security. We notify affected users promptly in the event of any data breach.</p>
          </div>

          <div className="legal-section">
            <h2>5. Cookies and Tracking Technologies</h2>
            <p>Our site uses cookies to enhance your browsing experience, analyze traffic, and deliver relevant content. You may manage cookie preferences through your browser settings. Disabling cookies may affect certain features of our platform.</p>
          </div>

          <div className="legal-section">
            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have the right to request access to, correction of, or deletion of your personal data (subject to legal obligations). You may also opt out of marketing communications at any time. To exercise any of these rights, contact us at{' '}
              <a href="mailto:info@arctan.ai" style={{ color: TEAL, textDecoration: 'none' }}>info@arctan.ai</a>.
            </p>
          </div>

          <div className="legal-section">
            <h2>7. Third-Party Links</h2>
            <p>Our platform may contain links to external websites. Arctan is not responsible for the privacy practices of those sites and recommends reviewing their policies independently before sharing any information.</p>
          </div>

          <div className="legal-section">
            <h2>8. Children's Privacy</h2>
            <p>Our services are not designed for users under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.</p>
          </div>

          <div className="legal-section">
            <h2>9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Updates are posted with a new effective date at the top of this page. Continued use of our services after any change constitutes acceptance of the updated policy.</p>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32 }}>
            <p style={{ fontFamily: GTA, fontSize: 14, color: MUTED, letterSpacing: '-0.01em' }}>
              Questions about this policy? Contact us at{' '}
              <a href="mailto:info@arctan.ai" style={{ color: TEAL, textDecoration: 'none' }}>info@arctan.ai</a>
            </p>
          </div>
        </div>
      </main>

      <footer style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: '28px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: GTA, fontSize: 13, color: MUTED }}>© 2026 Arctan, Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/legal/privacy-policy" style={{ fontFamily: GTA, fontSize: 13, color: TEAL, textDecoration: 'none', letterSpacing: '-0.01em' }}>Privacy Policy</Link>
            <Link href="/legal/terms-and-conditions" style={{ fontFamily: GTA, fontSize: 13, color: MUTED, textDecoration: 'none', letterSpacing: '-0.01em' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
