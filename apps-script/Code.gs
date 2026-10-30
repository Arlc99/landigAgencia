/**
 * Webhook de Google Sheets para el diagnóstico gratuito de JUALU.
 *
 * Guarda cada persona en UNA fila (clave: ID envío) y la actualiza a medida que avanza:
 *   Estado "Parcial"  → llenó parte de la encuesta (se interesó pero no terminó).
 *   Estado "Completo" → terminó y recibió su diagnóstico.
 *
 * Despliegue:
 *  1. Abre la hoja de cálculo → Extensiones → Apps Script y pega este archivo.
 *  2. (Obligatorio) Configuración del proyecto → Propiedades del script →
 *     agrega WEBHOOK_SECRET con el mismo valor que GOOGLE_SHEETS_WEBHOOK_SECRET.
 *  3. Implementar → Administrar implementaciones → editar → Versión: Nueva versión.
 *     (Primera vez: Nueva implementación → Aplicación web, ejecutar como "Yo", acceso "Cualquier persona".)
 *  4. La URL (termina en /exec) va en GOOGLE_SHEETS_WEBHOOK_URL.
 *  Cada cambio en este código requiere una nueva versión de la implementación.
 *
 * Las columnas se ubican por su ENCABEZADO: puedes moverlas o agregar otras sin romper nada.
 * Si falta alguna columna de la lista, el script la agrega al final.
 */

const SHEET_NAME = 'Diagnósticos JUALU';

// [clave que envía el servidor, encabezado en la hoja]
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
  ['estado', 'Estado'],
  ['ultimo_paso', 'Último paso'],
  ['actualizado', 'Última actualización (UTC)'],
  ['consentimiento', 'Consentimiento datos'],
  ['diagnostico_entregado', 'Diagnóstico entregado al cliente'],
  ['seguimiento', 'Seguimiento'],
];

const STATES = ['Parcial', 'Completo'];
const CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'];
const REQUIRED = ['submissionId', 'nombre', 'correo', 'whatsapp', 'estado'];
const REQUIRED_COMPLETE = ['objetivo', 'presupuesto', 'urgencia', 'clasificacion'];
const MAX_CELL = 5000;
const MAIL_MARK = 'Correo enviado';
// Estas claves se escriben una sola vez, al crear la fila.
const WRITE_ONCE = ['fecha'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
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
    locked = true;

    const sheet = getSheet();
    const columns = ensureColumns(sheet);
    const row = findRow(sheet, columns, lead.submissionId);

    if (!row) {
      appendLead(sheet, columns, lead);
      const mail = maybeSendEmail(sheet, columns, sheet.getLastRow(), lead, body.email);
      return respond({ ok: true, created: true, email: mail });
    }

    // Un avance "Parcial" que llega tarde nunca pisa una encuesta ya "Completo".
    const current = sheet.getRange(row, columns.estado + 1).getValue();
    if (current === 'Completo' && lead.estado === 'Parcial') return respond({ ok: true, ignored: true });

    updateLead(sheet, columns, row, lead);
    const mail = maybeSendEmail(sheet, columns, row, lead, body.email);
    return respond({ ok: true, created: false, email: mail });
  } catch (err) {
    console.error(err);
    return respond({ ok: false, error: 'server_error' });
  } finally {
    if (locked) lock.releaseLock();
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
  if (STATES.indexOf(lead.estado) === -1) return 'invalid_estado';
  if (lead.estado === 'Completo') {
    for (let i = 0; i < REQUIRED_COMPLETE.length; i++) {
      const value = lead[REQUIRED_COMPLETE[i]];
      if (typeof value !== 'string' || !value.trim()) return 'missing_' + REQUIRED_COMPLETE[i];
    }
    if (CLASSIFICATIONS.indexOf(lead.clasificacion) === -1) return 'invalid_clasificacion';
  }
  return null;
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  return sheet;
}

/** Devuelve { clave: índice de columna (base 0) }; crea encabezados que falten. */
function ensureColumns(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (col) { return col[1]; }));
    sheet.setFrozenRows(1);
  }
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const columns = {};
  let next = lastCol;
  COLUMNS.forEach(function (col) {
    let index = headers.indexOf(col[1]);
    if (index === -1) {
      index = next++;
      sheet.getRange(1, index + 1).setValue(col[1]);
    }
    columns[col[0]] = index;
  });
  sheet.getRange(1, 1, 1, Math.max(next, lastCol)).setFontWeight('bold');
  return columns;
}

/** Número de fila (base 1) de la persona, o 0 si es nueva. */
function findRow(sheet, columns, id) {
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return 0;
  const found = sheet
    .getRange(2, columns.submissionId + 1, rows, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext();
  return found ? found.getRow() : 0;
}

function appendLead(sheet, columns, lead) {
  const width = sheet.getLastColumn();
  const values = [];
  for (let i = 0; i < width; i++) values.push('');
  COLUMNS.forEach(function (col) {
    if (lead[col[0]] !== undefined && lead[col[0]] !== null) values[columns[col[0]]] = sanitize(lead[col[0]]);
  });
  sheet.appendRow(values);
}

/** Solo escribe las claves recibidas: lo que ya estaba en la fila no se borra ni se vuelve a escribir. */
function updateLead(sheet, columns, row, lead) {
  COLUMNS.forEach(function (col) {
    const key = col[0];
    if (WRITE_ONCE.indexOf(key) !== -1) return;
    if (lead[key] === undefined || lead[key] === null) return;
    const cell = sheet.getRange(row, columns[key] + 1);
    // Si dos avances llegan desordenados, el último paso nunca retrocede.
    if (key === 'ultimo_paso' && stepNumber(lead[key]) < stepNumber(cell.getValue())) return;
    cell.setValue(sanitize(lead[key]));
  });
}

/**
 * Correo automático con el diagnóstico. Solo cuando la encuesta está "Completo" y solo una vez por persona:
 * el resultado queda en la columna "Seguimiento" ("Correo enviado <fecha>" o "Correo no enviado: <motivo>").
 * Un fallo al enviar NUNCA impide guardar la fila.
 */
function maybeSendEmail(sheet, columns, row, lead, email) {
  if (lead.estado !== 'Completo' || !email) return 'no_aplica';
  const cell = sheet.getRange(row, columns.seguimiento + 1);
  if (String(cell.getValue()).indexOf(MAIL_MARK) !== -1) return 'ya_enviado';

  const problem = validateEmail(lead, email);
  if (problem) {
    cell.setValue('Correo no enviado: ' + problem);
    return problem;
  }
  try {
    if (MailApp.getRemainingDailyQuota() < 1) {
      cell.setValue('Correo no enviado: cuota diaria agotada');
      return 'cuota_agotada';
    }
    MailApp.sendEmail({ to: email.to, subject: email.subject, body: email.text, htmlBody: email.html, name: 'JUALU' });
    cell.setValue(MAIL_MARK + ' ' + new Date().toISOString());
    return 'enviado';
  } catch (err) {
    console.error(err);
    cell.setValue('Correo no enviado: ' + String(err).slice(0, 200));
    return 'error';
  }
}

/** El correo solo puede ir al correo de la propia persona (el webhook no sirve para escribirle a terceros). */
function validateEmail(lead, email) {
  if (typeof email !== 'object') return 'correo_invalido';
  if (typeof email.to !== 'string' || email.to.toLowerCase() !== String(lead.correo).toLowerCase()) return 'destinatario_no_coincide';
  if (typeof email.subject !== 'string' || !email.subject.trim() || email.subject.length > 200) return 'asunto_invalido';
  if (typeof email.html !== 'string' || email.html.length > 100000) return 'html_invalido';
  if (typeof email.text !== 'string' || email.text.length > 30000) return 'texto_invalido';
  return null;
}

/**
 * Ejecútala UNA vez a mano desde el editor (▶ Ejecutar) para que Google te pida permiso de enviar correos.
 * Después publica una nueva versión de la implementación.
 */
function autorizarCorreo() {
  console.log('Cuota diaria de correos restante: ' + MailApp.getRemainingDailyQuota());
}

/** "3 de 5" → 3 (0 si no se entiende). */
function stepNumber(value) {
  const match = /^\s*(\d+)/.exec(String(value));
  return match ? Number(match[1]) : 0;
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
