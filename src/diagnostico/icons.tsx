import { Bot, CreditCard, Globe, MessageCircle, Palette, Share2, Target, TrendingUp, type LucideIcon } from 'lucide-react';
import type { DiagnosisIcon } from '../../shared/schema';

/** Icono con el que se ilustra cada prioridad del diagnóstico. */
export const PRIORITY_ICONS: Record<DiagnosisIcon, LucideIcon> = {
  web: Globe,
  redes: Share2,
  whatsapp: MessageCircle,
  pagos: CreditCard,
  bot: Bot,
  ventas: TrendingUp,
  marca: Palette,
  anuncios: Target,
};

/** Las 5 paradas de la "ruta de ventas" de JUALU; cada una se ilumina si el diagnóstico la menciona. */
export const SALES_ROUTE: {
  id: string;
  label: string;
  icon: LucideIcon;
  matches: DiagnosisIcon[];
  /** Palabras que, si aparecen en el texto del diagnóstico, también encienden la parada. */
  words: string[];
}[] = [
  { id: 'web', label: 'Tu web', icon: Globe, matches: ['web', 'marca'], words: ['web', 'tienda', 'catálogo'] },
  { id: 'redes', label: 'Redes', icon: Share2, matches: ['redes', 'anuncios'], words: ['redes', 'instagram', 'facebook', 'tiktok', 'anuncio'] },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, matches: ['whatsapp'], words: ['whatsapp'] },
  { id: 'pagos', label: 'Pago en línea', icon: CreditCard, matches: ['pagos'], words: ['pago', 'cobr'] },
  { id: 'bot', label: 'Bot y ventas', icon: Bot, matches: ['bot', 'ventas'], words: ['bot', 'asistente', 'automát'] },
];
