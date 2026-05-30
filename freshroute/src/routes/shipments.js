const express = require('express');
const shipmentService = require('../services/shipmentService');
const { getShipment, listShipments, getMetrics } = require('../store');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const required = [
      'productType',
      'origin',
      'destination',
      'buyerPhone',
      'driverPhone',
      'expectedArrivalAt',
    ];
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }
    const shipment = await shipmentService.createShipment(req.body);
    res.status(201).json({ ok: true, shipment });
  } catch (err) {
    next(err);
  }
});

router.get('/', (req, res) => {
  res.json({
    ok: true,
    metrics: getMetrics(),
    shipments: listShipments(),
  });
});

router.get('/:id', (req, res) => {
  const shipment = getShipment(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  const full = listShipments().find((s) => s.id === shipment.id);
  res.json({ ok: true, shipment: full || shipment });
});

/** Manual backup assignment (coordinator / dashboard) */
router.post('/:id/assign-backup', async (req, res, next) => {
  try {
    const { state, addEvent } = require('../store');
    const at = require('../services/africaTalking');
    const shipment = getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const driver = state.drivers.find((d) => d.id === req.body.driverId);
    if (!driver) return res.status(400).json({ error: 'driverId not found' });

    shipment.status = 'rescue_assigned';
    shipment.backupDriverId = driver.id;
    shipment.backupDriverName = driver.name;
    shipment.backupDriverPhone = driver.phone;
    shipment.updatedAt = new Date().toISOString();

    addEvent(
      shipment.id,
      'rescue_assigned',
      `Manual backup: ${driver.name}`,
      driver.phone
    );

    const msg = shipmentService.SMS.buyerRescueAssigned(
      shipment.id,
      shipment.productType,
      driver.name
    );
    await at.sendSms({
      to: shipment.buyerPhone,
      message: msg,
      shipmentId: shipment.id,
      reason: 'manual_rescue_assigned',
    });
    await at.sendWhatsApp({
      to: shipment.buyerPhone,
      message: msg,
      shipmentId: shipment.id,
      reason: 'manual_rescue_whatsapp',
    });

    res.json({ ok: true, shipment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
