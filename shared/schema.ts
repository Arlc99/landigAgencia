import { z } from 'zod'
import {
  BUDGET_IDS,
  BUDGET_RANGES,
  OBJECTIVE_IDS,
  URGENCY_IDS,
  URGENCY_LEVELS,
  getObjective,
  optionLabel,
  type BudgetId,
  type ObjectiveId,
  type UrgencyId,
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
    consentimiento: z.literal(true, { error: 'Debes aceptar el tratamiento de tus datos para continuar.' }),
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

/** Avance parcial: se guarda al pasar cada paso, para saber quién se interesó aunque no termine. */
export const progressRequestSchema = z.object({
  submissionId,
  /** Cantidad de pasos completados (1 a 5). */
  paso: z.number().int().min(1).max(5),
  answers: z.object({
    contacto: contactSchema,
    consentimiento: z.literal(true),
    objetivo: z.enum(OBJECTIVE_IDS).nullish(),
    diagnostico: z
      .record(z.string().max(40), z.union([z.string().max(600), z.array(z.string().max(60)).max(10)]))
      .optional(),
    presupuesto: z.enum(BUDGET_IDS).nullish(),
    urgencia: z.enum(URGENCY_IDS).nullish(),
  }),
  /** Honeypot anti-bots: debe llegar vacío. */
  website: z.string().max(0).optional(),
})
export type ProgressRequest = z.infer<typeof progressRequestSchema>

/**
 * Diagnóstico que ve el cliente: da valor real (pasos concretos) y deja el trabajo
 * de fondo —ejecución, anuncios, automatización— para el equipo de JUALU.
 */
export const clientDiagnosisSchema = z.object({
  titulo: z.string().trim().min(5).max(220),
  resumen: z.string().trim().min(40).max(1300),
  prioridades: z
    .array(
      z.object({
        titulo: z.string().trim().min(3).max(200),
        por_que: z.string().trim().min(10).max(650),
        pasos: z.array(z.string().trim().min(5).max(450)).min(2).max(6),
      }),
    )
    .min(3)
    .max(5),
  siguiente_nivel: z.string().trim().min(30).max(950),
  cierre: z.string().trim().min(20).max(500),
})
export type ClientDiagnosis = z.infer<typeof clientDiagnosisSchema>

export interface ApiError {
  error: { code: string; message: string }
}
/** El cliente recibe solo su diagnóstico; la clasificación y la estrategia de venta son internas. */
export interface SubmitResponse {
  ok: true
  diagnostico: ClientDiagnosis
}

/** Texto que reemplaza a la empresa cuando el lead es una persona natural. */
export const NO_COMPANY = 'Sin empresa (persona natural)'

/** Respuestas completas o parciales (el avance se guarda paso a paso). */
export interface AnswersLike {
  contacto: ContactInfo
  objetivo?: ObjectiveId | null
  diagnostico?: DiagnosisAnswers
  presupuesto?: BudgetId | null
  urgencia?: UrgencyId | null
}

/** Respuestas en lenguaje natural (etiquetas, no ids) para la IA y la hoja de cálculo. */
export function describeAnswers(answers: AnswersLike) {
  const objective = getObjective(answers.objetivo)
  const given = answers.diagnostico ?? {}
  const diagnostico = (objective?.questions ?? [])
    .filter((q) => given[q.id] !== undefined && given[q.id] !== '')
    .map((q) => {
      const value = given[q.id]
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
    objetivo: objective?.label ?? '',
    diagnostico,
    presupuesto_mensual: answers.presupuesto ? `${optionLabel(BUDGET_RANGES, answers.presupuesto)} COP` : '',
    urgencia: answers.urgencia ? optionLabel(URGENCY_LEVELS, answers.urgencia) : '',
  }
}
