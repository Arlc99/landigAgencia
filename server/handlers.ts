import { progressRequestSchema, submitRequestSchema } from '../shared/schema.js'
import { buildDiagnosisEmail } from './email.js'
import { analyzeLead } from './groq.js'
import { HttpError, json, postHandler, rateLimit, readJson, validationError } from './http.js'
import { buildLeadRow, buildProgressRow, saveRow } from './sheets.js'

function rejectIfHoneypot(issues: { path: PropertyKey[] }[]): void {
  if (issues.some((i) => i.path[0] === 'website')) throw new HttpError(400, 'rejected', 'Solicitud rechazada.')
}

/**
 * POST /api/submit — valida las respuestas, las analiza con la IA (Groq), guarda la fila completa en
 * Google Sheets y devuelve al cliente SOLO su diagnóstico (la clasificación y la estrategia son internas).
 * Idempotente por submissionId: un reintento actualiza la misma fila.
 */
export const handleSubmit = postHandler(async (request, env) => {
  rateLimit(request, 'submit', 5, 60_000)
  const parsed = submitRequestSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    rejectIfHoneypot(parsed.error.issues)
    throw validationError(parsed.error.issues)
  }
  const { submissionId, answers } = parsed.data
  const analysis = await analyzeLead(answers, env)
  const email = buildDiagnosisEmail(answers.contacto.correo, answers.contacto.nombre, analysis.diagnostico_cliente)
  await saveRow(buildLeadRow(submissionId, answers, analysis), env, email)
  return json(200, { ok: true, diagnostico: analysis.diagnostico_cliente })
})

/**
 * POST /api/progreso — guarda el avance al pasar cada paso (estado "Parcial"), para saber quién se
 * interesó aunque no termine la encuesta. Exige el consentimiento de tratamiento de datos.
 */
export const handleProgress = postHandler(async (request, env) => {
  rateLimit(request, 'progreso', 40, 60_000)
  const parsed = progressRequestSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    rejectIfHoneypot(parsed.error.issues)
    throw validationError(parsed.error.issues)
  }
  const { submissionId, paso, answers } = parsed.data
  await saveRow(buildProgressRow(submissionId, answers, paso), env)
  return json(200, { ok: true })
})
