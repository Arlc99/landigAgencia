import { describeAnswers, type AnswersLike, type ClientDiagnosis, type SurveyAnswers } from '../shared/schema.js'
import type { LeadAnalysis } from './analysis.js'
import type { EmailMessage } from './email.js'
import { HttpError, requireEnv, type Env } from './http.js'

const TIMEOUT_MS = 20_000
export const TOTAL_STEPS = 5

interface WebhookResult {
  ok?: boolean
  error?: string
}

/** Fila parcial: las claves coinciden con COLUMNS en apps-script/Code.gs. Lo que no se envía no se pisa. */
export type LeadRow = Record<string, string | undefined>

function diagnosisText(d: ClientDiagnosis): string {
  const priorities = d.prioridades
    .map((p, i) => `${i + 1}. ${p.titulo}\n   ${p.por_que}\n${p.incluye.map((s) => `   - ${s}`).join('\n')}`)
    .join('\n')
  return `${d.titulo}\n${d.resumen}\n\n${priorities}\n\n${d.siguiente_nivel}\n${d.cierre}`
}

function baseRow(submissionId: string, answers: AnswersLike, paso: number): LeadRow {
  const described = describeAnswers(answers)
  const now = new Date().toISOString()
  return {
    submissionId,
    fecha: now,
    actualizado: now,
    nombre: described.contacto.nombre,
    empresa: described.contacto.empresa,
    correo: described.contacto.correo,
    whatsapp: described.contacto.whatsapp,
    consentimiento: 'Sí',
    objetivo: described.objetivo || undefined,
    diagnostico: described.diagnostico.length
      ? described.diagnostico.map((d) => `${d.pregunta}: ${d.respuesta}`).join('\n')
      : undefined,
    presupuesto: described.presupuesto_mensual || undefined,
    urgencia: described.urgencia || undefined,
    ultimo_paso: `${paso} de ${TOTAL_STEPS}`,
  }
}

/** Avance a mitad de la encuesta: deja constancia de que la persona se interesó. */
export function buildProgressRow(submissionId: string, answers: AnswersLike, paso: number): LeadRow {
  return { ...baseRow(submissionId, answers, paso), estado: 'Parcial' }
}

/** Encuesta completa con el análisis interno y el diagnóstico que vio el cliente. */
export function buildLeadRow(submissionId: string, answers: SurveyAnswers, analysis: LeadAnalysis): LeadRow {
  return {
    ...baseRow(submissionId, answers, TOTAL_STEPS),
    estado: 'Completo',
    clasificacion: analysis.clasificacion,
    canal_sugerido: analysis.canal_sugerido,
    estrategia_venta: analysis.estrategia_venta.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    script_contacto: analysis.script_contacto,
    diagnostico_entregado: diagnosisText(analysis.diagnostico_cliente),
    respuestas_json: JSON.stringify(answers),
  }
}

/** Crea o actualiza (por submissionId) la fila de la persona en Google Sheets. */
export async function saveRow(lead: LeadRow, env: Env, email?: EmailMessage): Promise<void> {
  const url = requireEnv(env, 'GOOGLE_SHEETS_WEBHOOK_URL')
  const body = JSON.stringify({
    secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || undefined,
    lead,
    // El Apps Script envía el correo (una sola vez por persona) y lo deja registrado en "Seguimiento".
    email,
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
}
