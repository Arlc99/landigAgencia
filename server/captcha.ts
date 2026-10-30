import { createHmac, timingSafeEqual } from 'node:crypto'
import { HttpError, clientIp, type Env } from './http.js'

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
/** El pase dura lo que tarda una persona en llenar la encuesta (con margen). */
const PASS_TTL_MS = 2 * 60 * 60 * 1000

/** Sin TURNSTILE_SECRET_KEY el captcha queda apagado (útil en desarrollo). En producción debe estar configurado. */
export function captchaEnabled(env: Env): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY?.trim())
}

/** Valida con Cloudflare que el token lo generó una persona en este sitio. Cada token solo sirve una vez. */
export async function verifyTurnstile(token: string | undefined, request: Request, env: Env): Promise<void> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) return
  if (!token) throw new HttpError(403, 'captcha_required', 'Completa la verificación de seguridad para continuar.')

  const body = new URLSearchParams({ secret, response: token })
  const ip = clientIp(request)
  if (ip !== 'local') body.set('remoteip', ip)

  let response: Response
  try {
    response = await fetch(SITEVERIFY, { method: 'POST', body, signal: AbortSignal.timeout(8_000) })
  } catch {
    throw new HttpError(502, 'captcha_unreachable', 'No pudimos verificar la seguridad. Inténtalo de nuevo.')
  }
  const data = (await response.json().catch(() => null)) as { success?: boolean } | null
  if (!data?.success) {
    throw new HttpError(403, 'captcha_failed', 'No pudimos comprobar que eres una persona. Recarga la página e inténtalo de nuevo.')
  }
}

const sign = (secret: string, payload: string): string => createHmac('sha256', secret).update(payload).digest('base64url')

/**
 * Pase firmado (HMAC) ligado a un submissionId: se entrega al resolver el captcha UNA vez, en el paso 1,
 * y lo exigen los guardados siguientes y el envío final. Así el captcha protege toda la encuesta sin repetirse.
 */
export function issuePass(submissionId: string, env: Env): string | undefined {
  const secret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) return undefined
  const issuedAt = Date.now()
  return `${issuedAt}.${sign(secret, `${submissionId}.${issuedAt}`)}`
}

export function hasValidPass(pass: string | undefined, submissionId: string, env: Env): boolean {
  const secret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret || !pass) return false
  const [issuedAtText, signature] = pass.split('.')
  const issuedAt = Number(issuedAtText)
  if (!signature || !Number.isFinite(issuedAt)) return false
  const age = Date.now() - issuedAt
  if (age < 0 || age > PASS_TTL_MS) return false
  const expected = Buffer.from(sign(secret, `${submissionId}.${issuedAt}`))
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

/**
 * Exige captcha resuelto: acepta un pase vigente, o un token de Turnstile (que se canjea por un pase nuevo).
 * Devuelve el pase nuevo cuando se acaba de resolver el captcha.
 */
export async function requireHuman(
  request: Request,
  env: Env,
  submissionId: string,
  pass: string | undefined,
  token: string | undefined,
): Promise<string | undefined> {
  if (!captchaEnabled(env)) return undefined
  if (hasValidPass(pass, submissionId, env)) return undefined
  await verifyTurnstile(token, request, env)
  return issuePass(submissionId, env)
}
