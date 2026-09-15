import { useState } from 'react';

type Plan = {
  tier: string;
  monthly: string | null;
  yearly: string | null;
  desc: string;
  features: string[];
  pro?: boolean;
};

const plans: Plan[] = [
  {
    tier: 'Free',
    monthly: null,
    yearly: null,
    desc: 'REUNION DE 15 MINUTOS DE ACCESORAMIENTO',
    features: [
      'CONTEXTO',
      'PEQUEÑOS CAMBIOS',
      'IDEA ESTRATEGICA',
      'HERRAMIENTAS',
      'NUESTROS SERVICIOS',
    ],
  },
  {
    tier: 'Standard',
    monthly: '$9,99/m',
    yearly: '$99,99/y',
    desc: 'For freelancers and small teams who need more freedom and flexibility.',
    features: [
      'Up to 50 projects in the cloud',
      'Export up to 4K',
      'Advanced editing toolkit',
      'Team collaboration (up to 5 members)',
      'Access to premium template library',
    ],
  },
  {
    tier: 'Pro',
    monthly: '$19,99/m',
    yearly: '$199,99/y',
    desc: 'For studios, agencies, and professional creators working with brands.',
    features: [
      'Unlimited projects',
      'Export up to 8K + animations',
      'AI-powered content generation tools',
      'Unlimited team members',
      'Brand customization',
    ],
    pro: true,
  },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 6L9 17L4 12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="planes" className="c3-pricing-section">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="c3-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.5"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.075} />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>

      <div className="c3-watermark-container">
        <div className="c3-watermark-main">
          <span className="c3-watermark-line-1">CRECE CON</span>
          <span className="c3-watermark-line-2">ESTRATEGIA</span>
        </div>
      </div>

      <div className="c3-grid">
        {plans.map((plan) => (
          <div key={plan.tier} className={`c3-card ${plan.pro ? 'c3-card-pro' : ''}`}>
            <div className="c3-tier-small">{plan.tier}</div>
            <div className="c3-tier-large">
              {plan.monthly === null ? 'Free' : yearly ? plan.yearly : plan.monthly}
            </div>
            <div className="c3-desc">{plan.desc}</div>
            <ul className="c3-list">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="c3-check">
                    <CheckIcon />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="c3-btn">Choose Plan</button>
          </div>
        ))}
      </div>

      <div className="c3-toggle-wrap">
        <span className="text-sm text-white/70">Yearly</span>
        <button
          className={`c3-toggle ${yearly ? 'active' : ''}`}
          onClick={() => setYearly((v) => !v)}
          aria-pressed={yearly}
        >
          <span className="c3-toggle-knob" />
        </button>
      </div>
    </section>
  );
}
