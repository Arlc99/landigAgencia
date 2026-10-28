export type Env = Record<string, string | undefined>

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

const MAX_BODY_BYTES = 32_000

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'El cuerpo debe ser JSON.')
  }
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'payload_too_large', 'La solicitud es demasiado grande.')
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'invalid_json', 'El cuerpo no es un JSON válido.')
  }
}

// Límite best-effort por instancia: en serverless cada instancia tiene su propia memoria.
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
  const key = `${scope}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
    }
    return
  }
  bucket.count += 1
  if (bucket.count > limit) {
    throw new HttpError(429, 'rate_limited', 'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.')
  }
}

export function checkOrigin(request: Request, env: Env): void {
  const allowed = env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean)
  if (!allowed?.length) return
  const origin = request.headers.get('origin')
  if (!origin || !allowed.includes(origin)) throw new HttpError(403, 'forbidden_origin', 'Origen no permitido.')
}

export function requireEnv(env: Env, name: string): string {
  const value = env[name]?.trim()
  if (!value) {
    console.error(`[config] Falta la variable de entorno ${name}`)
    throw new HttpError(500, 'server_misconfigured', 'El servidor no está configurado. Contacta al administrador.')
  }
  return value
}

type Handler = (request: Request, env: Env) => Promise<Response>

/** Envuelve un handler POST con control de método, origen y errores uniformes. */
export function postHandler(handler: Handler): Handler {
  return async (request, env) => {
    if (request.method !== 'POST') return json(405, { error: { code: 'method_not_allowed', message: 'Usa POST.' } })
    try {
      checkOrigin(request, env)
      return await handler(request, env)
    } catch (error) {
      if (error instanceof HttpError) return json(error.status, { error: { code: error.code, message: error.message } })
      console.error('[api] Error inesperado', error)
      return json(500, { error: { code: 'internal_error', message: 'Ocurrió un error inesperado. Inténtalo de nuevo.' } })
    }
  }
}

export function validationError(issues: { path: PropertyKey[]; message: string }[]): HttpError {
  const first = issues[0]
  const where = first?.path.length ? ` (${first.path.map(String).join('.')})` : ''
  return new HttpError(422, 'invalid_payload', `Datos no válidos${where}: ${first?.message ?? 'revisa el formulario.'}`)
}
