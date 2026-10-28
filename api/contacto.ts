import { handleContact } from '../server/contact.js';

// Función serverless de Vercel (Node.js runtime, API Web estándar).
export function POST(request: Request): Promise<Response> {
  return handleContact(request, process.env);
}
