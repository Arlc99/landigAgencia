import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback } from 'react';
import { AnalyzingScreen, ResultScreen } from '../diagnostico/Screens';
import { SurveyWizard } from '../diagnostico/SurveyWizard';
import { useSubmission } from '../diagnostico/useSubmission';
import { useSurvey } from '../diagnostico/useSurvey';
import { gradientStyle } from '../components/primitives';

export default function Diagnostico() {
  const survey = useSurvey();
  const submission = useSubmission(survey.submissionId);
  const { reset: resetSurvey } = survey;
  const { reset: resetSubmission } = submission;

  const restart = useCallback(() => {
    resetSubmission();
    resetSurvey();
  }, [resetSubmission, resetSurvey]);

  const view =
    submission.phase === 'idle' ? 'survey' : submission.phase === 'done' && submission.answers ? 'result' : 'progress';

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
            Responde 5 pasos cortos (menos de 3 minutos) y un asesor de JUALU te contactará con una propuesta a tu medida.
          </motion.p>
        </div>

        <section
          id="diagnostico"
          aria-label="Diagnóstico gratuito"
          className="liquid-glass relative mt-10 scroll-mt-24 rounded-3xl p-5 sm:p-8"
          style={{ background: "rgba(8,8,8,0.62)", backdropFilter: "blur(14px)" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              {view === 'survey' && <SurveyWizard survey={survey} onSubmit={submission.submit} />}
              {view === 'progress' && (
                <AnalyzingScreen
                  phase={submission.phase}
                  error={submission.error}
                  onRetry={submission.retry}
                  onEdit={resetSubmission}
                />
              )}
              {view === 'result' && submission.answers && (
                <ResultScreen answers={submission.answers} onRestart={restart} />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </MotionConfig>
  );
}
