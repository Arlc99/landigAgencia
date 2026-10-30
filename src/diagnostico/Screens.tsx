import { Bot, CalendarCheck, CircleCheck, ChevronRight, PenLine, RotateCcw, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { CALENDAR_URL } from '../../shared/brand';
import type { ClientDiagnosis, SurveyAnswers } from '../../shared/schema';
import { LogoMark } from '../components/primitives';
import { PRIORITY_ICONS, SALES_ROUTE } from './icons';
import type { SubmissionPhase } from './useSubmission';
import { Button, LinkButton } from './ui';

const HINTS = [
  'Revisando tus respuestas…',
  'Entendiendo qué necesita tu negocio…',
  'Armando tus recomendaciones personalizadas…',
  'Preparando tu diagnóstico JUALU…',
];

/** Pantalla mientras se prepara el diagnóstico, o de error con reintento. */
export function AnalyzingScreen({
  phase,
  error,
  errorCode,
  onRetry,
  onEdit,
}: {
  phase: SubmissionPhase;
  error: string | null;
  errorCode?: string | null;
  onRetry: () => void;
  onEdit: () => void;
}) {
  const isError = phase === 'error';
  // Con el límite diario alcanzado reintentar no sirve: se invita a agendar una cita.
  const blocked = isError && (errorCode === 'daily_limit' || errorCode === 'already_done');

  return (
    <div className="flex flex-col items-center py-4 text-center" aria-live="polite">
      {isError ? (
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10">
          <TriangleAlert className="h-10 w-10 text-red-300" aria-hidden />
        </div>
      ) : (
        <Orb />
      )}

      <h2 className="mt-8 text-2xl font-semibold tracking-tight">
        {blocked ? (errorCode === 'already_done' ? 'Ya tienes tu diagnóstico' : 'Llegaste al límite de hoy') : isError ? 'No pudimos preparar tu diagnóstico' : 'Preparando tu diagnóstico'}
      </h2>

      {isError ? (
        <p role="alert" className="mt-3 max-w-sm text-sm leading-relaxed text-red-200/90">
          {error}
        </p>
      ) : (
        <>
          <RotatingHint />
          <p className="mt-2 text-xs text-white/35">Puede tardar unos segundos.</p>
        </>
      )}

      {blocked && (
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <LinkButton
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
            className="flex-1"
          >
            Agendar cita
          </LinkButton>
          <LinkButton variant="secondary" href="/" className="flex-1">
            Volver al inicio
          </LinkButton>
        </div>
      )}

      {isError && !blocked && (
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Button onClick={onRetry} icon={<RotateCcw className="h-4 w-4" aria-hidden />} className="flex-1">
            Reintentar
          </Button>
          <Button variant="secondary" onClick={onEdit} icon={<PenLine className="h-4 w-4" aria-hidden />} className="flex-1">
            Revisar respuestas
          </Button>
        </div>
      )}
    </div>
  );
}

function Orb() {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-cyan-400/40"
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
        />
      ))}
      <motion.span
        className="absolute inset-3 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(0,210,255,0.7),transparent_60%)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
      />
      <span className="absolute inset-[18px] rounded-full bg-[#0c0c0c]" />
      <motion.span
        className="liquid-glass relative flex h-16 w-16 items-center justify-center rounded-2xl"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bot className="h-8 w-8 text-cyan-300" />
      </motion.span>
    </div>
  );
}

function RotatingHint() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % HINTS.length), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mt-3 h-6 w-full max-w-sm overflow-hidden text-sm text-white/50">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {HINTS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/**
 * Ruta de ventas JUALU: web → redes → WhatsApp → pago en línea → bot. Se iluminan las paradas
 * que el diagnóstico recomienda; las demás quedan tenues para mostrar el sistema completo.
 */
function SalesRoute({ active }: { active: Set<string> }) {
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Tu sistema de ventas con JUALU">
      {SALES_ROUTE.map((stop, index) => {
        const on = active.has(stop.id);
        const Icon = stop.icon;
        return (
          <li key={stop.id} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[22px] h-px w-full ${on || active.has(SALES_ROUTE[index - 1]!.id) ? 'bg-cyan-300/50' : 'bg-white/10'}`}
              />
            )}
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 220, damping: 16 }}
              className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border ${
                on
                  ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_-4px_rgba(0,210,255,0.6)]'
                  : 'border-white/10 bg-[#0c0c0c] text-white/30'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </motion.span>
            <span className={`mt-2 text-[11px] leading-tight sm:text-xs ${on ? 'font-medium text-white' : 'text-white/35'}`}>
              {stop.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Diagnóstico mínimo para el cliente: dónde está hoy, 3 problemas y una solución de una línea por cada uno.
 * La idea es que vea que tiene problemas con solución y que esa solución la da JUALU.
 * Todo se muestra como texto plano (nunca HTML). La clasificación y la estrategia de venta son internas.
 */
export function ResultScreen({
  answers,
  diagnostico,
  onRestart,
}: {
  answers: SurveyAnswers;
  diagnostico: ClientDiagnosis;
  onRestart: () => void;
}) {
  const firstName = answers.contacto.nombre.split(/\s+/)[0] ?? answers.contacto.nombre;
  const icons = new Set(diagnostico.problemas.map((p) => p.icono));
  const text = diagnostico.problemas
    .flatMap((p) => [p.problema, p.solucion])
    .join(' ')
    .toLowerCase();
  const active = new Set(
    SALES_ROUTE.filter((stop) => stop.matches.some((m) => icons.has(m)) || stop.words.some((w) => text.includes(w))).map(
      (stop) => stop.id,
    ),
  );

  return (
    <article className="text-left" aria-labelledby="diagnostico-titulo">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">JUALU</p>
            <p className="text-[11px] text-white/45">Diagnóstico gratuito</p>
          </div>
        </div>
        <p className="text-xs text-white/45">Para {firstName}</p>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-cyan-300/80">Dónde estás hoy</p>
        <h2 id="diagnostico-titulo" className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {diagnostico.titulo}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">{diagnostico.resumen}</p>
      </motion.div>

      <p className="mt-7 text-xs font-medium uppercase tracking-widest text-amber-300/80">
        Lo que está frenando tus ventas
      </p>
      <ol className="mt-3 space-y-3" aria-label="Problemas encontrados">
        {diagnostico.problemas.map((item, index) => {
          const Icon = PRIORITY_ICONS[item.icono];
          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + index * 0.12 }}
              className="liquid-glass rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-start gap-3.5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 text-amber-200"
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">Problema {index + 1}</p>
                  <h3 className="mt-0.5 text-[16px] font-semibold leading-snug">{item.problema}</h3>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.07] px-3.5 py-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
                <p className="text-sm leading-snug text-white/90">
                  <span className="font-semibold text-cyan-200">Solución JUALU: </span>
                  {item.solucion}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-6 rounded-2xl border border-cyan-300/25 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(0,210,255,0.1), rgba(11,37,81,0.35))' }}
        aria-label="Tu sistema de ventas"
      >
        <p className="text-center text-xs font-medium uppercase tracking-widest text-cyan-300/80">
          Tu sistema de ventas con JUALU
        </p>
        <div className="mt-4">
          <SalesRoute active={active} />
        </div>
      </motion.section>

      <p className="mt-6 text-center text-[15px] font-medium leading-relaxed text-white/85">{diagnostico.cierre}</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <LinkButton
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
          iconRight={<ChevronRight className="h-4 w-4" aria-hidden />}
          className="sm:min-w-56"
        >
          Agendar mi cita gratis
        </LinkButton>
        <LinkButton variant="secondary" href="/">
          Volver al inicio
        </LinkButton>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-white/40">Un asesor de JUALU también se pondrá en contacto contigo.</p>
        <Button variant="ghost" onClick={onRestart} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
          Hacer otro diagnóstico
        </Button>
      </div>
    </article>
  );
}
