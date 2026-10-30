import { z } from 'zod'
import { clientDiagnosisSchema } from '../shared/schema.js'

// Solo servidor: la clasificación y la estrategia de venta son internas y no llegan al navegador.
export const CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'] as const
export type Classification = (typeof CLASSIFICATIONS)[number]

export const analysisSchema = z.object({
  clasificacion: z.enum(CLASSIFICATIONS),
  canal_sugerido: z.string().trim().min(2).max(200),
  estrategia_venta: z.array(z.string().trim().min(5).max(600)).length(3),
  script_contacto: z.string().trim().min(20).max(1200),
  /** Lo único del análisis que se muestra al cliente. */
  diagnostico_cliente: clientDiagnosisSchema,
})
export type LeadAnalysis = z.infer<typeof analysisSchema>
