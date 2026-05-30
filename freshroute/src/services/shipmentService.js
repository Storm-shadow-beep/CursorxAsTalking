const at = require('./africaTalking');
const { calculateSpoilageRisk } = require('./spoilage');
const config = require('../config');
const {
  state,
  nextShipmentId,
  addEvent,
  getShipment,
  listShipments,
} = require('../store');

const SMS = {
  driverAssignment: (id, product, dest) =>
    `FreshRoute: You are assigned shipment ${id}: ${product} to ${dest}. Dial USSD to check in.`,
  buyerWatch: (id, product, loc, rate) =>
    `FreshRoute: ${product} shipment ${id} delayed near ${loc}. Estimated spoilage risk: ${rate}%. We are monitoring.`,
  buyerHigh: (id, product, loc, rate, reason) =>
    `FreshRoute Alert: ${product} shipment ${id} is HIGH RISK near ${loc}. Estimated spoilage: ${rate}%. Reason: ${reason}. Rescue in progress.`,
  buyerCritical: (id, product, loc, rate) =>
    `FreshRoute CRITICAL: ${product} shipment ${id} near ${loc}. Spoilage ${rate}%. Rescue broadcast started.`,
  buyerRescueAssigned: (id, product, backupName) =>
    `FreshRoute: Rescue assigned for ${id} (${product}). Backup driver: ${backupName}.`,
  airtimeThanks: (id) =>
    `FreshRoute: Thanks for completing shipment ${id} updates. Airtime reward sent.`,
  rescueBroadcast: (origin, product, dest) =>
    `FreshRoute Rescue: Backup needed near ${origin} for ${product} to ${dest}. Dial USSD to accept.`,
};

const VOICE_MSG = (id, product, reason, loc, rate) =>
  `FreshRoute alert. Shipment ${id} is high risk. ${product}. ${reason} near ${loc}. Estimated spoilage ${rate} percent. Assign rescue now.`;

async function createShipment(payload) {
  const id = nextShipmentId();
  const now = new Date().toISOString();
  const shipment = {
    id,
    productType: payload.productType,
    quantity: payload.quantity,
    cargoValue: Number(payload.cargoValue) || 0,
    origin: payload.origin,
    destination: payload.destination,
    buyerName: payload.buyerName,
    buyerPhone: payload.buyerPhone,
    driverName: payload.driverName,
    driverPhone: payload.driverPhone,
    expectedArrivalAt: payload.expectedArrivalAt,
    status: 'in_transit',
    risk: 'normal',
    riskLevel: 'normal',
    spoilageRate: 0,
    valueAtRisk: 0,
    spoilageBreakdown: null,
    delayReason: null,
    reportedLocation: null,
    normalizedLocation: null,
    backupDriverId: null,
    backupDriverName: null,
    backupDriverPhone: null,
    checkInCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  state.shipments.push(shipment);
  addEvent(id, 'created', `Shipment ${id} created`, null, { product: shipment.productType });

  await at.sendSms({
    to: shipment.driverPhone,
    message: SMS.driverAssignment(id, shipment.productType, shipment.destination),
    shipmentId: id,
    reason: 'driver_assignment',
  });
  addEvent(id, 'driver_notified', 'Driver SMS sent', shipment.driverPhone);

  return shipment;
}

async function applySpoilageAndAlerts(shipment, spoilageResult, delayReasonLabel) {
  const prevRisk = shipment.riskLevel;
  Object.assign(shipment, {
    spoilageRate: spoilageResult.spoilageRate,
    valueAtRisk: spoilageResult.valueAtRisk,
    risk: spoilageResult.riskLevel,
    riskLevel: spoilageResult.riskLevel,
    spoilageBreakdown: spoilageResult,
    normalizedLocation: spoilageResult.normalizedLocation,
    reportedLocation: spoilageResult.rawReportedLocation,
    updatedAt: new Date().toISOString(),
  });

  if (['watch', 'high', 'critical'].includes(spoilageResult.riskLevel)) {
    shipment.status = 'at_risk';
  }

  addEvent(
    shipment.id,
    'spoilage_calculated',
    `Spoilage ${spoilageResult.spoilageRate}% — ${spoilageResult.riskLevel}`,
    shipment.driverPhone,
    spoilageResult
  );

  const loc = spoilageResult.normalizedLocation || 'unknown';
  const rate = spoilageResult.spoilageRate;

  if (spoilageResult.riskLevel === 'watch') {
    await at.sendSms({
      to: shipment.buyerPhone,
      message: SMS.buyerWatch(shipment.id, shipment.productType, loc, rate),
      shipmentId: shipment.id,
      reason: 'buyer_watch',
    });
    addEvent(shipment.id, 'buyer_alerted', 'Buyer watch SMS', shipment.buyerPhone);
    await at.sendWhatsApp({
      to: shipment.buyerPhone,
      message: SMS.buyerWatch(shipment.id, shipment.productType, loc, rate),
      shipmentId: shipment.id,
      reason: 'buyer_watch_whatsapp',
    });
  }

  if (spoilageResult.riskLevel === 'high') {
    await at.sendSms({
      to: shipment.buyerPhone,
      message: SMS.buyerHigh(
        shipment.id,
        shipment.productType,
        loc,
        rate,
        delayReasonLabel
      ),
      shipmentId: shipment.id,
      reason: 'buyer_high',
    });
    addEvent(shipment.id, 'buyer_alerted', 'Buyer high-risk SMS', shipment.buyerPhone);
    await at.sendWhatsApp({
      to: shipment.buyerPhone,
      message: SMS.buyerHigh(
        shipment.id,
        shipment.productType,
        loc,
        rate,
        delayReasonLabel
      ),
      shipmentId: shipment.id,
      reason: 'buyer_high_whatsapp',
    });
    await at.startVoiceCall({
      callTo: config.dispatcherPhone,
      shipmentId: shipment.id,
      reason: 'dispatcher_escalation',
      message: VOICE_MSG(
        shipment.id,
        shipment.productType,
        delayReasonLabel,
        loc,
        rate
      ),
    });
    addEvent(shipment.id, 'voice_escalation', 'Voice escalation to dispatcher');
  }

  if (spoilageResult.riskLevel === 'critical') {
    await at.sendSms({
      to: shipment.buyerPhone,
      message: SMS.buyerCritical(shipment.id, shipment.productType, loc, rate),
      shipmentId: shipment.id,
      reason: 'buyer_critical',
    });
    addEvent(shipment.id, 'buyer_alerted', 'Buyer critical SMS', shipment.buyerPhone);
    await at.sendWhatsApp({
      to: shipment.buyerPhone,
      message: SMS.buyerCritical(shipment.id, shipment.productType, loc, rate),
      shipmentId: shipment.id,
      reason: 'buyer_critical_whatsapp',
    });
    await at.startVoiceCall({
      callTo: config.dispatcherPhone,
      shipmentId: shipment.id,
      reason: 'dispatcher_critical',
      message: VOICE_MSG(
        shipment.id,
        shipment.productType,
        delayReasonLabel,
        loc,
        rate
      ),
    });
    addEvent(shipment.id, 'voice_escalation', 'Critical voice escalation');
    const { broadcastRescue } = require('./rescueService');
    await broadcastRescue(shipment.id, { auto: true });
  }

  return { shipment, prevRisk };
}

async function reportLateWithSpoilage(shipment, delayReason, reportedLocation) {
  shipment.delayReason = delayReason;
  const spoilageResult = calculateSpoilageRisk({
    cargoType: shipment.productType,
    cargoValue: shipment.cargoValue,
    expectedArrivalAt: shipment.expectedArrivalAt,
    delayReason,
    reportedLocation,
    destination: shipment.destination,
  });

  addEvent(
    shipment.id,
    'delay',
    `Late: ${spoilageResult.delayReasonLabel} at ${reportedLocation}`,
    shipment.driverPhone,
    { delayReason, reportedLocation }
  );

  return applySpoilageAndAlerts(
    shipment,
    spoilageResult,
    spoilageResult.delayReasonLabel
  );
}

async function reportBreakdown(shipment) {
  return reportLateWithSpoilage(shipment, 'breakdown', shipment.normalizedLocation || 'Kibaha');
}

async function completeDelivery(shipment, driverPhone) {
  shipment.status = 'delivered';
  shipment.risk = 'normal';
  shipment.riskLevel = 'normal';
  shipment.updatedAt = new Date().toISOString();
  addEvent(shipment.id, 'delivered', 'Delivery completed', driverPhone);

  if (shipment.checkInCount > 0) {
    await at.sendAirtime({
      phoneNumber: driverPhone,
      amount: config.airtimeRewardAmount,
      currencyCode: config.airtimeCurrency,
      shipmentId: shipment.id,
      reason: 'delivery_reward',
    });
    await at.sendSms({
      to: driverPhone,
      message: SMS.airtimeThanks(shipment.id),
      shipmentId: shipment.id,
      reason: 'reward_confirmation',
    });
    addEvent(shipment.id, 'airtime_reward', 'Airtime reward queued', driverPhone);
  }

  return shipment;
}

function recordCheckIn(shipment) {
  shipment.checkInCount = (shipment.checkInCount || 0) + 1;
  shipment.updatedAt = new Date().toISOString();
  addEvent(shipment.id, 'check_in', 'Driver checked in', shipment.driverPhone);
  return shipment;
}

module.exports = {
  createShipment,
  applySpoilageAndAlerts,
  reportLateWithSpoilage,
  reportBreakdown,
  completeDelivery,
  recordCheckIn,
  getShipment,
  listShipments,
  SMS,
};
