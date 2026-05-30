const express = require('express');
const { handleUssd } = require('../services/ussdHandler');

const router = express.Router();

/** Africa's Talking may send mixed-case or alternate field names */
function parseAtUssdBody(body = {}) {
  const pick = (...keys) => {
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && String(body[k]).trim() !== '') {
        return String(body[k]).trim();
      }
    }
    return '';
  };
  return {
    sessionId: pick('sessionId', 'SessionId', 'SESSIONID', 'session_id'),
    serviceCode: pick('serviceCode', 'ServiceCode', 'SERVICECODE', 'service_code'),
    phoneNumber: pick(
      'phoneNumber',
      'PhoneNumber',
      'PHONENUMBER',
      'phone_number',
      'msisdn',
      'MSISDN',
      'callerNumber',
      'CallerNumber'
    ),
    text: pick('text', 'Text', 'TEXT', 'ussdString'),
    networkCode: pick('networkCode', 'NetworkCode'),
  };
}

function sendUssd(res, message, status = 200) {
  const body = String(message || 'END Service unavailable. Try again.')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
  const valid = body.startsWith('CON ') || body.startsWith('CON\n') || body.startsWith('END ');
  const safe = valid ? body : `END ${body.replace(/^(CON|END)\s*/i, '')}`;
  res.status(status);
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(safe);
}

router.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'FreshRoute USSD callback is active. Africa\'s Talking must use POST.',
    method: 'POST',
    ngrokUrl: 'https://<your-host>/api/ussd',
    beforeDial:
      'POST /api/demo/link-sandbox-phone with your sandbox mobile in phoneNumber',
    testPost: {
      sessionId: 'test-1',
      phoneNumber: '+2547XXXXXXXX',
      text: '',
    },
  });
});

router.post('/', async (req, res) => {
  const payload = parseAtUssdBody(req.body);
  console.log('[USSD callback]', {
    ...payload,
    rawKeys: Object.keys(req.body || {}),
  });

  if (!payload.sessionId || !payload.phoneNumber) {
    console.error('[USSD] Missing fields. Body:', req.body);
    return sendUssd(
      res,
      'END FreshRoute: missing session. Check server logs and callback URL.'
    );
  }

  try {
    const response = await handleUssd({
      sessionId: payload.sessionId,
      serviceCode: payload.serviceCode,
      phoneNumber: payload.phoneNumber,
      text: payload.text ?? '',
    });
    return sendUssd(res, response);
  } catch (err) {
    console.error('[USSD] Handler error:', err);
    return sendUssd(res, 'END FreshRoute error. Please try again shortly.');
  }
});

module.exports = router;
