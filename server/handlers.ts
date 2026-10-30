import { progressRequestSchema, submitRequestSchema } from '../shared/schema.js'
import { requireHuman } from './captcha.js'
import { buildDiagnosisEmail } from './email.js'
import { analyzeLead } from './groq.js'
import { HttpError, json, postHandler, rateLimit, readJson, validationError } from './http.js'
import { buildLeadRow, buildProgressRow, dailyUsage, saveRow } from './sheets.js'

/** Máximo de diagnósticos por correo en 24 horas: evita que una sola persona gaste los tokens de IA de los demás. */
export const MAX_DIAGNOSTICOS_POR_DIA = 2

function rejectIfHoneypot(issues: { path: PropertyKey[] }[]): void {
  if (issues.some((i) => i.path[0] === 'website')) throw new HttpError(400, 'rejected', 'Solicitud rechazada.')
}

/**
 * POST /api/submit — valida las respuestas, comprueba el captcha y el límite diario del correo, las analiza con
 * la IA (Groq), guarda la fila completa en Google Sheets y devuelve al cliente SOLO su diagnóstico
 * (la clasificación y la estrategia son internas).
 */
export const handleSubmit = postHandler(async (request, env) => {
  rateLimit(request, 'submit', 5, 60_000)
  const parsed = submitRequestSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    rejectIfHoneypot(parsed.error.issues)
    throw validationError(parsed.error.issues)
  }
  const { submissionId, answers, pase } = parsed.data

  // 1) Barato y sin IA: ¿es una persona? 2) ¿este correo ya usó su cupo? Solo entonces se gastan tokens.
  await requireHuman(request, env, submissionId, pase, undefined)
  const usage = await dailyUsage(answers.contacto.correo, submissionId, env)
  if (usage.mismoId) {
    throw new HttpError(409, 'already_done', 'Este diagnóstico ya se generó. Revisa tu correo o agenda una cita con nosotros.')
  }
  if (usage.completados >= MAX_DIAGNOSTICOS_POR_DIA) {
    throw new HttpError(
      429,
      'daily_limit',
      `Este correo ya recibió ${MAX_DIAGNOSTICOS_POR_DIA} diagnósticos en las últimas 24 horas. Vuelve a intentarlo mañana o agenda una cita con nosotros.`,
    )
  }

  const analysis = await analyzeLead(answers, env)
  const email = buildDiagnosisEmail(answers.contacto.correo, answers.contacto.nombre, analysis.diagnostico_cliente)
  await saveRow(buildLeadRow(submissionId, answers, analysis), env, email)
  return json(200, { ok: true, diagnostico: analysis.diagnostico_cliente })
})

/**
 * POST /api/progreso — guarda el avance al pasar cada paso (estado "Parcial"), para saber quién se
 * interesó aunque no termine la encuesta. Exige el consentimiento de tratamiento de datos.
 * El primer guardado (paso 1) lleva el token del captcha y devuelve un pase; los siguientes lo presentan.
 */
export const handleProgress = postHandler(async (request, env) => {
  rateLimit(request, 'progreso', 40, 60_000)
  const parsed = progressRequestSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    rejectIfHoneypot(parsed.error.issues)
    throw validationError(parsed.error.issues)
  }
  const { submissionId, paso, answers, pase, turnstileToken } = parsed.data
  const newPass = await requireHuman(request, env, submissionId, pase, turnstileToken)
  await saveRow(buildProgressRow(submissionId, answers, paso), env)
  return json(200, { ok: true, pase: newPass })
})
