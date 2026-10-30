import { BRAND_CITY, BRAND_NAME, CALENDAR_URL } from '../shared/brand.js'
import type { ClientDiagnosis, DiagnosisIcon } from '../shared/schema.js'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
}

/** Todo lo dinámico (nombre, texto de la IA) se escapa: el correo nunca interpreta HTML ajeno. */
const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const oneLine = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim()

// Colores de marca JUALU (el cian del degradado de la landing) sobre fondo claro para que se lea en cualquier cliente de correo.
const INK = '#0c0c0c'
const CYAN = '#00d2ff'
const CYAN_DARK = '#007a99'
const MUTED = '#5b6470'

// Los correos no pueden usar los iconos de la web: se ilustran con emojis, que casi todos los clientes muestran.
const ICON_EMOJI: Record<DiagnosisIcon, string> = {
  web: '&#127760;',
  redes: '&#128241;',
  whatsapp: '&#128172;',
  pagos: '&#128179;',
  bot: '&#129302;',
  ventas: '&#128200;',
  marca: '&#127912;',
  anuncios: '&#127919;',
}

const ROUTE = [
  ['&#127760;', 'Tu web'],
  ['&#128241;', 'Redes'],
  ['&#128172;', 'WhatsApp'],
  ['&#128179;', 'Pago en l&iacute;nea'],
  ['&#129302;', 'Bot y ventas'],
] as const

/** Correo breve con el diagnóstico que vio el cliente, con el sello JUALU y la invitación a agendar. */
export function buildDiagnosisEmail(to: string, nombre: string, d: ClientDiagnosis): EmailMessage {
  const firstName = oneLine(nombre.split(/\s+/)[0] ?? nombre)
  const subject = `${firstName}, tu diagnóstico ${BRAND_NAME} está listo`

  const problems = d.problemas
    .map(
      (p, i) => `
        <tr><td style="padding:0 0 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e8ee;border-radius:14px;">
            <tr>
              <td width="62" valign="top" style="padding:16px 0 16px 16px;">
                <div style="width:44px;height:44px;border-radius:12px;background:#fff6e0;border:1px solid #f6dfa3;text-align:center;font:400 22px/44px Arial,sans-serif;">${ICON_EMOJI[p.icono]}</div>
              </td>
              <td valign="top" style="padding:16px 18px 14px 12px;">
                <p style="margin:0 0 2px 0;font:700 11px Arial,sans-serif;letter-spacing:1.5px;color:#9a6b00;">PROBLEMA ${i + 1}</p>
                <p style="margin:0 0 8px 0;font:700 16px/1.35 Arial,sans-serif;color:${INK};">${esc(p.problema)}</p>
                <p style="margin:0;padding:9px 12px;background:#eaf9fd;border-radius:8px;font:400 14px/1.45 Arial,sans-serif;color:#1f2933;"><span style="color:${CYAN_DARK};font-weight:700;">Soluci&oacute;n ${BRAND_NAME}:</span> ${esc(p.solucion)}</p>
              </td>
            </tr>
          </table>
        </td></tr>`,
    )
    .join('')

  const route = ROUTE.map(
    ([emoji, label]) =>
      `<td align="center" valign="top" style="padding:0 2px;width:20%;"><div style="width:42px;height:42px;margin:0 auto;border-radius:21px;background:#ffffff;border:1px solid #bfeaf5;text-align:center;font:400 20px/42px Arial,sans-serif;">${emoji}</div><p style="margin:6px 0 0 0;font:600 11px/1.3 Arial,sans-serif;color:${INK};">${label}</p></td>`,
  ).join('')

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f2f5f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f8;"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
    <tr><td style="background:${INK};padding:26px 28px;border-bottom:3px solid ${CYAN};">
      <p style="margin:0;font:700 22px Arial,sans-serif;letter-spacing:4px;color:#ffffff;">${BRAND_NAME}</p>
      <p style="margin:4px 0 0 0;font:400 12px Arial,sans-serif;color:#9aa5b1;">Agencia de marketing digital &middot; ${esc(BRAND_CITY)}</p>
    </td></tr>
    <tr><td style="padding:28px 28px 20px 28px;">
      <p style="margin:0 0 6px 0;font:700 11px Arial,sans-serif;letter-spacing:1.5px;color:${CYAN_DARK};">D&Oacute;NDE EST&Aacute;S HOY</p>
      <p style="margin:0 0 8px 0;font:400 14px Arial,sans-serif;color:${MUTED};">Hola ${esc(firstName)}, este es tu diagn&oacute;stico gratuito:</p>
      <h1 style="margin:0 0 12px 0;font:700 23px/1.25 Arial,sans-serif;color:${INK};">${esc(d.titulo)}</h1>
      <p style="margin:0;font:400 15px/1.6 Arial,sans-serif;color:#1f2933;">${esc(d.resumen)}</p>
    </td></tr>
    <tr><td style="padding:0 28px;"><p style="margin:0 0 12px 0;font:700 11px Arial,sans-serif;letter-spacing:1.5px;color:#9a6b00;">LO QUE EST&Aacute; FRENANDO TUS VENTAS</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${problems}</table></td></tr>
    <tr><td style="padding:4px 28px 8px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf9fd;border-radius:14px;">
        <tr><td style="padding:18px 14px 6px 14px;"><p style="margin:0;text-align:center;font:700 11px Arial,sans-serif;letter-spacing:1.5px;color:${CYAN_DARK};">TU SISTEMA DE VENTAS CON ${BRAND_NAME}</p></td></tr>
        <tr><td style="padding:10px 10px 4px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${route}</tr></table></td></tr>
        <tr><td style="padding:6px 0 14px 0;font-size:1px;line-height:1px;">&nbsp;</td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 28px 8px 28px;">
      <p style="margin:0 0 16px 0;font:600 15px/1.5 Arial,sans-serif;color:${INK};">${esc(d.cierre)}</p>
      <a href="${esc(CALENDAR_URL)}" style="display:inline-block;background:${CYAN};color:#04121a;text-decoration:none;font:700 15px Arial,sans-serif;padding:14px 30px;border-radius:999px;">Agendar mi cita gratis</a>
      <p style="margin:14px 0 0 0;font:400 12px Arial,sans-serif;color:${MUTED};">Un asesor de ${BRAND_NAME} tambi&eacute;n se pondr&aacute; en contacto contigo.</p>
    </td></tr>
    <tr><td style="padding:24px 28px 28px 28px;">
      <hr style="border:none;border-top:1px solid #e3e8ee;margin:0 0 16px 0;">
      <p style="margin:0;font:400 11px/1.6 Arial,sans-serif;color:#8792a0;">Recibes este correo porque pediste tu diagn&oacute;stico gratuito en ${BRAND_NAME}. Si no quieres recibir m&aacute;s mensajes o quieres que borremos tus datos, responde a este correo con la palabra &ldquo;BORRAR&rdquo;.</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`

  const text = [
    `Hola ${firstName}, este es tu diagnóstico gratuito de ${BRAND_NAME}:`,
    '',
    d.titulo,
    d.resumen,
    '',
    'LO QUE ESTÁ FRENANDO TUS VENTAS',
    ...d.problemas.flatMap((p, i) => [`${i + 1}. ${p.problema}`, `   Solución ${BRAND_NAME}: ${p.solucion}`]),
    '',
    d.cierre,
    `Agenda tu cita gratis: ${CALENDAR_URL}`,
    '',
    `— Equipo ${BRAND_NAME} · ${BRAND_CITY}`,
    'Si no quieres recibir más mensajes o quieres que borremos tus datos, responde con la palabra BORRAR.',
  ].join('\n')

  return { to, subject: oneLine(subject), html, text }
}
