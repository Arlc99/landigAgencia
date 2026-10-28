import { describeAnswers, type SurveyAnswers } from '../shared/schema.js'
import type { LeadAnalysis } from './analysis.js'
import { HttpError, requireEnv, type Env } from './http.js'

const TIMEOUT_MS = 20_000

interface WebhookResult {
  ok?: boolean
  duplicate?: boolean
  error?: string
}

/** Fila plana para la hoja; las claves coinciden con HEADERS en apps-script/Code.gs. */
export function buildLeadRow(submissionId: string, answers: SurveyAnswers, analysis: LeadAnalysis) {
  const described = describeAnswers(answers)
  return {
    submissionId,
    fecha: new Date().toISOString(),
    nombre: described.contacto.nombre,
    empresa: described.contacto.empresa,
    correo: described.contacto.correo,
    whatsapp: described.contacto.whatsapp,
    objetivo: described.objetivo,
    diagnostico: described.diagnostico.map((d) => `${d.pregunta}: ${d.respuesta}`).join('\n'),
    presupuesto: described.presupuesto_mensual,
    urgencia: described.urgencia,
    clasificacion: analysis.clasificacion,
    canal_sugerido: analysis.canal_sugerido,
    estrategia_venta: analysis.estrategia_venta.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    script_contacto: analysis.script_contacto,
    respuestas_json: JSON.stringify(answers),
  }
}

export async function saveLead(
  submissionId: string,
  answers: SurveyAnswers,
  analysis: LeadAnalysis,
  env: Env,
): Promise<{ duplicate: boolean }> {
  const url = requireEnv(env, 'GOOGLE_SHEETS_WEBHOOK_URL')
  const body = JSON.stringify({
    secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || undefined,
    lead: buildLeadRow(submissionId, answers, analysis),
  })

  let response: Response
  try {
    // text/plain evita el preflight y es lo que Apps Script lee en e.postData.contents.
    // Apps Script responde con un 302; fetch lo sigue con GET, que es el comportamiento esperado.
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new HttpError(502, 'sheets_unreachable', 'No fue posible conectar con Google Sheets.')
  }

  const text = await response.text()
  let result: WebhookResult
  try {
    result = JSON.parse(text) as WebhookResult
  } catch {
    console.error(`[sheets] Respuesta no JSON (HTTP ${response.status})`, text.slice(0, 300))
    throw new HttpError(
      502,
      'sheets_bad_response',
      'Google Sheets no respondió correctamente. Revisa que el Apps Script esté desplegado con acceso "Cualquier persona".',
    )
  }

  if (!response.ok || !result.ok) {
    console.error('[sheets] Rechazado', response.status, result.error)
    throw new HttpError(502, 'sheets_rejected', 'Google Sheets rechazó el registro. Inténtalo de nuevo.')
  }
  return { duplicate: Boolean(result.duplicate) }
}
