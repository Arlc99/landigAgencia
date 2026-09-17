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
    tier: '01',
    monthly: 'Landing pages',
    yearly: 'Landing pages',
    desc: 'Diseñamos páginas de aterrizaje optimizadas para la velocidad, la claridad y la acción.',
    features: [
      'Optimización de velocidad',
      'Diseño enfocado en conversión',
      'Claridad en el mensaje',
      'Llamados a la acción efectivos',
      'Integración con analíticas',
    ],
  },
  {
    tier: '02',
    monthly: 'Captación de leads',
    yearly: 'Captación de leads',
    desc: 'Implementamos embudos de venta y formularios inteligentes para que ningún lead se pierda.',
    features: [
      'Embudos de venta',
      'Formularios inteligentes',
      'Conexión con tu CRM',
      'Seguimiento automatizado',
      'Gestión de bases de datos',
    ],
  },
  {
    tier: '03',
    monthly: 'Contenido estratégico',
    yearly: 'Contenido estratégico',
    desc: 'Creamos contenido que educa y posiciona tu marca como autoridad en tu sector.',
    features: [
      'Textos persuasivos',
      'Artículos para blog',
      'Guiones para video',
      'Estrategia de contenidos',
      'Calendario editorial',
    ],
  },
  {
    tier: '04',
    monthly: 'Gestión de canales',
    yearly: 'Gestión de canales',
    desc: 'Administramos tus redes sociales y campañas publicitarias midiendo cada métrica.',
    features: [
      'Gestión de redes sociales',
      'Campañas publicitarias',
      'Análisis de métricas (ROI)',
      'Optimización de presupuesto',
      'Reportes de rendimiento',
    ],
  },
  {
    tier: '05',
    monthly: 'Presencia digital',
    yearly: 'Presencia digital',
    desc: 'Construimos toda tu estructura digital desde cero, desde la identidad hasta la técnica.',
    features: [
      'Identidad visual',
      'Configuración técnica',
      'Selección de plataformas',
      'Estructura de marca',
      'Lanzamiento inicial',
    ],
  },
  {
    tier: '06',
    monthly: 'Otras soluciones',
    yearly: 'Otras soluciones',
    desc: 'Automatizaciones, email marketing, SEO técnico y consultoría personalizada.',
    features: [
      'Automatizaciones',
      'Email marketing',
      'SEO técnico',
      'Consultoría personalizada',
      'Adaptación a tu negocio',
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
              {/* Mantenemos la lógica original, pero como monthly y yearly son iguales, siempre muestra lo mismo */}
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