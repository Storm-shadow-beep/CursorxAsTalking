const { v4: uuidv4 } = require('uuid');
const { DRIVERS, BUYERS } = require('./data/seed');

let shipmentSeq = 100;
let eventSeq = 0;
let activitySeq = 0;
let offerSeq = 0;

const state = {
  drivers: [...DRIVERS],
  buyers: [...BUYERS],
  shipments: [],
  events: [],
  apiActivity: [],
  rescueOffers: [],
  ussdSessions: new Map(),
};

function nextShipmentId() {
  shipmentSeq += 1;
  return `FR-${shipmentSeq}`;
}

function nextId(prefix) {
  return `${prefix}-${uuidv4().slice(0, 8)}`;
}

function resetStore() {
  shipmentSeq = 100;
  eventSeq = 0;
  activitySeq = 0;
  offerSeq = 0;
  state.drivers = DRIVERS.map((d) => ({ ...d, available: true }));
  state.buyers = [...BUYERS];
  state.shipments = [];
  state.events = [];
  state.apiActivity = [];
  state.rescueOffers = [];
  state.ussdSessions.clear();
}

function addEvent(shipmentId, type, message, actorPhone = null, meta = {}) {
  eventSeq += 1;
  const ev = {
    id: `evt-${eventSeq}`,
    shipmentId,
    actorPhone,
    type,
    message,
    meta,
    createdAt: new Date().toISOString(),
  };
  state.events.push(ev);
  return ev;
}

function addApiActivity(record) {
  activitySeq += 1;
  const row = {
    id: `at-${activitySeq}`,
    createdAt: new Date().toISOString(),
    ...record,
  };
  state.apiActivity.unshift(row);
  if (state.apiActivity.length > 200) state.apiActivity.pop();
  return row;
}

function getShipment(id) {
  return state.shipments.find((s) => s.id === id);
}

function getActiveShipmentForDriver(phone) {
  return state.shipments.find(
    (s) =>
      phonesMatch(s.driverPhone, phone) && !['delivered'].includes(s.status)
  );
}

function getOpenRescueOfferForDriver(phone) {
  const offer = state.rescueOffers.find((o) => {
    if (o.status !== 'sent') return false;
    const d = state.drivers.find((dr) => dr.id === o.driverId);
    return d && phonesMatch(d.phone, phone);
  });
  if (!offer) return null;
  return { offer, shipment: getShipment(offer.shipmentId) };
}

function normalizePhone(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/\s/g, '').trim();
  if (p.startsWith('0') && p.length >= 9) {
    p = `+254${p.slice(1)}`;
  }
  return p;
}

/** Match sandbox numbers even if AT sends +254… and seed uses +255… */
function phonesMatch(a, b) {
  const da = String(a || '').replace(/\D/g, '');
  const db = String(b || '').replace(/\D/g, '');
  if (!da || !db) return false;
  if (da === db) return true;
  return da.slice(-9) === db.slice(-9);
}

function listShipments() {
  return state.shipments.map((s) => ({
    ...s,
    events: state.events
      .filter((e) => e.shipmentId === s.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  }));
}

function getMetrics() {
  const shipments = state.shipments;
  return {
    shipmentsMonitored: shipments.filter((s) => s.status !== 'delivered').length,
    highRiskAlerts: shipments.filter((s) =>
      ['high', 'critical'].includes(s.riskLevel || s.risk)
    ).length,
    rescuesAssigned: shipments.filter((s) => s.status === 'rescue_assigned').length,
    cargoValueProtected: shipments
      .filter((s) => s.status === 'rescue_assigned' || s.status === 'delivered')
      .reduce((sum, s) => sum + (s.cargoValue || 0), 0),
  };
}

module.exports = {
  state,
  nextShipmentId,
  nextId,
  resetStore,
  addEvent,
  addApiActivity,
  getShipment,
  getActiveShipmentForDriver,
  getOpenRescueOfferForDriver,
  normalizePhone,
  phonesMatch,
  listShipments,
  getMetrics,
};
