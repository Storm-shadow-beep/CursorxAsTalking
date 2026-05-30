const path = require('path');
const dotenv = require('dotenv');

// .env then .env.local (local overrides) — matches common Next.js-style setup
const root = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

module.exports = {
  port: Number(process.env.FRESHROUTE_PORT) || 3001,
  atBackendUrl: (process.env.AT_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  mockAt: process.env.AFRICASTALKING_MOCK === 'true',
  dispatcherPhone: process.env.DISPATCHER_PHONE || '+254700000000',
  sandboxDriverPhone: process.env.SANDBOX_DRIVER_PHONE || '',
  sandboxBuyerPhone: process.env.SANDBOX_BUYER_PHONE || '',
  airtimeRewardAmount: String(process.env.AIRTIME_REWARD_AMOUNT || '500'),
  airtimeCurrency: process.env.AIRTIME_CURRENCY || 'KES',
  /** Set AIRTIME_REQUIRES_CHECKIN=true to require USSD check-in before airtime */
  airtimeRequiresCheckin: process.env.AIRTIME_REQUIRES_CHECKIN === 'true',
  whatsappSender: process.env.AT_WHATSAPP_SENDER || '',
  whatsappEnabled: process.env.WHATSAPP_ENABLED !== 'false',
};
