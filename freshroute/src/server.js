const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const config = require('./config');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'FreshRoute Rescue API',
    port: config.port,
    atBackendUrl: config.atBackendUrl,
    mockAt: config.mockAt,
    time: new Date().toISOString(),
  });
});

app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/ussd', require('./routes/ussd'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/rescue', require('./routes/rescue'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/demo', require('./routes/demo'));

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`FreshRoute API http://localhost:${config.port}`);
    console.log(`AT backend expected at ${config.atBackendUrl}`);
    console.log('USSD callback: POST /api/ussd');
  });
}

module.exports = app;
