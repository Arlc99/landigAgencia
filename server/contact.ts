import { z } from 'zod'
import { verifyTurnstile } from './captcha.js'
import { HttpError, json, postHandler, rateLimit, readJson, requireEnv, validationError } from './http.js'

/** Una persona tarda más que esto en llenar el formulario; un bot lo envía casi al instante. */
const MIN_FILL_MS = 2_500

const contactRequestSchema = z.object({
  negocio: z.string().trim().min(2, 'Nombre muy corto.').max(120),
  correo: z.string().trim().toLowerCase().max(120).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo electrónico inválido.'),
  celular: z.string().trim().regex(/^\d{7,15}$/, 'Celular inválido.'),
  mensaje: z.string().trim().min(10, 'Mensaje muy corto.').max(1000),
  /** Honeypot anti-bots: debe llegar vacío. */
  website: z.string().max(0).optional(),
  /** Milisegundos que la persona tardó en llenar el formulario. */
  tardo: z.number().int().min(0).max(86_400_000).optional(),
  turnstileToken: z.string().max(4096).optional(),
})

/**
 * POST /api/contacto — formulario de contacto de la landing.
 * La URL del Apps Script y su token viven solo en el servidor (antes iban en el bundle del navegador).
 * Defensas: límite por IP, campo trampa, tiempo mínimo de llenado y captcha (Cloudflare Turnstile).
 */
export const handleContact = postHandler(async (request, env) => {
  rateLimit(request, 'contacto', 5, 60_000)
  const parsed = contactRequestSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) {
      throw new HttpError(400, 'rejected', 'Solicitud rechazada.')
    }
    throw validationError(parsed.error.issues)
  }

  const { website: _website, tardo, turnstileToken, ...data } = parsed.data
  if (tardo !== undefined && tardo < MIN_FILL_MS) throw new HttpError(400, 'rejected', 'Solicitud rechazada.')
  await verifyTurnstile(turnstileToken, request, env)

  const url = requireEnv(env, 'CONTACT_WEBHOOK_URL')
  const token = requireEnv(env, 'CONTACT_WEBHOOK_SECRET')

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...data, token }),
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new HttpError(502, 'sheets_unreachable', 'No fue posible enviar tu solicitud. Inténtalo de nuevo.')
  }
  if (!response.ok) throw new HttpError(502, 'sheets_rejected', 'No fue posible enviar tu solicitud. Inténtalo de nuevo.')
  return json(200, { ok: true })
})
