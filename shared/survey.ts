/**
 * Configuración de la encuesta. Es la única fuente de verdad para el cliente
 * (UI) y el servidor (validación, prompt de IA y filas de Google Sheets).
 * Para cambiar preguntas, rangos de presupuesto o urgencias, edita este archivo.
 */

export interface Option {
  id: string
  label: string
}

export interface DiagnosisQuestion {
  id: string
  label: string
  helper?: string
  kind: 'single' | 'multi' | 'text'
  options?: readonly Option[]
  required: boolean
  maxSelections?: number
  maxLength?: number
}

export const OBJECTIVE_IDS = ['leads_ventas', 'posicionamiento_redes', 'web_ecommerce_automatizacion'] as const
export type ObjectiveId = (typeof OBJECTIVE_IDS)[number]

export interface Objective {
  id: ObjectiveId
  label: string
  description: string
  questions: readonly DiagnosisQuestion[]
}

const contextQuestion: DiagnosisQuestion = {
  id: 'contexto',
  label: '¿Algo más que debamos saber?',
  helper: 'Opcional: cuéntanos de tu negocio, lo que quieres lograr o cualquier detalle útil.',
  kind: 'text',
  required: false,
  maxLength: 500,
}

// Textos en lenguaje sencillo: quien responde puede no conocer términos de marketing
// (evita "leads", "embudo", "conversión", "CRM", "pauta", etc.).
export const OBJECTIVES: readonly Objective[] = [
  {
    id: 'leads_ventas',
    label: 'Conseguir más clientes y vender más',
    description: 'Atraer personas interesadas en lo que ofreces y convertirlas en ventas.',
    questions: [
      {
        id: 'canales_actuales',
        label: '¿Cómo consigues clientes hoy?',
        helper: 'Selecciona todas las que apliquen.',
        kind: 'multi',
        required: true,
        maxSelections: 7,
        options: [
          { id: 'referidos', label: 'Recomendaciones de otros clientes' },
          { id: 'redes', label: 'Redes sociales (Instagram, Facebook, TikTok…)' },
          { id: 'pauta', label: 'Anuncios pagados en internet' },
          { id: 'linkedin', label: 'Contactos en LinkedIn' },
          { id: 'outbound', label: 'Llamadas o visitas a posibles clientes' },
          { id: 'eventos', label: 'Ferias y eventos' },
          { id: 'ninguno', label: 'Aún no tengo una forma definida' },
        ],
      },
      {
        id: 'problema',
        label: '¿Qué es lo que más te cuesta para vender?',
        kind: 'single',
        required: true,
        options: [
          { id: 'pocos_leads', label: 'Me contactan muy pocas personas interesadas' },
          { id: 'baja_calidad', label: 'Me escriben, pero no son clientes reales' },
          { id: 'bajo_cierre', label: 'Me preguntan, pero pocos terminan comprando' },
          { id: 'ciclo_largo', label: 'Los clientes se demoran mucho en decidirse' },
          { id: 'sin_medicion', label: 'No sé de dónde vienen mis clientes' },
        ],
      },
      {
        id: 'volumen',
        label: '¿Cuántas personas interesadas te contactan al mes?',
        kind: 'single',
        required: true,
        options: [
          { id: 'menos_20', label: 'Menos de 20' },
          { id: '20_100', label: 'Entre 20 y 100' },
          { id: '100_500', label: 'Entre 100 y 500' },
          { id: 'mas_500', label: 'Más de 500' },
          { id: 'no_sabe', label: 'No lo sé' },
        ],
      },
      {
        id: 'resultado',
        label: '¿Qué te gustaría lograr en los próximos 3 meses?',
        kind: 'single',
        required: true,
        options: [
          { id: 'duplicar_leads', label: 'Tener el doble de clientes potenciales' },
          { id: 'reducir_cpl', label: 'Gastar menos para conseguir cada cliente' },
          { id: 'mejorar_conversion', label: 'Que más personas interesadas terminen comprando' },
          { id: 'embudo_cero', label: 'Empezar desde cero a atraer clientes por internet' },
        ],
      },
      contextQuestion,
    ],
  },
  {
    id: 'posicionamiento_redes',
    label: 'Darme a conocer en redes sociales',
    description: 'Que más personas conozcan tu marca y confíen en ella.',
    questions: [
      {
        id: 'redes_activas',
        label: '¿En qué redes sociales publicas hoy?',
        helper: 'Selecciona todas las que apliquen.',
        kind: 'multi',
        required: true,
        maxSelections: 6,
        options: [
          { id: 'instagram', label: 'Instagram' },
          { id: 'facebook', label: 'Facebook' },
          { id: 'linkedin', label: 'LinkedIn' },
          { id: 'tiktok', label: 'TikTok' },
          { id: 'youtube', label: 'YouTube' },
          { id: 'ninguna', label: 'En ninguna por ahora' },
        ],
      },
      {
        id: 'problema',
        label: '¿Qué es lo que más te preocupa de tus redes?',
        kind: 'single',
        required: true,
        options: [
          { id: 'bajo_alcance', label: 'Pocas personas ven o comentan mis publicaciones' },
          { id: 'inconsistencia', label: 'No publico seguido ni con un plan' },
          { id: 'poco_reconocimiento', label: 'Poca gente conoce mi marca' },
          { id: 'no_convierte', label: 'Tengo seguidores, pero no me compran' },
          { id: 'sin_equipo', label: 'No tengo tiempo ni a nadie que se encargue' },
        ],
      },
      {
        id: 'necesidades',
        label: '¿En qué te gustaría recibir ayuda?',
        helper: 'Selecciona todas las que apliquen.',
        kind: 'multi',
        required: true,
        maxSelections: 5,
        options: [
          { id: 'estrategia', label: 'Saber qué publicar y cuándo' },
          { id: 'audiovisual', label: 'Fotos y videos profesionales' },
          { id: 'comunidad', label: 'Responder mensajes y comentarios' },
          { id: 'pauta', label: 'Anuncios pagados en redes' },
          { id: 'influencers', label: 'Trabajar con influenciadores' },
        ],
      },
      {
        id: 'resultado',
        label: '¿Qué te gustaría lograr?',
        kind: 'single',
        required: true,
        options: [
          { id: 'referentes', label: 'Ser una marca reconocida en mi sector' },
          { id: 'comunidad', label: 'Tener más seguidores reales' },
          { id: 'demanda', label: 'Que las redes me traigan clientes' },
          { id: 'imagen', label: 'Que mi marca se vea más profesional' },
        ],
      },
      contextQuestion,
    ],
  },
  {
    id: 'web_ecommerce_automatizacion',
    label: 'Página web, tienda online y automatización',
    description: 'Tener una página que venda por ti y ahorrarte tareas repetitivas.',
    questions: [
      {
        id: 'estado_web',
        label: '¿Cómo está hoy tu página web?',
        kind: 'single',
        required: true,
        options: [
          { id: 'sin_sitio', label: 'No tengo página web' },
          { id: 'desactualizado', label: 'Tengo una, pero está desactualizada' },
          { id: 'sin_resultados', label: 'Tengo una, pero no me trae clientes ni ventas' },
          { id: 'tienda_limitada', label: 'Tengo tienda online, pero se queda corta' },
        ],
      },
      {
        id: 'necesidades',
        label: '¿Qué te gustaría tener o mejorar?',
        helper: 'Selecciona todas las que apliquen.',
        kind: 'multi',
        required: true,
        maxSelections: 6,
        options: [
          { id: 'corporativo', label: 'Una página web para mi negocio' },
          { id: 'ecommerce', label: 'Una tienda online' },
          { id: 'landing', label: 'Una página para una promoción o servicio' },
          { id: 'crm', label: 'Seguimiento automático a mis clientes' },
          { id: 'ia', label: 'Un asistente virtual o chat automático' },
          { id: 'integraciones', label: 'Conectar mis herramientas (pagos, inventario…)' },
        ],
      },
      {
        id: 'problema',
        label: '¿Qué te quita más tiempo o te frustra hoy?',
        kind: 'single',
        required: true,
        options: [
          { id: 'manuales', label: 'Hago muchas tareas a mano' },
          { id: 'movil', label: 'Mi página se ve mal en el celular' },
          { id: 'conversion', label: 'Me visitan, pero casi nadie compra o escribe' },
          { id: 'sin_crm', label: 'No llevo un registro ordenado de mis clientes' },
          { id: 'rendimiento', label: 'Mi página es lenta o falla' },
        ],
      },
      {
        id: 'resultado',
        label: '¿Qué te gustaría lograr?',
        kind: 'single',
        required: true,
        options: [
          { id: 'vender_online', label: 'Vender por internet' },
          { id: 'automatizar', label: 'Dar seguimiento a clientes sin hacerlo a mano' },
          { id: 'captar_leads', label: 'Que más clientes potenciales me contacten desde la web' },
          { id: 'reducir_operacion', label: 'Ahorrar tiempo en tareas del día a día' },
        ],
      },
      contextQuestion,
    ],
  },
]

/** Rangos de inversión mensual (COP). Edita etiquetas o agrega rangos libremente. */
export const BUDGET_RANGES = [
  { id: 'menos_1m', label: 'Menos de $1.000.000', caption: 'Para empezar' },
  { id: '1m_3m', label: '$1.000.000 – $3.000.000', caption: 'Para crecer' },
  { id: '3m_6m', label: '$3.000.000 – $6.000.000', caption: 'Para crecer más rápido' },
  { id: 'mas_6m', label: 'Más de $6.000.000', caption: 'Para expandirme' },
] as const satisfies readonly (Option & { caption: string })[]
export type BudgetId = (typeof BUDGET_RANGES)[number]['id']
export const BUDGET_IDS = BUDGET_RANGES.map((b) => b.id) as [BudgetId, ...BudgetId[]]
export const BUDGET_CURRENCY = 'COP'

export const URGENCY_LEVELS = [
  { id: 'inmediata', label: 'Lo antes posible', caption: 'Quiero empezar ya.' },
  { id: 'menos_1_mes', label: 'En menos de un mes', caption: 'Estoy eligiendo con quién trabajar.' },
  { id: 'evaluacion', label: 'Todavía lo estoy pensando', caption: 'Estoy mirando opciones, sin fecha definida.' },
] as const satisfies readonly (Option & { caption: string })[]
export type UrgencyId = (typeof URGENCY_LEVELS)[number]['id']
export const URGENCY_IDS = URGENCY_LEVELS.map((u) => u.id) as [UrgencyId, ...UrgencyId[]]

export function getObjective(id: ObjectiveId | null | undefined): Objective | undefined {
  return OBJECTIVES.find((o) => o.id === id)
}

export function optionLabel(options: readonly Option[] | undefined, id: string): string {
  return options?.find((o) => o.id === id)?.label ?? id
}
