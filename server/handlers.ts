import { submitRequestSchema } from '../shared/schema.js'
import { analyzeLead } from './groq.js'
import { HttpError, json, postHandler, rateLimit, readJson, validationError } from './http.js'
import { saveLead } from './sheets.js'

/**
 * POST /api/submit — valida las respuestas, las cualifica con la IA (Groq) y las guarda en Google Sheets.
 * El análisis es interno: la respuesta al navegador solo confirma la recepción.
 * Idempotente por submissionId: un reintento no duplica la fila.
 */
export const handleSubmit = postHandler(async (request, env) => {
  rateLimit(request, 'submit', 5, 60_000)
  const parsed = submitRequestSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) {
      throw new HttpError(400, 'rejected', 'Solicitud rechazada.')
    }
    throw validationError(parsed.error.issues)
  }
  const { submissionId, answers } = parsed.data
  const analysis = await analyzeLead(answers, env)
  const { duplicate } = await saveLead(submissionId, answers, analysis, env)
  return json(200, { ok: true, duplicate })
})
