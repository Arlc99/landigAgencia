import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gradientStyle } from '../components/primitives';
import { saveProgress, startSurvey } from '../diagnostico/api';
import { AnalyzingScreen, ResultScreen } from '../diagnostico/Screens';
import { clearSession, loadSession } from '../diagnostico/storage';
import { SurveyWizard } from '../diagnostico/SurveyWizard';
import { SUBMISSION_STORAGE_KEY, useSubmission } from '../diagnostico/useSubmission';
import { SURVEY_STORAGE_KEY, useSurvey } from '../diagnostico/useSurvey';

/** Estados que ya terminaron la historia: diagnóstico entregado o límite diario alcanzado (reintentar no sirve). */
function isFinished(state: { phase?: string; errorCode?: string | null } | null | undefined): boolean {
  if (!state) return false;
  return state.phase === 'done' || (state.phase === 'error' && (state.errorCode === 'daily_limit' || state.errorCode === 'already_done'));
}

/**
 * Si se llega a la página desde otro lugar (no recargándola) y quedó un diagnóstico ya entregado guardado,
 * se descarta: la persona debe ver el formulario limpio. Recargar (F5) en la pantalla del resultado sí lo conserva.
 */
function discardDeliveredDiagnosis(): null {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === 'reload') return null;
  if (isFinished(loadSession<{ phase?: string; errorCode?: string | null }>(SUBMISSION_STORAGE_KEY))) {
    clearSession(SURVEY_STORAGE_KEY, SUBMISSION_STORAGE_KEY);
  }
  return null;
}

export default function Diagnostico() {
  // Debe correr antes de leer el estado guardado (los hooks de abajo lo leen en su primer render).
  useState(discardDeliveredDiagnosis);
  const survey = useSurvey();
  const submission = useSubmission(survey.submissionId, survey.pase);
  const { reset: resetSurvey, submissionId, pase, dispatch } = survey;
  const { reset: resetSubmission } = submission;

  // Al abandonar la página con un diagnóstico ya entregado, se borra todo: al volver se empieza con el formulario limpio.
  // (Solo se borra el almacenamiento: si el efecto se repite en desarrollo, el estado en memoria lo vuelve a guardar.)
  const finishedRef = useRef(false);
  finishedRef.current = isFinished({ phase: submission.phase, errorCode: submission.errorCode });
  useEffect(
    () => () => {
      if (finishedRef.current) clearSession(SURVEY_STORAGE_KEY, SUBMISSION_STORAGE_KEY);
    },
    [],
  );

  const restart = useCallback(() => {
    resetSubmission();
    resetSurvey();
  }, [resetSubmission, resetSurvey]);

  const handleProgress = useCallback(
    (paso: number, draft: Parameters<typeof saveProgress>[2], honeypot: string) =>
      saveProgress(submissionId, paso, draft, honeypot, pase),
    [submissionId, pase],
  );

  const handleStart = useCallback(
    async (draft: Parameters<typeof saveProgress>[2], honeypot: string, token: string) => {
      const newPass = await startSurvey(submissionId, draft, honeypot, token);
      if (newPass) dispatch({ type: 'pase', value: newPass });
    },
    [submissionId, dispatch],
  );

  const view =
    submission.phase === 'idle'
      ? 'survey'
      : submission.phase === 'done' && submission.answers && submission.diagnostico
        ? 'result'
        : 'progress';

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-10 md:pt-16">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-semibold leading-[0.95] tracking-tight md:text-6xl"
          >
            <span className="block text-white">DIAGNÓSTICO</span>
            <span className="block animate-shiny" style={gradientStyle}>
              GRATUITO
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-6 max-w-md text-base leading-[1.5] text-white/60"
          >
            Responde 5 pasos cortos (menos de 3 minutos) y recibe al instante tu diagnóstico personalizado:
            qué necesita tu negocio para vender más.
          </motion.p>
        </div>

        <section
          id="diagnostico"
          aria-label="Diagnóstico gratuito"
          className="liquid-glass relative mt-10 scroll-mt-24 rounded-3xl p-5 sm:p-8"
          style={{ background: 'rgba(8,8,8,0.62)', backdropFilter: 'blur(14px)' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              {view === 'survey' && (
                <SurveyWizard
                  survey={survey}
                  onSubmit={submission.submit}
                  onProgress={handleProgress}
                  onStart={handleStart}
                />
              )}
              {view === 'progress' && (
                <AnalyzingScreen
                  phase={submission.phase}
                  error={submission.error}
                  errorCode={submission.errorCode}
                  onRetry={submission.retry}
                  onEdit={resetSubmission}
                />
              )}
              {view === 'result' && submission.answers && submission.diagnostico && (
                <ResultScreen
                  answers={submission.answers}
                  diagnostico={submission.diagnostico}
                  onRestart={restart}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </MotionConfig>
  );
}
