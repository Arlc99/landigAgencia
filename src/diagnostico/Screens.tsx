import { Bot, CalendarCheck, CircleCheckBig, PenLine, RotateCcw, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { SurveyAnswers } from '../../shared/schema';
import { CALENDAR_URL } from './brand';
import type { SubmissionPhase } from './useSubmission';
import { Button, LinkButton } from './ui';

const HINTS = [
  'Revisando tus respuestas…',
  'Entendiendo qué necesita tu negocio…',
  'Preparando tu diagnóstico para nuestro equipo…',
  'Guardando tu información de forma segura…',
];

/** Pantalla mientras se envía el diagnóstico, o de error con reintento. No muestra resultados del análisis. */
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
        {isError ? 'No pudimos completar el envío' : 'Enviando tu diagnóstico'}
      </h2>

      {isError ? (
        <p role="alert" className="mt-3 max-w-sm text-sm leading-relaxed text-red-200/90">
          {error}
        </p>
      ) : (
        <RotatingHint />
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
 * Pantalla final para el cliente: solo agradece y confirma el contacto.
 * El análisis de IA es interno y nunca se muestra aquí (está en Google Sheets).
 */
export function ResultScreen({ answers, onRestart }: { answers: SurveyAnswers; onRestart: () => void }) {
  const firstName = answers.contacto.nombre.split(/\s+/)[0] ?? answers.contacto.nombre;

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="liquid-glass flex h-20 w-20 items-center justify-center rounded-full"
      >
        <CircleCheckBig className="h-10 w-10 text-cyan-300" aria-hidden />
      </motion.div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">¡Gracias por responder, {firstName}!</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
        Recibimos tu diagnóstico. Un asesor de JUALU revisará tu caso y se pondrá en contacto contigo muy pronto.
      </p>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/60">
        Si prefieres avanzar más rápido, puedes agendar una cita ahora mismo.
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
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

      <Button variant="ghost" onClick={onRestart} icon={<RotateCcw className="h-4 w-4" aria-hidden />} className="mt-6">
        Responder otro diagnóstico
      </Button>
    </div>
  );
}
