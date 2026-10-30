import type { SubmitResponse, SurveyAnswers } from '../../shared/schema'
import type { SurveyDraft } from './useSurvey'

export class ApiClientError extends Error {
  readonly status: number

  constructor(message: string, status = 0) {
    super(message)
    this.status = status
  }
}

/** Envía la encuesta. El servidor la analiza y la guarda; al navegador solo vuelve la confirmación. */
export async function submitSurvey(submissionId: string, answers: SurveyAnswers, honeypot: string): Promise<SubmitResponse> {
  let response: Response
  try {
    response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ submissionId, answers, website: honeypot || undefined }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'TimeoutError'
    throw new ApiClientError(
      timeout
        ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
        : 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
    )
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ??
      `El servidor respondió con un error (${response.status}).`
    throw new ApiClientError(message, response.status)
  }
  return data as SubmitResponse
}

/**
 * Guarda el avance al pasar cada paso. Es "disparar y olvidar": si falla no interrumpe a la persona
 * (el envío final guarda todo de nuevo). `keepalive` permite que termine aunque cierre la pestaña.
 */
export function saveProgress(submissionId: string, paso: number, draft: SurveyDraft, honeypot = ''): void {
  const { contacto, consentimiento, objetivo, diagnostico, presupuesto, urgencia } = draft
  void fetch('/api/progreso', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      submissionId,
      paso,
      answers: { contacto, consentimiento, objetivo, diagnostico, presupuesto, urgencia },
      website: honeypot || undefined,
    }),
  }).catch(() => {})
}
