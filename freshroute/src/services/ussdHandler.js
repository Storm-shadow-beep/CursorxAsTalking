const at = require('./africaTalking');
const {
  getActiveShipmentForDriver,
  getOpenRescueOfferForDriver,
  state,
} = require('../store');
const { normalizeLocationInput, locationFromMenuChoice, PICK_MENU } = require('./location');
const shipmentService = require('./shipmentService');
const rescueService = require('./rescueService');

const REASON_MAP = {
  1: 'traffic',
  2: 'vehicle_problem',
  3: 'police_roadblock',
  4: 'loading_delay',
  5: 'weather_road',
  6: 'other',
};

function steps(text) {
  if (!text || String(text).trim() === '') return [];
  return String(text).split('*');
}

function getSession(sessionId) {
  if (!state.ussdSessions.has(sessionId)) {
    state.ussdSessions.set(sessionId, { flow: null, data: {} });
  }
  return state.ussdSessions.get(sessionId);
}

function mainMenu() {
  return `CON FreshRoute Rescue
1. Check in
2. Report late delivery
3. Report breakdown
4. Complete delivery`;
}

function lateReasonMenu() {
  return `CON Why are you late?
1. Traffic
2. Vehicle problem
3. Police/roadblock
4. Loading delay
5. Weather/road condition
6. Other`;
}

function locationPrompt() {
  return 'CON Enter your current location or nearest landmark:';
}

function locationPickMenu() {
  const lines = PICK_MENU.map((name, i) => `${i + 1}. ${name}`).join('\n');
  return `CON Location not recognized. Choose nearest area:\n${lines}`;
}

function rescueOfferMenu(shipment) {
  const loc = shipment.normalizedLocation || shipment.origin;
  return `CON FreshRoute Rescue Offer
${shipment.productType} shipment near ${loc} to ${shipment.destination.split(',')[0] || shipment.destination}
1. Accept rescue
2. Decline`;
}

async function handleUssd({ sessionId, phoneNumber, text }) {
  at.recordUssdInbound({
    phoneNumber,
    sessionId,
    text,
    summary: `USSD input: ${text || '(empty)'}`,
  });

  const s = steps(text);
  const session = getSession(sessionId);

  const pendingOffer = rescueService.findPendingOfferForPhone(phoneNumber);
  if (pendingOffer && (s.length === 0 || session.flow === 'rescue_offer')) {
    session.flow = 'rescue_offer';
    session.data.offerId = pendingOffer.id;

    if (s.length === 0) {
      const shipment = shipmentService.getShipment(pendingOffer.shipmentId);
      return rescueOfferMenu(shipment);
    }

    if (s[0] === '1') {
      try {
        const { shipment, driver, handoff } = await rescueService.acceptRescue(
          pendingOffer.id,
          phoneNumber
        );
        session.flow = null;
        return `END Rescue accepted. Proceed to ${handoff} handoff point. Buyer and dispatcher notified.`;
      } catch (e) {
        return `END Error: ${e.message}`;
      }
    }
    if (s[0] === '2') {
      rescueService.declineRescue(pendingOffer.id, phoneNumber);
      session.flow = null;
      return 'END Rescue declined. Thank you.';
    }
    const shipment = shipmentService.getShipment(pendingOffer.shipmentId);
    return rescueOfferMenu(shipment);
  }

  const shipment = getActiveShipmentForDriver(phoneNumber);

  if (s.length === 0) {
    if (!shipment) {
      return `END No shipment for ${phoneNumber}. Ask coordinator to link your line, or POST /api/demo/link-sandbox-phone with your number.`;
    }
    session.flow = 'main';
    return mainMenu();
  }

  if (!shipment) {
    return 'END No active shipment found.';
  }

  const choice = s[0];

  if (choice === '1') {
    shipmentService.recordCheckIn(shipment);
    session.flow = null;
    return `END Checked in for ${shipment.id}. Stay safe.`;
  }

  if (choice === '3') {
    await shipmentService.reportBreakdown(shipment);
    session.flow = null;
    return 'END Breakdown logged. Dispatcher and buyer will be alerted.';
  }

  if (choice === '4') {
    await shipmentService.completeDelivery(shipment, phoneNumber);
    session.flow = null;
    return 'END Delivery completed. Thank you. Airtime reward queued.';
  }

  if (choice === '2') {
    if (s.length === 1) {
      session.flow = 'late_reason';
      return lateReasonMenu();
    }

    if (s.length === 2) {
      const reasonKey = REASON_MAP[Number(s[1])];
      if (!reasonKey) return 'END Invalid reason.';
      session.flow = 'late_location';
      session.data.delayReason = reasonKey;
      return locationPrompt();
    }

    if (s.length === 3) {
      const rawLoc = s[2];
      const loc = normalizeLocationInput(rawLoc);
      if (!loc.recognized) {
        session.flow = 'late_location_pick';
        session.data.pendingLocation = rawLoc;
        return locationPickMenu();
      }
      await shipmentService.reportLateWithSpoilage(
        shipment,
        session.data.delayReason,
        rawLoc
      );
      session.flow = null;
      return `END Delay logged. Spoilage risk: ${shipment.spoilageRate}%. Buyer alerted if needed.`;
    }

    if (s.length === 4 && session.flow === 'late_location_pick') {
      const picked = locationFromMenuChoice(s[3]);
      if (!picked) return 'END Invalid location choice.';
      await shipmentService.reportLateWithSpoilage(
        shipment,
        session.data.delayReason,
        picked.name
      );
      session.flow = null;
      return `END Delay logged. Spoilage risk: ${shipment.spoilageRate}%. Buyer alerted if needed.`;
    }

    return locationPrompt();
  }

  return mainMenu();
}

module.exports = { handleUssd };
