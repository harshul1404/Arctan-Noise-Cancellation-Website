import Link from 'next/link'

const GTA    = '"GT America Regular", "GT America Regular Placeholder", sans-serif'
const GTA_MD = '"GT America Trial Md", "GT America Trial Md Placeholder", sans-serif'
const TEAL   = '#1A8A70'
const INK    = '#1B0624'
const MUTED  = '#6B6866'
const OFF    = '#F7F7F5'
const WHITE  = '#FFFFFF'
const BORDER = 'rgba(0,0,0,0.08)'

export default function TermsAndConditions() {
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
            Terms of Service
          </h1>
          <p style={{ fontFamily: GTA, fontSize: 14, color: MUTED, letterSpacing: '-0.01em' }}>
            Last updated: January 14, 2025
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          <div className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using Arctan's platform and services, you confirm that you are at least 18 years of age (or have obtained parental consent) and agree to be bound by these Terms of Service. These Terms form a legally binding agreement between you and Arctan Technologies, Inc.</p>
          </div>

          <div className="legal-section">
            <h2>2. Services Provided</h2>
            <p>Arctan delivers AI-powered audio intelligence tools including noise suppression, speaker isolation, echo cancellation, and voice activity detection. All features are subject to availability and may be updated, modified, or discontinued at our discretion. We will make reasonable efforts to notify users of material changes.</p>
          </div>

          <div className="legal-section">
            <h2>3. User Responsibilities</h2>
            <p>You agree to use our services lawfully and in compliance with all applicable laws and regulations. The following are strictly prohibited:</p>
            <ul>
              <li>Reverse engineering or attempting to extract source code from our systems</li>
              <li>Reselling, sublicensing, or redistributing our services without written permission</li>
              <li>Tampering with, disrupting, or circumventing our AI systems or infrastructure</li>
              <li>Using our services to process or transmit unlawful, harmful, or deceptive content</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>4. Privacy and Data Use</h2>
            <p>By accessing our platform, you consent to the collection and use of data as described in our{' '}
              <Link href="/legal/privacy-policy" style={{ color: TEAL, textDecoration: 'none' }}>Privacy Policy</Link>.
              {' '}Arctan may use aggregated, anonymized data to improve our models and algorithms. Sensitive or personally identifiable information will never be shared without your consent, except as required by law.
            </p>
          </div>

          <div className="legal-section">
            <h2>5. Intellectual Property</h2>
            <p>All content, designs, AI algorithms, SDKs, and documentation provided by Arctan are the intellectual property of Arctan Technologies, Inc. and are protected by applicable copyright, trademark, and trade secret laws. Duplication, distribution, or derivative use requires express written permission from Arctan.</p>
          </div>

          <div className="legal-section">
            <h2>6. Limitation of Liability</h2>
            <p>Arctan's services are provided "as is" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability or fitness for a particular purpose. Arctan disclaims responsibility for any indirect, incidental, or consequential losses or damages arising from your use of our services. AI outputs carry no guarantee of accuracy.</p>
          </div>

          <div className="legal-section">
            <h2>7. Termination</h2>
            <p>Arctan reserves the right to suspend or terminate your access to our services at any time if you violate these Terms of Service. Upon termination, your right to use the platform ceases immediately. Provisions that by their nature should survive termination will remain in effect.</p>
          </div>

          <div className="legal-section">
            <h2>8. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Updates are posted with a new effective date at the top of this page. Continued use of our services after any update constitutes acceptance of the revised Terms. We encourage you to review this page periodically.</p>
          </div>

          <div className="legal-section">
            <h2>9. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Delaware.</p>
          </div>

          <div className="legal-section">
            <h2>10. Contact</h2>
            <p>For questions or concerns regarding these Terms of Service, please contact us at{' '}
              <a href="mailto:info@arctan.ai" style={{ color: TEAL, textDecoration: 'none' }}>info@arctan.ai</a>.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32 }}>
            <p style={{ fontFamily: GTA, fontSize: 14, color: MUTED, letterSpacing: '-0.01em' }}>
              Questions about these terms? Contact us at{' '}
              <a href="mailto:info@arctan.ai" style={{ color: TEAL, textDecoration: 'none' }}>info@arctan.ai</a>
            </p>
          </div>
        </div>
      </main>

      <footer style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: '28px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: GTA, fontSize: 13, color: MUTED }}>© 2026 Arctan, Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/legal/privacy-policy" style={{ fontFamily: GTA, fontSize: 13, color: MUTED, textDecoration: 'none', letterSpacing: '-0.01em' }}>Privacy Policy</Link>
            <Link href="/legal/terms-and-conditions" style={{ fontFamily: GTA, fontSize: 13, color: TEAL, textDecoration: 'none', letterSpacing: '-0.01em' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
