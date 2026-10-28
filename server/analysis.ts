import { z } from 'zod'

// Solo servidor: el análisis es interno y no debe llegar al bundle del navegador.
export const CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'] as const
export type Classification = (typeof CLASSIFICATIONS)[number]

export const analysisSchema = z.object({
  clasificacion: z.enum(CLASSIFICATIONS),
  canal_sugerido: z.string().trim().min(2).max(200),
  estrategia_venta: z.array(z.string().trim().min(5).max(600)).length(3),
  script_contacto: z.string().trim().min(20).max(1200),
})
export type LeadAnalysis = z.infer<typeof analysisSchema>
