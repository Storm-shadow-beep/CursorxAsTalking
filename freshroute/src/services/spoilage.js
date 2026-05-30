const { normalizeLocationInput } = require('./location');

const BASE_SPOILAGE_PER_HOUR = {
  fish: 12,
  milk: 10,
  'leafy vegetables': 8,
  lettuce: 8,
  spinach: 8,
  tomatoes: 5,
  tomato: 5,
  bananas: 4,
  banana: 4,
  grains: 1,
  rice: 1,
  maize: 1,
};

const REASON_MULTIPLIERS = {
  traffic: 1.1,
  vehicle_problem: 1.5,
  police_roadblock: 1.2,
  loading_delay: 1.0,
  weather_road: 1.4,
  other: 1.2,
  breakdown: 1.5,
};

const DELAY_REASON_LABELS = {
  traffic: 'Traffic',
  vehicle_problem: 'Vehicle problem',
  police_roadblock: 'Police/roadblock',
  loading_delay: 'Loading delay',
  weather_road: 'Weather/road condition',
  other: 'Other',
  breakdown: 'Breakdown',
};

function baseRateForCargo(cargoType) {
  const key = String(cargoType || '').toLowerCase().trim();
  return BASE_SPOILAGE_PER_HOUR[key] ?? 3;
}

function getRiskLevel(spoilageRate) {
  if (spoilageRate <= 15) return 'normal';
  if (spoilageRate <= 35) return 'watch';
  if (spoilageRate <= 60) return 'high';
  return 'critical';
}

function getRecommendedAction(riskLevel) {
  const map = {
    normal: 'Monitor only',
    watch: 'Alert buyer',
    high: 'Call dispatcher',
    critical: 'Broadcast rescue',
  };
  return map[riskLevel] || 'Monitor only';
}

function calculateSpoilageRisk(input) {
  const {
    cargoType,
    cargoValue,
    expectedArrivalAt,
    currentTime = new Date(),
    delayReason,
    reportedLocation,
    destination,
  } = input;

  const location = normalizeLocationInput(reportedLocation);
  const estimatedMinutes =
    location.recognized ? location.estimatedMinutesToDestination : 60;

  const baseRate = baseRateForCargo(cargoType);
  const multiplier = REASON_MULTIPLIERS[delayReason] ?? 1.2;

  const expected = new Date(expectedArrivalAt);
  const now = new Date(currentTime);
  const hoursLate = Math.max(0, (now - expected) / (1000 * 60 * 60));
  const remainingHours = estimatedMinutes / 60;
  const exposureHours = hoursLate + remainingHours;

  const rawRate = baseRate * exposureHours * multiplier;
  const spoilageRate = Math.min(95, Math.max(0, Math.round(rawRate * 10) / 10));
  const valueAtRisk = Math.round((cargoValue || 0) * (spoilageRate / 100));
  const riskLevel = getRiskLevel(spoilageRate);

  return {
    normalizedLocation: location.recognized ? location.name : reportedLocation,
    locationRecognized: location.recognized,
    rawReportedLocation: reportedLocation,
    estimatedMinutesToDestination: estimatedMinutes,
    destination,
    hoursLate: Math.round(hoursLate * 100) / 100,
    exposureHours: Math.round(exposureHours * 100) / 100,
    baseSpoilagePerHour: baseRate,
    reasonMultiplier: multiplier,
    delayReason,
    delayReasonLabel: DELAY_REASON_LABELS[delayReason] || delayReason,
    spoilageRate,
    valueAtRisk,
    riskLevel,
    risk: riskLevel,
    recommendedAction: getRecommendedAction(riskLevel),
    explanation: `Base ${baseRate}%/hr × ${exposureHours.toFixed(2)}h exposure × ${multiplier} (${DELAY_REASON_LABELS[delayReason] || delayReason})`,
  };
}

module.exports = {
  calculateSpoilageRisk,
  getRiskLevel,
  getRecommendedAction,
  DELAY_REASON_LABELS,
  REASON_MULTIPLIERS,
};
