/** Demo seed data from instructions/06-execution-plan-overview.md */

const DRIVERS = [
  {
    id: 'drv-1',
    name: 'Amani Mwita',
    phone: '+255712000001',
    zone: 'Kibaha',
    vehicleType: 'pickup',
    available: true,
    reliabilityScore: 92,
    completedRescues: 3,
  },
  {
    id: 'drv-2',
    name: 'Neema Joseph',
    phone: '+255712000002',
    zone: 'Kariakoo',
    vehicleType: 'boda',
    available: true,
    reliabilityScore: 88,
    completedRescues: 5,
  },
  {
    id: 'drv-3',
    name: 'Baraka Said',
    phone: '+255712000003',
    zone: 'Morogoro Road',
    vehicleType: 'pickup',
    available: true,
    reliabilityScore: 85,
    completedRescues: 2,
  },
  {
    id: 'drv-4',
    name: 'Fatuma Hassan',
    phone: '+255712000004',
    zone: 'Mbezi',
    vehicleType: 'boda',
    available: true,
    reliabilityScore: 90,
    completedRescues: 4,
  },
];

const BUYERS = [
  {
    id: 'buy-1',
    name: 'Tandika Market Buyer',
    phone: '+255712000010',
  },
  {
    id: 'buy-2',
    name: 'Kariakoo Wholesale',
    phone: '+255712000011',
  },
];

function sampleTomatoShipment() {
  const now = new Date();
  const arrival = new Date(now);
  arrival.setHours(14, 0, 0, 0);
  if (arrival < now) arrival.setDate(arrival.getDate() + 1);

  return {
    productType: 'tomatoes',
    quantity: '45 crates',
    cargoValue: 1200000,
    origin: 'Kibaha collection point',
    destination: 'Tandika market, Dar es Salaam',
    buyerName: BUYERS[0].name,
    buyerPhone: BUYERS[0].phone,
    driverName: DRIVERS[0].name,
    driverPhone: DRIVERS[0].phone,
    expectedArrivalAt: arrival.toISOString(),
  };
}

function sampleFishShipment() {
  const now = new Date();
  const arrival = new Date(now);
  arrival.setHours(13, 0, 0, 0);
  if (arrival < now) arrival.setDate(arrival.getDate() + 1);

  return {
    productType: 'fish',
    quantity: '120 kg',
    cargoValue: 2400000,
    origin: 'Kibaha fish landing',
    destination: 'Tandika market, Dar es Salaam',
    buyerName: BUYERS[0].name,
    buyerPhone: BUYERS[0].phone,
    driverName: DRIVERS[0].name,
    driverPhone: DRIVERS[0].phone,
    expectedArrivalAt: arrival.toISOString(),
  };
}

module.exports = { DRIVERS, BUYERS, sampleTomatoShipment, sampleFishShipment };
