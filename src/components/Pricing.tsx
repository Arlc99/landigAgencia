import { useState } from 'react';
import { VerMasButton } from './primitives';

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
    monthly: 'Plan Anuncio Directo',
    yearly: 'Estrategia + Meta Ads + Pauta',
    desc: 'Estrategia de captación con anuncios en Meta dirigidos a redes sociales',
    features: [
      'Estrategia de captación personalizada',
      'Diseño de anuncios para Meta Ads',
      'Segmentación de audiencia',
      'Campañas dirigidas a redes sociales',
      'Optimizacion',
      'Reunión',
    ],
  },
  {
    tier: '02',
    monthly: 'Plan Landing Esencial',
    yearly: 'Landing + Meta + Pauta',
    desc: 'Landing con diseño responsive. con anuncios en Meta dirigidos.',
    features: [
      'Anuncio Personalizado',
      'Landing page',
      'Integración con Facebook e Instagram',
      'Sección de servicios y ubicación',
      'Diseño responsive (móvil y desktop)',
      'hosting gratis',
      'conexion a dominio(opcional)'
    ],
  },
  {
    tier: '03',
    monthly: 'Plan Landing Profesional',
    yearly: 'Landing + Analítica + Pauta',
    desc: 'Landing personalizada con Google Analytics y formulario profesional. La mejor opción para medir resultados reales.',
    features: [
      'Plan Landing Esencial',
      'Google Analytics 4 configurado',
      'Formulario profesional de captura',
      'Botón de WhatsApp Business',
      'Reportes semanales',
    ],
  },
  {
    tier: '04',
    monthly: 'Plan Automatización Premium',
    yearly: 'Landing + Automatización + IA',
    desc: 'Sistema completo de captación y automatización. Chatbot con IA, agendamiento automático y seguimiento de leads.',
    features: [
      'Todo lo del Plan Landing Profesional',
      'Chatbot con IA (API Key)',
      'Automatización de citas',
      'Respuestas automáticas por WhatsApp',
      'Email marketing automatizado',
      'Integración con Google Sheets / CRM',
      'Pauta multi-canal (Google + Meta + TikTok)',
      'Retargeting de visitantes',
      'Reportes en tiempo real',
      'Reunión estratégica',
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
    <section id="servicios" className="c3-pricing-section py-20">
      {/* Filtro SVG (mantenido igual) */}
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

      {/* Watermark (mantenido igual) */}
      <div className="c3-watermark-container">
        <div className="c3-watermark-main">
          <span className="c3-watermark-line-1">CRECE CON</span>
          <span className="c3-watermark-line-2">ESTRATEGIA</span>
        </div>
      </div>

      {/* 
        CONTENEDOR GRID 
        - grid-cols-1 en móvil
        - md:grid-cols-2 en tablet
        - lg:grid-cols-4 en desktop
        - items-stretch para que todas las tarjetas midan lo mismo
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`
              c3-card 
              flex flex-col 
              h-full 
              min-h-[600px]  /* Altura mínima fija para consistencia */
              p-6 
              rounded-3xl 
              bg-black/40 
              backdrop-blur-md 
              border border-white/10
              ${plan.pro ? 'c3-card-pro border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
            `}
          >
            {/* Cabecera de la tarjeta */}
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2 font-mono">{plan.tier}</div>
              <div className="text-xl font-bold text-white mb-2 leading-tight">
                {plan.monthly === null ? 'Free' : yearly ? plan.yearly : plan.monthly}
              </div>
              <div className="text-sm text-gray-400 leading-relaxed">
                {plan.desc}
              </div>
            </div>

            {/* 
              LISTA DE CARACTERÍSTICAS 
              - flex-1: Ocupa todo el espacio sobrante, empujando el botón hacia abajo.
              - overflow-y-auto: Si la lista es muy larga, permite scroll interno sin romper la tarjeta.
            */}
            <ul className="flex-1 flex flex-col gap-3 mb-6 overflow-y-auto pr-2 custom-scrollbar">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="c3-check flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            {/* 
              BOTÓN 
              - mt-auto: Asegura que el botón siempre esté al fondo.
            */}
            <div className="mt-auto pt-4 border-t border-white/5">
              <VerMasButton />
            </div>

          </div>
        ))}
      </div>

      {/* Toggle Yearly (mantenido igual) */}
      <div className="c3-toggle-wrap flex items-center justify-center gap-4 mt-12">
        <span className="text-sm text-white/70">Yearly</span>
        <button
          className={`c3-toggle relative w-14 h-8 rounded-full transition-colors ${yearly ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => setYearly((v) => !v)}
          aria-pressed={yearly}
        >
          <span className={`c3-toggle-knob absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${yearly ? 'translate-x-6' : ''}`} />
        </button>
      </div>
    </section>
  );
}