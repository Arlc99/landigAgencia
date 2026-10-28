import { SYSTEM_PROMPT } from '../src/config/promp.js';
import { HttpError, json, postHandler, rateLimit, readJson, requireEnv } from '../server/http.js';

const MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const handleChat = postHandler(async (request, env) => {
  rateLimit(request, 'chat', 20, 60_000);
  const apiKey = requireEnv(env, 'GROQ_API_KEY');

  const body = (await readJson(request)) as { history?: unknown } | null;
  const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];
  const messages: ChatMessage[] = history
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));

  if (!messages.length) throw new HttpError(400, 'empty_message', 'Mensaje vacío');

  for (const model of MODELS) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          temperature: 0.2,
          max_completion_tokens: 1024,
          reasoning_effort: 'low',
        }),
      });

      if (!r.ok) {
        console.warn(`Modelo ${model} falló con estado ${r.status}`);
        continue;
      }

      const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return json(200, { text });
    } catch (error) {
      console.warn(`Error con ${model}:`, error);
    }
  }

  throw new HttpError(502, 'ai_unavailable', 'Sin respuesta de la IA');
});

// Función serverless de Vercel (Node.js runtime, API Web estándar).
export function POST(request: Request): Promise<Response> {
  return handleChat(request, process.env);
}
