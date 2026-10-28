import { useCallback, useEffect, useMemo, useReducer } from 'react'
import {
  contactSchema,
  surveySchema,
  validateDiagnosis,
  type ContactInfo,
  type DiagnosisAnswers,
  type SurveyAnswers,
} from '../../shared/schema'
import { BUDGET_IDS, URGENCY_IDS, type BudgetId, type ObjectiveId, type UrgencyId } from '../../shared/survey'
import { loadSession, newSubmissionId, saveSession } from './storage'

export const STEPS = [
  { id: 'contacto', title: 'Contacto', subtitle: '¿Con quién hablamos?' },
  { id: 'objetivo', title: 'Objetivo', subtitle: '¿Qué quieres lograr?' },
  { id: 'diagnostico', title: 'Diagnóstico', subtitle: 'Cuéntanos tu situación' },
  { id: 'presupuesto', title: 'Inversión', subtitle: 'Inversión mensual estimada' },
  { id: 'urgencia', title: 'Urgencia', subtitle: '¿Cuándo quieres empezar?' },
] as const

export const LAST_STEP = STEPS.length - 1

export interface SurveyDraft {
  contacto: ContactInfo
  objetivo: ObjectiveId | null
  diagnostico: DiagnosisAnswers
  presupuesto: BudgetId | null
  urgencia: UrgencyId | null
}

interface SurveyState {
  step: number
  maxStep: number
  direction: 1 | -1
  draft: SurveyDraft
  submissionId: string
}

type Action =
  | { type: 'contact'; field: keyof ContactInfo; value: string }
  | { type: 'objective'; value: ObjectiveId }
  | { type: 'diagnosis'; id: string; value: string | string[] | undefined }
  | { type: 'budget'; value: BudgetId }
  | { type: 'urgency'; value: UrgencyId }
  | { type: 'goto'; step: number }
  | { type: 'reset' }

const STORAGE_KEY = 'jualu-diagnostico-survey:v1'

function initialState(): SurveyState {
  return {
    step: 0,
    maxStep: 0,
    direction: 1,
    submissionId: newSubmissionId(),
    draft: {
      contacto: { nombre: '', empresa: '', correo: '', whatsapp: '' },
      objetivo: null,
      diagnostico: {},
      presupuesto: null,
      urgencia: null,
    },
  }
}

function reducer(state: SurveyState, action: Action): SurveyState {
  const { draft } = state
  switch (action.type) {
    case 'contact':
      return { ...state, draft: { ...draft, contacto: { ...draft.contacto, [action.field]: action.value } } }
    case 'objective':
      // Cambiar de objetivo invalida el diagnóstico condicional anterior.
      if (draft.objetivo === action.value) return state
      return { ...state, maxStep: Math.min(state.maxStep, 2), draft: { ...draft, objetivo: action.value, diagnostico: {} } }
    case 'diagnosis': {
      const diagnostico = { ...draft.diagnostico }
      const empty = action.value === undefined || action.value === '' || (Array.isArray(action.value) && !action.value.length)
      if (empty) delete diagnostico[action.id]
      else diagnostico[action.id] = action.value as string | string[]
      return { ...state, draft: { ...draft, diagnostico } }
    }
    case 'budget':
      return { ...state, draft: { ...draft, presupuesto: action.value } }
    case 'urgency':
      return { ...state, draft: { ...draft, urgencia: action.value } }
    case 'goto': {
      const step = Math.max(0, Math.min(LAST_STEP, action.step))
      return { ...state, step, direction: step >= state.step ? 1 : -1, maxStep: Math.max(state.maxStep, step) }
    }
    case 'reset':
      return initialState()
  }
}

export type StepErrors = Record<string, string>

/** Errores de validación del paso indicado (vacío = paso válido). */
export function validateStep(step: number, draft: SurveyDraft): StepErrors {
  switch (step) {
    case 0: {
      const result = contactSchema.safeParse(draft.contacto)
      if (result.success) return {}
      const errors: StepErrors = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        errors[key] ??= issue.message
      }
      return errors
    }
    case 1:
      return draft.objetivo ? {} : { objetivo: 'Selecciona el objetivo principal.' }
    case 2:
      return validateDiagnosis(draft.objetivo, draft.diagnostico)
    case 3:
      // Comprueba contra la lista actual: un borrador guardado puede tener un rango que ya no existe.
      return draft.presupuesto && BUDGET_IDS.includes(draft.presupuesto)
        ? {}
        : { presupuesto: 'Selecciona un rango de inversión.' }
    case 4:
      return draft.urgencia && URGENCY_IDS.includes(draft.urgencia) ? {} : { urgencia: 'Indica cuándo quieres empezar.' }
    default:
      return {}
  }
}

/** Valida la encuesta completa; si falla, indica el primer paso con errores. */
export function finalizeDraft(draft: SurveyDraft): { answers: SurveyAnswers } | { invalidStep: number } {
  for (let step = 0; step <= LAST_STEP; step++) {
    if (Object.keys(validateStep(step, draft)).length) return { invalidStep: step }
  }
  const parsed = surveySchema.safeParse(draft)
  return parsed.success ? { answers: parsed.data } : { invalidStep: 0 }
}

export function useSurvey() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadSession<SurveyState>(STORAGE_KEY) ?? initialState())

  useEffect(() => saveSession(STORAGE_KEY, state), [state])

  const errors = useMemo(() => validateStep(state.step, state.draft), [state.step, state.draft])

  const goTo = useCallback((step: number) => dispatch({ type: 'goto', step }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { ...state, errors, dispatch, goTo, reset }
}

export type SurveyDispatch = ReturnType<typeof useSurvey>['dispatch']
