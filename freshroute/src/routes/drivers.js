const express = require('express');
const { state } = require('../store');
const rescueService = require('../services/rescueService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true, drivers: state.drivers });
});

router.get('/available-backups', (req, res) => {
  const exclude = req.query.excludePhone;
  res.json({
    ok: true,
    drivers: rescueService.availableBackupDrivers(exclude),
  });
});

module.exports = router;
