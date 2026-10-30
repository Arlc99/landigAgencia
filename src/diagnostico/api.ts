import type { SubmitResponse, SurveyAnswers } from '../../shared/schema'
import type { SurveyDraft } from './useSurvey'

export class ApiClientError extends Error {
  readonly status: number
  /** Código estable del servidor (p. ej. "daily_limit", "captcha_failed"). */
  readonly code: string

  constructor(message: string, status = 0, code = '') {
    super(message)
    this.status = status
    this.code = code
  }
}

async function postJson(path: string, body: unknown, timeoutMs: number, keepalive = false): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive,
      signal: AbortSignal.timeout(timeoutMs),
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
    const error = (data as { error?: { message?: string; code?: string } } | null)?.error
    throw new ApiClientError(
      error?.message ?? `El servidor respondió con un error (${response.status}).`,
      response.status,
      error?.code ?? '',
    )
  }
  return data
}

/** Envía la encuesta. El servidor la analiza y la guarda; al navegador solo vuelve su diagnóstico. */
export async function submitSurvey(
  submissionId: string,
  answers: SurveyAnswers,
  honeypot: string,
  pase?: string,
): Promise<SubmitResponse> {
  const data = await postJson(
    '/api/submit',
    { submissionId, answers, pase, website: honeypot || undefined },
    60_000,
  )
  return data as SubmitResponse
}

function progressBody(submissionId: string, paso: number, draft: SurveyDraft, honeypot: string) {
  const { contacto, consentimiento, objetivo, diagnostico, presupuesto, urgencia } = draft
  return {
    submissionId,
    paso,
    answers: { contacto, consentimiento, objetivo, diagnostico, presupuesto, urgencia },
    website: honeypot || undefined,
  }
}

/**
 * Primer guardado (paso 1): canjea el token del captcha por un pase firmado. Se ESPERA la respuesta:
 * si el captcha falla, la persona no avanza. Sin captcha configurado no devuelve pase.
 */
export async function startSurvey(
  submissionId: string,
  draft: SurveyDraft,
  honeypot: string,
  turnstileToken?: string,
): Promise<string | undefined> {
  const data = await postJson('/api/progreso', { ...progressBody(submissionId, 1, draft, honeypot), turnstileToken }, 30_000)
  return (data as { pase?: string } | null)?.pase
}

/**
 * Guarda el avance al pasar cada paso. Es "disparar y olvidar": si falla no interrumpe a la persona
 * (el envío final guarda todo de nuevo). `keepalive` permite que termine aunque cierre la pestaña.
 */
export function saveProgress(submissionId: string, paso: number, draft: SurveyDraft, honeypot = '', pase?: string): void {
  void postJson('/api/progreso', { ...progressBody(submissionId, paso, draft, honeypot), pase }, 30_000, true).catch(() => {})
}
