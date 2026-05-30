const axios = require('axios');
const config = require('../config');
const { addApiActivity } = require('../store');

async function callBackend(path, body, options = {}) {
  const url = `${config.atBackendUrl}${path}`;
  if (config.mockAt) {
    return { ok: true, mocked: true, url, body };
  }
  try {
    const res = await axios.post(url, body, {
      timeout: 20000,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    return { ok: true, data: res.data };
  } catch (err) {
    const details = err.response?.data || err.message;
    return { ok: false, error: details };
  }
}

function logActivity({
  shipmentId,
  product,
  direction,
  recipientPhone,
  summary,
  status,
  rawResponse,
  reason,
}) {
  return addApiActivity({
    shipmentId: shipmentId || null,
    product,
    direction: direction || 'outbound',
    recipientPhone: recipientPhone || null,
    summary,
    status,
    reason: reason || null,
    rawResponse: rawResponse ? JSON.stringify(rawResponse).slice(0, 500) : null,
  });
}

async function sendSms({ to, message, shipmentId, reason }) {
  const result = await callBackend('/sms/send', { to, message });
  const status = config.mockAt
    ? 'mocked'
    : result.ok
      ? 'sent'
      : 'failed';
  logActivity({
    shipmentId,
    product: 'sms',
    recipientPhone: Array.isArray(to) ? to.join(',') : to,
    summary: message.slice(0, 120),
    status,
    rawResponse: result,
    reason,
  });
  return { status, result };
}

async function sendBulkSms({ recipients, message, shipmentId, reason }) {
  const result = await callBackend('/sms/bulk', { recipients, message });
  const status = config.mockAt ? 'mocked' : result.ok ? 'sent' : 'failed';
  logActivity({
    shipmentId,
    product: 'sms',
    recipientPhone: recipients.join(','),
    summary: `Bulk: ${message.slice(0, 80)}`,
    status,
    rawResponse: result,
    reason,
  });
  return { status, result };
}

async function startVoiceCall({ callTo, shipmentId, reason, message }) {
  const callFrom = process.env.AT_VOICE_PHONE_NUMBER;
  const result = await callBackend('/voice/call', {
    callFrom,
    callTo,
  });
  const status = config.mockAt ? 'mocked' : result.ok ? 'sent' : 'failed';
  logActivity({
    shipmentId,
    product: 'voice',
    recipientPhone: callTo,
    summary: message || 'Dispatcher escalation',
    status,
    rawResponse: result,
    reason,
  });
  return { status, result };
}

async function sendAirtime({ phoneNumber, amount, currencyCode, shipmentId, reason }) {
  const result = await callBackend('/airtime/send', {
    phoneNumber,
    amount: String(amount),
    currencyCode: currencyCode || config.airtimeCurrency,
  });
  const status = config.mockAt ? 'mocked' : result.ok ? 'sent' : 'failed';
  logActivity({
    shipmentId,
    product: 'airtime',
    recipientPhone: phoneNumber,
    summary: `${amount} ${currencyCode || config.airtimeCurrency}`,
    status,
    rawResponse: result,
    reason,
  });
  return { status, result };
}

async function sendWhatsApp({ to, message, shipmentId, reason, waNumber }) {
  const sender = waNumber || config.whatsappSender;

  if (!config.whatsappEnabled) {
    const skipped = { ok: false, skipped: true, error: 'WHATSAPP_ENABLED=false' };
    logActivity({
      shipmentId,
      product: 'whatsapp',
      recipientPhone: Array.isArray(to) ? to.join(',') : to,
      summary: message.slice(0, 120),
      status: 'skipped',
      rawResponse: skipped,
      reason,
    });
    return { status: 'skipped', result: skipped };
  }

  if (!sender) {
    const missing = {
      ok: false,
      error: 'Set AT_WHATSAPP_SENDER in AT backend .env (WhatsApp Business number from dashboard)',
    };
    logActivity({
      shipmentId,
      product: 'whatsapp',
      recipientPhone: Array.isArray(to) ? to.join(',') : to,
      summary: message.slice(0, 120),
      status: 'failed',
      rawResponse: missing,
      reason,
    });
    return { status: 'failed', result: missing };
  }

  const result = await callBackend('/whatsapp/send', {
    to,
    message,
    waNumber: sender,
  });
  const status = config.mockAt ? 'mocked' : result.ok ? 'sent' : 'failed';
  logActivity({
    shipmentId,
    product: 'whatsapp',
    recipientPhone: Array.isArray(to) ? to.join(',') : to,
    summary: message.slice(0, 120),
    status,
    rawResponse: result,
    reason,
  });
  return { status, result };
}

function recordUssdInbound({ phoneNumber, sessionId, text, shipmentId, summary }) {
  return logActivity({
    shipmentId,
    product: 'ussd',
    direction: 'inbound',
    recipientPhone: phoneNumber,
    summary: summary || `USSD: ${text || '(main menu)'}`,
    status: 'received',
    reason: 'ussd_session',
  });
}

module.exports = {
  sendSms,
  sendBulkSms,
  startVoiceCall,
  sendAirtime,
  sendWhatsApp,
  recordUssdInbound,
  logActivity,
};
