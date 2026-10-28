import { z } from 'zod'
import {
  BUDGET_IDS,
  BUDGET_RANGES,
  OBJECTIVE_IDS,
  URGENCY_IDS,
  URGENCY_LEVELS,
  getObjective,
  optionLabel,
  type ObjectiveId,
} from './survey.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/** Normaliza un número a dígitos E.164 sin "+". Asume Colombia (+57) para móviles de 10 dígitos. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  return digits
}

export function isValidPhone(raw: string): boolean {
  if (!/^[+\d\s().-]+$/.test(raw.trim())) return false
  const digits = normalizePhone(raw)
  return digits.length >= 10 && digits.length <= 15
}

export const contactSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Escribe tu nombre completo.')
    .max(80, 'El nombre es demasiado largo.')
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, 'Incluye nombre y apellido.'),
  // Opcional: la encuesta también la responden personas naturales sin empresa.
  empresa: z.string().trim().max(100, 'El nombre es demasiado largo.'),
  // Se acepta cualquier dominio (Gmail, Hotmail, corporativo, etc.).
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, 'El correo es demasiado largo.')
    .refine((v) => EMAIL_RE.test(v), 'Ingresa un correo válido.'),
  whatsapp: z
    .string()
    .trim()
    .refine(isValidPhone, 'Ingresa un WhatsApp válido, p. ej. +57 300 123 4567.'),
})
export type ContactInfo = z.infer<typeof contactSchema>

export type DiagnosisAnswers = Record<string, string | string[]>

/** Valida las respuestas del diagnóstico contra las preguntas del objetivo elegido. */
export function validateDiagnosis(
  objetivo: ObjectiveId | null | undefined,
  diagnostico: DiagnosisAnswers,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const objective = getObjective(objetivo)
  if (!objective) return { _: 'Selecciona un objetivo antes del diagnóstico.' }

  const known = new Set(objective.questions.map((q) => q.id))
  for (const key of Object.keys(diagnostico)) {
    if (!known.has(key)) errors[key] = 'Pregunta no válida para este objetivo.'
  }

  for (const q of objective.questions) {
    const value = diagnostico[q.id]
    const validIds = new Set(q.options?.map((o) => o.id))
    if (q.kind === 'text') {
      if (value !== undefined && typeof value !== 'string') errors[q.id] = 'Respuesta no válida.'
      else if (q.required && !value?.trim()) errors[q.id] = 'Este campo es obligatorio.'
      else if (value && value.length > (q.maxLength ?? 500)) errors[q.id] = `Máximo ${q.maxLength ?? 500} caracteres.`
    } else if (q.kind === 'single') {
      if (value === undefined || value === '') {
        if (q.required) errors[q.id] = 'Selecciona una opción.'
      } else if (typeof value !== 'string' || !validIds.has(value)) errors[q.id] = 'Opción no válida.'
    } else {
      const list = Array.isArray(value) ? value : []
      if (value !== undefined && !Array.isArray(value)) errors[q.id] = 'Respuesta no válida.'
      else if (q.required && list.length === 0) errors[q.id] = 'Selecciona al menos una opción.'
      else if (list.some((id) => !validIds.has(id))) errors[q.id] = 'Opción no válida.'
      else if (q.maxSelections && list.length > q.maxSelections) errors[q.id] = `Máximo ${q.maxSelections} opciones.`
    }
  }
  return errors
}

export const surveySchema = z
  .object({
    contacto: contactSchema,
    objetivo: z.enum(OBJECTIVE_IDS, { error: 'Selecciona un objetivo.' }),
    diagnostico: z.record(z.string().max(40), z.union([z.string().max(600), z.array(z.string().max(60)).max(10)])),
    presupuesto: z.enum(BUDGET_IDS, { error: 'Selecciona un rango de inversión.' }),
    urgencia: z.enum(URGENCY_IDS, { error: 'Selecciona el nivel de urgencia.' }),
  })
  .superRefine((value, ctx) => {
    const errors = validateDiagnosis(value.objetivo, value.diagnostico)
    for (const [key, message] of Object.entries(errors)) {
      ctx.addIssue({ code: 'custom', path: ['diagnostico', key], message })
    }
  })
export type SurveyAnswers = z.infer<typeof surveySchema>

const submissionId = z
  .string()
  .regex(/^[a-zA-Z0-9-]{8,64}$/, 'Identificador de envío no válido.')

export const submitRequestSchema = z.object({
  submissionId,
  answers: surveySchema,
  /** Honeypot anti-bots: debe llegar vacío. */
  website: z.string().max(0).optional(),
})
export type SubmitRequest = z.infer<typeof submitRequestSchema>

export interface ApiError {
  error: { code: string; message: string }
}
/** El análisis de IA nunca viaja al navegador: solo se guarda en la hoja para el equipo comercial. */
export interface SubmitResponse {
  ok: true
  duplicate: boolean
}

/** Texto que reemplaza a la empresa cuando el lead es una persona natural. */
export const NO_COMPANY = 'Sin empresa (persona natural)'

/** Respuestas en lenguaje natural (etiquetas, no ids) para la IA y la hoja de cálculo. */
export function describeAnswers(answers: SurveyAnswers) {
  const objective = getObjective(answers.objetivo)
  const diagnostico = (objective?.questions ?? [])
    .filter((q) => answers.diagnostico[q.id] !== undefined && answers.diagnostico[q.id] !== '')
    .map((q) => {
      const value = answers.diagnostico[q.id]
      const text = Array.isArray(value)
        ? value.map((id) => optionLabel(q.options, id)).join(', ')
        : q.kind === 'text'
          ? (value ?? '')
          : optionLabel(q.options, value ?? '')
      return { pregunta: q.label, respuesta: text }
    })

  return {
    contacto: {
      ...answers.contacto,
      empresa: answers.contacto.empresa || NO_COMPANY,
      whatsapp: normalizePhone(answers.contacto.whatsapp),
    },
    objetivo: objective?.label ?? answers.objetivo,
    diagnostico,
    presupuesto_mensual: `${optionLabel(BUDGET_RANGES, answers.presupuesto)} COP`,
    urgencia: optionLabel(URGENCY_LEVELS, answers.urgencia),
  }
}
