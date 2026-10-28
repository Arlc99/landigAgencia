import { ArrowLeft, ArrowRight, Check, Lock, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SurveyAnswers } from '../../shared/schema';
import { BudgetStep, ContactStep, DiagnosisStep, ObjectiveStep, UrgencyStep } from './Steps';
import { Button } from './ui';
import { finalizeDraft, LAST_STEP, STEPS, type useSurvey } from './useSurvey';

interface Props {
  survey: ReturnType<typeof useSurvey>;
  onSubmit: (answers: SurveyAnswers, honeypot: string) => void;
}

const variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
};

function ProgressSteps({
  current,
  maxReached,
  onSelect,
}: {
  current: number;
  maxReached: number;
  onSelect: (step: number) => void;
}) {
  const percent = Math.round(((current + 1) / STEPS.length) * 100);

  return (
    <nav aria-label="Progreso del diagnóstico">
      <div className="mb-3 flex items-center justify-between text-xs font-medium">
        <span className="text-cyan-300">
          Paso {current + 1} de {STEPS.length}
        </span>
        <span className="text-white/40">{percent}% completado</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Avance"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#0B2551] via-[#A4F4FD] to-[#00d2ff]"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <ol className="mt-4 hidden grid-cols-5 gap-2 sm:grid">
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= maxReached && !active;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(index)}
                aria-current={active ? 'step' : undefined}
                className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg py-1 text-[11px] font-medium transition disabled:cursor-default enabled:hover:text-white"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${
                    active
                      ? 'border-cyan-300 bg-cyan-400/15 text-cyan-300'
                      : done
                        ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300'
                        : 'border-white/15 text-white/40'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : index + 1}
                </span>
                <span className={active ? 'text-white' : done ? 'text-white/70' : 'text-white/40'}>{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SurveyWizard({ survey, onSubmit }: Props) {
  const { step, maxStep, direction, draft, errors, dispatch, goTo } = survey;
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [honeypot, setHoneypot] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Lleva el foco al título del paso para lectores de pantalla y teclado.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const heading = headingRef.current;
    heading?.focus({ preventScroll: true });
    if (heading && heading.getBoundingClientRect().top < 80) {
      heading.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const showAllErrors = Boolean(attempted[step]);
  const meta = STEPS[step] ?? STEPS[0];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (Object.keys(errors).length) {
      setAttempted((a) => ({ ...a, [step]: true }));
      return;
    }
    if (step < LAST_STEP) {
      goTo(step + 1);
      return;
    }
    const result = finalizeDraft(draft);
    if ('invalidStep' in result) {
      setAttempted((a) => ({ ...a, [result.invalidStep]: true }));
      goTo(result.invalidStep);
      return;
    }
    onSubmit(result.answers, honeypot);
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="survey-title">
      <ProgressSteps current={step} maxReached={maxStep} onSelect={goTo} />

      {/* Honeypot anti-bots: invisible para personas. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Sitio web
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      <div className="relative mt-7 min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="mb-6">
              <h2
                id="survey-title"
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight text-white outline-none sm:text-[28px]"
              >
                {meta.subtitle}
              </h2>
            </header>

            {step === 0 && (
              <ContactStep contacto={draft.contacto} errors={errors} showAllErrors={showAllErrors} dispatch={dispatch} />
            )}
            {step === 1 && (
              <ObjectiveStep value={draft.objetivo} error={showAllErrors ? errors.objetivo : undefined} dispatch={dispatch} />
            )}
            {step === 2 && (
              <DiagnosisStep
                objetivo={draft.objetivo}
                answers={draft.diagnostico}
                errors={errors}
                showAllErrors={showAllErrors}
                dispatch={dispatch}
              />
            )}
            {step === 3 && (
              <BudgetStep value={draft.presupuesto} error={showAllErrors ? errors.presupuesto : undefined} dispatch={dispatch} />
            )}
            {step === 4 && (
              <UrgencyStep value={draft.urgencia} error={showAllErrors ? errors.urgencia : undefined} dispatch={dispatch} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
          className={step === 0 ? 'invisible' : ''}
        >
          Atrás
        </Button>
        <Button
          type="submit"
          iconRight={
            step === LAST_STEP ? <Sparkles className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />
          }
          className="flex-1 sm:flex-none sm:px-8"
        >
          {step === LAST_STEP ? 'Enviar diagnóstico' : 'Continuar'}
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-white/40">
        <Lock className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden />
        Tus datos se usan solo para preparar tu diagnóstico.
      </p>
    </form>
  );
}
