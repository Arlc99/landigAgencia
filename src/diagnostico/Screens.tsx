import {
  Bot,
  CalendarCheck,
  CircleCheck,
  PenLine,
  RotateCcw,
  Rocket,
  TriangleAlert,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ClientDiagnosis, SurveyAnswers } from '../../shared/schema';
import { LogoMark } from '../components/primitives';
import { CALENDAR_URL } from '../../shared/brand';
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
  onRetry,
  onEdit,
}: {
  phase: SubmissionPhase;
  error: string | null;
  onRetry: () => void;
  onEdit: () => void;
}) {
  const isError = phase === 'error';

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
        {isError ? 'No pudimos preparar tu diagnóstico' : 'Preparando tu diagnóstico'}
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

      {isError && (
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
 * Diagnóstico personalizado para el cliente. Todo se muestra como texto plano (nunca HTML).
 * La clasificación y la estrategia de venta son internas y no llegan aquí.
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
  const today = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <article className="text-left" aria-labelledby="diagnostico-titulo">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">JUALU</p>
            <p className="text-[11px] text-white/45">Diagnóstico gratuito</p>
          </div>
        </div>
        <p className="text-xs text-white/45">
          Preparado para {firstName} · {today}
        </p>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h2 id="diagnostico-titulo" className="mt-6 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {diagnostico.titulo}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">{diagnostico.resumen}</p>
      </motion.div>

      <section className="mt-8" aria-label="Tus prioridades">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-300/80">Por dónde empezar</p>
        <ol className="mt-4 space-y-4">
          {diagnostico.prioridades.map((item, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + index * 0.1 }}
              className="liquid-glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-semibold leading-snug">{item.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{item.por_que}</p>
                  <ul className="mt-3 space-y-2">
                    {item.pasos.map((paso, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
                        <span>{paso}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative mt-6 overflow-hidden rounded-2xl border border-cyan-300/30 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(0,210,255,0.12), rgba(11,37,81,0.35))' }}
        aria-label="Siguiente nivel"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
            <Rocket className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-[16px] font-semibold">Lo que haríamos juntos</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">{diagnostico.siguiente_nivel}</p>
          </div>
        </div>
      </motion.section>

      <p className="mt-6 text-center text-[15px] leading-relaxed text-white/70">{diagnostico.cierre}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <LinkButton
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
          className="sm:min-w-52"
        >
          Agendar mi cita gratis
        </LinkButton>
        <LinkButton variant="secondary" href="/">
          Volver al inicio
        </LinkButton>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-white/40">
          Un asesor de JUALU también se pondrá en contacto contigo para acompañarte con este plan.
        </p>
        <Button variant="ghost" onClick={onRestart} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
          Hacer otro diagnóstico
        </Button>
      </div>

      <p className="mt-2 border-t border-white/10 pt-4 text-center text-[11px] text-white/30">
        Preparado por el equipo JUALU · Cali, Colombia
      </p>
    </article>
  );
}
