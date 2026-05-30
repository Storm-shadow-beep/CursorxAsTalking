const at = require('./africaTalking');
const shipmentService = require('./shipmentService');
const { state, addEvent, getShipment, phonesMatch } = require('../store');

let offerSeq = 0;

function availableBackupDrivers(excludePhone) {
  return state.drivers.filter(
    (d) => d.available && !phonesMatch(d.phone, excludePhone)
  );
}

async function broadcastRescue(shipmentId, options = {}) {
  const shipment = getShipment(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  const backups = availableBackupDrivers(shipment.driverPhone).slice(0, 5);
  if (backups.length === 0) {
    throw new Error('No backup drivers available');
  }

  const offers = [];
  for (const driver of backups) {
    offerSeq += 1;
    const offer = {
      id: `offer-${offerSeq}`,
      shipmentId,
      driverId: driver.id,
      status: 'sent',
      sentAt: new Date().toISOString(),
      respondedAt: null,
    };
    state.rescueOffers.push(offer);
    offers.push(offer);
  }

  const message = shipmentService.SMS.rescueBroadcast(
    shipment.origin,
    shipment.productType,
    shipment.destination
  );

  await at.sendBulkSms({
    recipients: backups.map((d) => d.phone),
    message,
    shipmentId,
    reason: options.auto ? 'auto_rescue_broadcast' : 'manual_rescue_broadcast',
  });

  addEvent(
    shipmentId,
    'rescue_broadcast',
    `Rescue broadcast to ${backups.length} drivers`,
    null,
    { drivers: backups.map((d) => d.name) }
  );

  return { shipment, offers, driversContacted: backups };
}

async function acceptRescue(offerId, driverPhone) {
  const offer = state.rescueOffers.find((o) => o.id === offerId && o.status === 'sent');
  if (!offer) throw new Error('Rescue offer not found or expired');

  const driver = state.drivers.find((d) => d.id === offer.driverId);
  if (!driver || !phonesMatch(driver.phone, driverPhone)) {
    throw new Error('Offer does not belong to this driver');
  }

  const shipment = getShipment(offer.shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  offer.status = 'accepted';
  offer.respondedAt = new Date().toISOString();

  state.rescueOffers
    .filter((o) => o.shipmentId === shipment.id && o.id !== offer.id && o.status === 'sent')
    .forEach((o) => {
      o.status = 'expired';
      o.respondedAt = new Date().toISOString();
    });

  shipment.status = 'rescue_assigned';
  shipment.backupDriverId = driver.id;
  shipment.backupDriverName = driver.name;
  shipment.backupDriverPhone = driver.phone;
  shipment.updatedAt = new Date().toISOString();

  const handoff = shipment.normalizedLocation || shipment.origin;

  addEvent(
    shipment.id,
    'rescue_assigned',
    `Backup driver ${driver.name} assigned`,
    driver.phone,
    { backupDriverId: driver.id }
  );

  await at.sendSms({
    to: shipment.buyerPhone,
    message: shipmentService.SMS.buyerRescueAssigned(
      shipment.id,
      shipment.productType,
      driver.name
    ),
    shipmentId: shipment.id,
    reason: 'buyer_rescue_assigned',
  });

  await at.sendWhatsApp({
    to: shipment.buyerPhone,
    message: shipmentService.SMS.buyerRescueAssigned(
      shipment.id,
      shipment.productType,
      driver.name
    ),
    shipmentId: shipment.id,
    reason: 'buyer_rescue_whatsapp',
  });

  driver.completedRescues = (driver.completedRescues || 0) + 1;

  return { shipment, driver, handoff };
}

function declineRescue(offerId, driverPhone) {
  const offer = state.rescueOffers.find((o) => o.id === offerId && o.status === 'sent');
  if (!offer) throw new Error('Rescue offer not found');

  const driver = state.drivers.find((d) => d.id === offer.driverId);
  if (!driver || !phonesMatch(driver.phone, driverPhone)) {
    throw new Error('Offer does not belong to this driver');
  }

  offer.status = 'declined';
  offer.respondedAt = new Date().toISOString();
  return offer;
}

function findPendingOfferForPhone(phone) {
  return state.rescueOffers.find((o) => {
    if (o.status !== 'sent') return false;
    const d = state.drivers.find((dr) => dr.id === o.driverId);
    return d && phonesMatch(d.phone, phone);
  });
}

module.exports = {
  availableBackupDrivers,
  broadcastRescue,
  acceptRescue,
  declineRescue,
  findPendingOfferForPhone,
};
