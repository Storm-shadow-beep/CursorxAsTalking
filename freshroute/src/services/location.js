/** Sandbox location zones → minutes to Tandika Market (instructions/07) */

const ZONES = [
  { keys: ['kibaha'], name: 'Kibaha', minutes: 95 },
  { keys: ['mbezi'], name: 'Mbezi', minutes: 65 },
  { keys: ['kimara'], name: 'Kimara', minutes: 55 },
  { keys: ['ubungo'], name: 'Ubungo', minutes: 40 },
  { keys: ['kariakoo'], name: 'Kariakoo', minutes: 20 },
  { keys: ['tandika'], name: 'Tandika', minutes: 10 },
  { keys: ['morogoro road', 'morogoro rd', 'morogoro'], name: 'Morogoro Road', minutes: 75 },
];

const PICK_MENU = ZONES.map((z) => z.name);

function normalizeLocationInput(raw) {
  const text = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ');

  for (const zone of ZONES) {
    for (const key of zone.keys) {
      if (text.includes(key)) {
        return {
          recognized: true,
          name: zone.name,
          estimatedMinutesToDestination: zone.minutes,
          rawInput: raw,
        };
      }
    }
  }

  return { recognized: false, rawInput: raw, pickMenu: PICK_MENU };
}

function locationFromMenuChoice(choiceIndex) {
  const idx = Number(choiceIndex) - 1;
  if (idx < 0 || idx >= ZONES.length) return null;
  const zone = ZONES[idx];
  return {
    recognized: true,
    name: zone.name,
    estimatedMinutesToDestination: zone.minutes,
  };
}

module.exports = { ZONES, PICK_MENU, normalizeLocationInput, locationFromMenuChoice };
