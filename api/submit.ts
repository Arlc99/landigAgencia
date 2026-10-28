import { handleSubmit } from '../server/handlers.js'

// Función serverless de Vercel (Node.js runtime, API Web estándar).
export function POST(request: Request): Promise<Response> {
  return handleSubmit(request, process.env)
}
