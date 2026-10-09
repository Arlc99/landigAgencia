import { SYSTEM_PROMPT } from '../src/config/promp.js';

const MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];
    const messages = history
        .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m: any) => ({ role: m.role, content: m.content.slice(0, 500) }));

    if (!messages.length) {
        return res.status(400).json({ error: 'Mensaje vacío' });
    }

    for (const model of MODELS) {
        try {
            const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
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

            const data = await r.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) return res.status(200).json({ text });
        } catch (error) {
            console.warn(`Error con ${model}:`, error);
        }
    }

    return res.status(502).json({ error: 'Sin respuesta de la IA' });
}