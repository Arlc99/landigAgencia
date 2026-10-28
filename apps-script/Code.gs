/**
 * Webhook de Google Sheets para el diagnóstico gratuito de JUALU.
 *
 * Despliegue:
 *  1. Crea una hoja de cálculo → Extensiones → Apps Script y pega este archivo.
 *  2. (Obligatorio) Configuración del proyecto → Propiedades del script →
 *     agrega WEBHOOK_SECRET con el mismo valor que GOOGLE_SHEETS_WEBHOOK_SECRET.
 *  3. Implementar → Nueva implementación → Aplicación web.
 *     Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.
 *  4. Copia la URL (termina en /exec) en GOOGLE_SHEETS_WEBHOOK_URL.
 *  Cada cambio en este código requiere una nueva versión de la implementación.
 */

const SHEET_NAME = 'Diagnósticos JUALU';

// El orden define las columnas; las claves coinciden con buildLeadRow() en server/sheets.ts.
const COLUMNS = [
  ['submissionId', 'ID envío'],
  ['fecha', 'Fecha (UTC)'],
  ['nombre', 'Nombre'],
  ['empresa', 'Empresa'],
  ['correo', 'Correo'],
  ['whatsapp', 'WhatsApp'],
  ['objetivo', 'Objetivo'],
  ['diagnostico', 'Diagnóstico'],
  ['presupuesto', 'Presupuesto mensual'],
  ['urgencia', 'Urgencia'],
  ['clasificacion', 'Clasificación'],
  ['canal_sugerido', 'Canal sugerido'],
  ['estrategia_venta', 'Estrategia de venta'],
  ['script_contacto', 'Script WhatsApp'],
  ['respuestas_json', 'Respuestas (JSON)'],
];

// "empresa" no es obligatoria: el formulario también lo responden personas naturales.
const REQUIRED = ['submissionId', 'nombre', 'correo', 'whatsapp', 'objetivo', 'presupuesto', 'urgencia', 'clasificacion'];
const CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'];
const MAX_CELL = 5000;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) return respond({ ok: false, error: 'empty_body' });

    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return respond({ ok: false, error: 'invalid_json' });
    }

    const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    // Cierra por defecto: sin WEBHOOK_SECRET configurado nadie puede escribir en la hoja.
    if (!secret || body.secret !== secret) return respond({ ok: false, error: 'unauthorized' });

    const lead = body.lead;
    const problem = validate(lead);
    if (problem) return respond({ ok: false, error: problem });

    // El bloqueo evita filas duplicadas si llegan dos envíos simultáneos con el mismo ID.
    lock.waitLock(10000);
    const sheet = getSheet();
    if (isDuplicate(sheet, lead.submissionId)) return respond({ ok: true, duplicate: true });

    sheet.appendRow(COLUMNS.map(function (col) { return sanitize(lead[col[0]]); }));
    return respond({ ok: true, duplicate: false });
  } catch (err) {
    console.error(err);
    return respond({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

/** No expone nada por GET: la hoja solo se escribe por POST con secreto. */
function doGet() {
  return respond({ ok: false });
}

function validate(lead) {
  if (!lead || typeof lead !== 'object') return 'missing_lead';
  for (let i = 0; i < REQUIRED.length; i++) {
    const value = lead[REQUIRED[i]];
    if (typeof value !== 'string' || !value.trim()) return 'missing_' + REQUIRED[i];
  }
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(lead.submissionId)) return 'invalid_submissionId';
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(lead.correo)) return 'invalid_correo';
  if (!/^\d{10,15}$/.test(lead.whatsapp)) return 'invalid_whatsapp';
  if (CLASSIFICATIONS.indexOf(lead.clasificacion) === -1) return 'invalid_clasificacion';
  return null;
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (col) { return col[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sheet;
}

function isDuplicate(sheet, id) {
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return false;
  return sheet.getRange(2, 1, rows, 1).createTextFinder(id).matchEntireCell(true).findNext() !== null;
}

/** Convierte a texto, recorta y neutraliza fórmulas (=, +, -, @) para evitar inyección en la hoja. */
function sanitize(value) {
  if (value === undefined || value === null) return '';
  let text = String(value).slice(0, MAX_CELL);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
