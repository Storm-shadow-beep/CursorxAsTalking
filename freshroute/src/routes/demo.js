const express = require('express');
const { resetStore, getShipment, addEvent, state } = require('../store');
const shipmentService = require('../services/shipmentService');
const { sampleTomatoShipment, sampleFishShipment } = require('../data/seed');
const { calculateSpoilageRisk } = require('../services/spoilage');

const router = express.Router();

router.post('/reset', (req, res) => {
  resetStore();
  res.json({ ok: true, message: 'Demo data reset' });
});

/** Test real airtime credit to driver (Africa's Talking Airtime API) */
router.post('/test-airtime-reward', async (req, res, next) => {
  try {
    const shipment = getShipment(req.body.shipmentId) || state.shipments[0];
    if (!shipment) {
      return res.status(400).json({ error: 'No shipment. Run link-sandbox-pair first.' });
    }
    const phone = req.body.phoneNumber || shipment.driverPhone;
    const at = require('../services/africaTalking');
    const config = require('../config');
    const airtime = await at.sendAirtime({
      phoneNumber: phone,
      amount: req.body.amount || config.airtimeRewardAmount,
      currencyCode: req.body.currencyCode || config.airtimeCurrency,
      shipmentId: shipment.id,
      reason: 'test_airtime',
    });
    res.json({
      ok: true,
      credited: airtime.credited,
      phoneNumber: phone,
      amount: req.body.amount || config.airtimeRewardAmount,
      currency: config.airtimeCurrency,
      message: airtime.credited
        ? 'Check driver phone balance / AT sandbox. See /api/activity.'
        : 'Airtime failed — check AT backend .env and sandbox limits.',
      airtime,
    });
  } catch (err) {
    next(err);
  }
});

/** Test SMS + WhatsApp breakdown alerts to customer number (no USSD) */
router.post('/test-breakdown-alerts', async (req, res, next) => {
  try {
    const shipment = getShipment(req.body.shipmentId) || state.shipments[0];
    if (!shipment) {
      return res.status(400).json({
        error: 'No shipment. Run link-sandbox-pair first.',
      });
    }
    const loc = req.body.location || shipment.origin || 'Kibaha';
    await shipmentService.notifyBuyerBreakdown(shipment, loc);
    res.json({
      ok: true,
      message: 'Breakdown SMS + WhatsApp sent to buyer',
      buyerPhone: shipment.buyerPhone,
      shipmentId: shipment.id,
      checkActivity: 'GET /api/activity?product=whatsapp',
    });
  } catch (err) {
    next(err);
  }
});

function driverPhoneForDemo(override) {
  return (
    override ||
    process.env.SANDBOX_DRIVER_PHONE ||
    process.env.DEFAULT_RECIPIENT ||
    sampleTomatoShipment().driverPhone
  );
}

function buyerPhoneForDemo(override) {
  return (
    override ||
    process.env.SANDBOX_BUYER_PHONE ||
    process.env.DEFAULT_RECIPIENT ||
    sampleTomatoShipment().buyerPhone
  );
}

function buildSandboxPayload(body = {}) {
  const payload = sampleTomatoShipment();
  payload.driverPhone = driverPhoneForDemo(body.driverPhone || body.phoneNumber);
  payload.buyerPhone = buyerPhoneForDemo(body.buyerPhone || body.customerPhone);
  payload.driverName = body.driverName || 'Sandbox Driver';
  payload.buyerName = body.buyerName || 'Sandbox Customer';
  return payload;
}

async function linkSandboxPair(req, res, next) {
  try {
    const body = { ...req.body };
    body.driverPhone = body.driverPhone || body.phoneNumber;
    const payload = buildSandboxPayload(body);
    if (!payload.driverPhone || !payload.buyerPhone) {
      return res.status(400).json({
        error: 'driverPhone and buyerPhone required (or set SANDBOX_DRIVER_PHONE / SANDBOX_BUYER_PHONE in .env)',
      });
    }
    resetStore();
    const shipment = await shipmentService.createShipment(payload);
    res.json({
      ok: true,
      message: 'Sandbox pair linked. Driver dials USSD; customer receives breakdown alerts.',
      driverPhone: payload.driverPhone,
      buyerPhone: payload.buyerPhone,
      airtimeReward: `${process.env.AIRTIME_REWARD_AMOUNT || '500'} ${process.env.AIRTIME_CURRENCY || 'KES'}`,
      testFlow: {
        breakdown: 'Driver USSD → 3 (Report breakdown) → SMS to buyerPhone',
        complete: 'Driver USSD → 4 (Complete delivery) → airtime to driverPhone',
      },
      shipment,
      ussdServiceCode: process.env.AT_USSD_CODE || '*384*28480#',
    });
  } catch (err) {
    next(err);
  }
}

/** Link driver + customer sandbox numbers for AT simulator testing */
router.post('/link-sandbox-pair', linkSandboxPair);

/** Alias: pass phoneNumber as driver; optional buyerPhone */
router.post('/link-sandbox-phone', linkSandboxPair);

router.post('/load-winning-scenario', async (req, res, next) => {
  try {
    resetStore();
    const payload = sampleTomatoShipment();
    payload.driverPhone = driverPhoneForDemo(req.body?.phoneNumber);
    const shipment = await shipmentService.createShipment(payload);
    res.json({
      ok: true,
      message: 'Winning tomato scenario loaded',
      shipment,
      ussdHint: 'Dial USSD from the same phone as driverPhone',
      linkPhoneHint: 'POST /api/demo/link-sandbox-phone { "phoneNumber": "+2547..." }',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/load-fish-scenario', async (req, res, next) => {
  try {
    resetStore();
    const shipment = await shipmentService.createShipment(sampleFishShipment());
    res.json({ ok: true, message: 'Fish scenario loaded', shipment });
  } catch (err) {
    next(err);
  }
});

router.post('/simulate', async (req, res, next) => {
  try {
    const { action, shipmentId } = req.body;
    const shipment = getShipment(shipmentId) || state.shipments[0];
    if (!shipment) {
      return res.status(400).json({ error: 'No shipment. Load a scenario first.' });
    }

    switch (action) {
      case 'driver_delay': {
        await shipmentService.reportLateWithSpoilage(
          shipment,
          'vehicle_problem',
          'Kibaha'
        );
        break;
      }
      case 'critical_spoilage': {
        const past = new Date();
        past.setHours(past.getHours() - 3);
        shipment.expectedArrivalAt = past.toISOString();
        await shipmentService.reportLateWithSpoilage(
          shipment,
          'vehicle_problem',
          'Kibaha'
        );
        break;
      }
      case 'breakdown': {
        await shipmentService.reportBreakdown(shipment);
        break;
      }
      case 'complete_delivery': {
        await shipmentService.completeDelivery(shipment, shipment.driverPhone);
        break;
      }
      case 'check_in': {
        shipmentService.recordCheckIn(shipment);
        break;
      }
      default:
        return res.status(400).json({
          error: 'Unknown action',
          valid: [
            'driver_delay',
            'critical_spoilage',
            'breakdown',
            'complete_delivery',
            'check_in',
          ],
        });
    }

    res.json({ ok: true, action, shipment: getShipment(shipment.id) });
  } catch (err) {
    next(err);
  }
});

router.get('/spoilage-preview', (req, res) => {
  const result = calculateSpoilageRisk({
    cargoType: req.query.cargoType || 'tomatoes',
    cargoValue: Number(req.query.cargoValue) || 1200000,
    expectedArrivalAt: req.query.expectedArrivalAt || new Date().toISOString(),
    delayReason: req.query.delayReason || 'vehicle_problem',
    reportedLocation: req.query.location || 'Kibaha',
    destination: req.query.destination || 'Tandika',
  });
  res.json({ ok: true, result });
});

module.exports = router;
