require('dotenv').config();

module.exports = {
  port: Number(process.env.FRESHROUTE_PORT) || 3001,
  atBackendUrl: (process.env.AT_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  mockAt: process.env.AFRICASTALKING_MOCK === 'true',
  dispatcherPhone: process.env.DISPATCHER_PHONE || '+254700000000',
  airtimeRewardAmount: process.env.AIRTIME_REWARD_AMOUNT || '10',
  airtimeCurrency: process.env.AIRTIME_CURRENCY || 'KES',
};
