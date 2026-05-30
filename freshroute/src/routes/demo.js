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

function driverPhoneForDemo(override) {
  return (
    override ||
    process.env.SANDBOX_DRIVER_PHONE ||
    process.env.DEFAULT_RECIPIENT ||
    sampleTomatoShipment().driverPhone
  );
}

/** Call this with the exact number you dial USSD from (sandbox / your SIM) */
router.post('/link-sandbox-phone', async (req, res, next) => {
  try {
    const phoneNumber = driverPhoneForDemo(req.body.phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber required' });
    }
    resetStore();
    const payload = sampleTomatoShipment();
    payload.driverPhone = phoneNumber;
    payload.driverName = req.body.driverName || 'Sandbox Driver';
    const shipment = await shipmentService.createShipment(payload);
    res.json({
      ok: true,
      message: 'Shipment linked to your sandbox phone. Dial *384*28480# now.',
      phoneNumber,
      shipment,
      ussdServiceCode: process.env.AT_USSD_CODE || '*384*28480#',
    });
  } catch (err) {
    next(err);
  }
});

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
