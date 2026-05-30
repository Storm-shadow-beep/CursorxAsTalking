const express = require('express');
const rescueService = require('../services/rescueService');
const { state } = require('../store');

const router = express.Router();

router.post('/broadcast/:shipmentId', async (req, res, next) => {
  try {
    const result = await rescueService.broadcastRescue(req.params.shipmentId);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.message === 'Shipment not found') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/offers', (req, res) => {
  const { shipmentId } = req.query;
  let offers = state.rescueOffers;
  if (shipmentId) offers = offers.filter((o) => o.shipmentId === shipmentId);
  res.json({ ok: true, offers });
});

module.exports = router;
