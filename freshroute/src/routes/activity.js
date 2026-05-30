const express = require('express');
const { state } = require('../store');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const { shipmentId, product } = req.query;
  let rows = state.apiActivity;
  if (shipmentId) rows = rows.filter((r) => r.shipmentId === shipmentId);
  if (product) rows = rows.filter((r) => r.product === product);
  res.json({
    ok: true,
    mockMode: config.mockAt,
    atBackendUrl: config.atBackendUrl,
    count: rows.length,
    activity: rows,
  });
});

module.exports = router;
