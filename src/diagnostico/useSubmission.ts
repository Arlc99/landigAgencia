import { useCallback, useEffect, useRef, useState } from 'react'
import type { SurveyAnswers } from '../../shared/schema'
import { ApiClientError, submitSurvey } from './api'
import { loadSession, saveSession } from './storage'

export type SubmissionPhase = 'idle' | 'sending' | 'done' | 'error'

export interface SubmissionState {
  phase: SubmissionPhase
  error: string | null
  answers: SurveyAnswers | null
}

const STORAGE_KEY = 'jualu-diagnostico-submission:v2'
const MIN_SENDING_MS = 2200

const IDLE: SubmissionState = { phase: 'idle', error: null, answers: null }

function restore(): SubmissionState {
  const saved = loadSession<SubmissionState>(STORAGE_KEY)
  if (!saved) return IDLE
  // Una recarga a mitad de envío pasa a error para reintentar; el submissionId evita duplicados.
  if (saved.phase === 'sending') {
    return { ...saved, phase: 'error', error: 'El envío se interrumpió. Puedes reintentarlo sin perder tus respuestas.' }
  }
  return saved
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useSubmission(submissionId: string) {
  const [state, setState] = useState<SubmissionState>(restore)
  const inFlight = useRef(false)

  useEffect(() => saveSession(STORAGE_KEY, state), [state])

  const submit = useCallback(
    async (answers: SurveyAnswers, honeypot = '') => {
      // Evita envíos duplicados por doble clic o reintentos concurrentes.
      if (inFlight.current) return
      inFlight.current = true
      setState({ phase: 'sending', error: null, answers })
      try {
        // La animación dura un mínimo también cuando hay error, para no mostrar un parpadeo.
        const pending = submitSurvey(submissionId, answers, honeypot)
        await Promise.allSettled([pending, wait(MIN_SENDING_MS)])
        await pending
        setState({ phase: 'done', error: null, answers })
      } catch (error) {
        const message =
          error instanceof ApiClientError ? error.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.'
        setState({ phase: 'error', error: message, answers })
      } finally {
        inFlight.current = false
      }
    },
    [submissionId],
  )

  const retry = useCallback(() => {
    if (state.answers) void submit(state.answers)
  }, [submit, state.answers])

  const reset = useCallback(() => setState(IDLE), [])

  return { ...state, submit, retry, reset }
}
