/**
 * Proxy Africa's Talking inbound webhooks to the AT demo backend (port 3000).
 * Use these URLs in the AT dashboard if your single ngrok tunnel points at FreshRoute (3001).
 */
const express = require('express');
const axios = require('axios');
const config = require('../config');
const { addApiActivity } = require('../store');

const router = express.Router();

async function proxyToAt(req, res, atPath, product) {
  const url = `${config.atBackendUrl}${atPath}`;
  try {
    const headers = { ...req.headers };
    delete headers.host;

    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers,
      params: req.query,
      timeout: 15000,
      validateStatus: () => true,
    });

    addApiActivity({
      product,
      direction: 'inbound',
      recipientPhone: req.body?.phoneNumber || req.body?.from || null,
      summary: `Webhook proxied: ${req.method} ${atPath}`,
      status: response.status < 400 ? 'received' : 'failed',
      rawResponse: { status: response.status, proxied: true },
      reason: 'at_webhook_proxy',
    });

    res.status(response.status);
    if (typeof response.data === 'string') {
      res.set(response.headers['content-type'] || 'text/plain');
      return res.send(response.data);
    }
    return res.json(response.data);
  } catch (err) {
    addApiActivity({
      product,
      direction: 'inbound',
      summary: `Webhook proxy failed: ${atPath}`,
      status: 'failed',
      rawResponse: { error: err.message },
      reason: 'at_webhook_proxy',
    });
    return res.status(502).json({
      error: 'AT backend unreachable',
      atBackendUrl: config.atBackendUrl,
      details: err.message,
    });
  }
}

router.get('/', (req, res) => {
  const base = req.protocol + '://' + req.get('host');
  res.json({
    ok: true,
    message: 'Proxy inbound AT webhooks here when ngrok points at FreshRoute (3001).',
    atBackendUrl: config.atBackendUrl,
    callbacks: {
      ussd: `${base}/api/ussd`,
      smsInbound: `${base}/api/webhooks/sms/inbound`,
      voiceEvents: `${base}/api/webhooks/voice/events`,
      voiceActions: `${base}/api/webhooks/voice/actions`,
      whatsapp: `${base}/api/webhooks/whatsapp/webhook`,
    },
    directAtBackend: {
      note: 'Or run ngrok on port 3000 and use these paths on the AT server',
      smsInbound: '/sms/inbound',
      ussd: '/ussd (demo menu only — use FreshRoute /api/ussd for product)',
      voiceEvents: '/voice/events',
      voiceActions: '/voice/actions',
      whatsapp: '/whatsapp/webhook',
    },
    outboundNote:
      'SMS, Voice, Airtime, WhatsApp sends are outbound API calls from FreshRoute → AT backend. No dashboard callback required for one-way send.',
    airtimeNote: 'Airtime has no inbound webhook in this project.',
  });
});

router.post('/sms/inbound', (req, res) => proxyToAt(req, res, '/sms/inbound', 'sms'));
router.post('/voice/events', (req, res) => proxyToAt(req, res, '/voice/events', 'voice'));
router.get('/voice/events', (req, res) => proxyToAt(req, res, '/voice/events', 'voice'));
router.post('/voice/actions', (req, res) => proxyToAt(req, res, '/voice/actions', 'voice'));
router.post('/whatsapp/webhook', (req, res) =>
  proxyToAt(req, res, '/whatsapp/webhook', 'whatsapp')
);

module.exports = router;
