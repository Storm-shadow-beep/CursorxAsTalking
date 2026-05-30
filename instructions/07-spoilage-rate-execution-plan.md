# FreshRoute Rescue: Spoilage-Rate Execution Plan

## Core Upgrade

After the driver selects a late-delivery reason in the USSD menu, the system asks for the driver's current location. FreshRoute then estimates spoilage risk using:

- cargo type,
- expected arrival time,
- late-delivery reason,
- driver's current location,
- distance/time from location to destination,
- product sensitivity.

The result is a simple, explainable spoilage rate such as `12%`, `38%`, or `71%`, plus a risk level: `Normal`, `Watch`, `High`, or `Critical`.

## Important Demo Rule

Do not overclaim real GPS tracking. In the sandbox, the driver's location should be entered manually through USSD as a zone, town, road, or landmark.

Example:

```text
Enter your current location:
```

Driver enters:

```text
Kibaha
```

The system maps `Kibaha` to a known demo zone and estimates travel time to the destination.

---

# Phase 1: Shipment Setup

## Goal

Create the shipment data needed to calculate spoilage later.

## Build Steps

1. Create shipment form.
2. Capture cargo type.
3. Capture quantity/value.
4. Capture origin.
5. Capture destination.
6. Capture expected arrival time.
7. Assign driver phone number.
8. Save shipment status as `in_transit`.
9. Send driver SMS through Africa's Talking.

## Required Fields

| Field | Example | Why It Matters |
|---|---|---|
| Cargo type | Tomatoes | Determines spoilage sensitivity. |
| Quantity | 45 crates | Used for value-at-risk estimate. |
| Cargo value | TZS 1,200,000 | Shows business impact. |
| Origin | Kibaha | Used for shipment story. |
| Destination | Tandika Market | Used for remaining-distance estimate. |
| Expected arrival | 14:00 | Used to calculate delay duration. |
| Driver phone | Sandbox number | Links USSD session to shipment. |

## Product Sensitivity Table

| Cargo Type | Sensitivity | Base Spoilage Per Hour Late |
|---|---:|---:|
| Fish | Very high | 12% |
| Milk | Very high | 10% |
| Leafy vegetables | High | 8% |
| Tomatoes | Medium | 5% |
| Bananas | Medium | 4% |
| Grains | Low | 1% |

## Acceptance Criteria

- A coordinator can create a shipment in under 60 seconds.
- Shipment appears in dashboard.
- Driver receives/logs assignment SMS.
- Product sensitivity is stored with the shipment.

---

# Phase 2: USSD Late-Delivery Flow

## Goal

Capture delay reason and driver location through USSD.

## USSD Flow

### Main Menu

```text
CON FreshRoute Rescue
1. Check in
2. Report late delivery
3. Report breakdown
4. Complete delivery
```

### Late Delivery Reason Menu

If driver selects `2. Report late delivery`:

```text
CON Why are you late?
1. Traffic
2. Vehicle problem
3. Police/roadblock
4. Loading delay
5. Weather/road condition
6. Other
```

### Location Entry Menu

After reason selection:

```text
CON Enter your current location or nearest landmark:
```

Examples:

- `Kibaha`
- `Mbezi`
- `Morogoro Road`
- `Ubungo`
- `Kimara`

### Confirmation Response

```text
END Delay logged. Spoilage risk is being calculated. Buyer and dispatcher will be alerted if needed.
```

## Build Steps

1. Add USSD session parser.
2. Detect driver phone number.
3. Find active shipment for driver.
4. Store selected reason.
5. Ask for location after reason.
6. Normalize typed location.
7. Calculate spoilage rate.
8. Update shipment risk.
9. Trigger alerts if risk is high.

## Acceptance Criteria

- Driver cannot report late delivery without entering location.
- Delay reason and location appear in event timeline.
- Spoilage rate is calculated immediately after location entry.
- USSD response stays short and feature-phone friendly.

---

# Phase 3: Location Normalization

## Goal

Turn messy driver-entered text into a usable demo location.

## Sandbox Approach

Use a predefined location table instead of real geocoding.

| Input Match | Normalized Location | Estimated Minutes to Tandika Market |
|---|---|---:|
| Kibaha | Kibaha | 95 |
| Mbezi | Mbezi | 65 |
| Kimara | Kimara | 55 |
| Ubungo | Ubungo | 40 |
| Kariakoo | Kariakoo | 20 |
| Tandika | Tandika | 10 |
| Morogoro Road | Morogoro Road | 75 |

## Unknown Location Handling

If the typed location is unknown:

```text
CON Location not recognized. Choose nearest area:
1. Kibaha
2. Mbezi
3. Ubungo
4. Kariakoo
5. Tandika
```

## Build Steps

1. Create `locationZones` table or constant.
2. Lowercase and trim driver input.
3. Match aliases.
4. Return normalized location and estimated minutes to destination.
5. If no match, ask driver to choose from options.

## Acceptance Criteria

- Common misspellings or aliases can be handled.
- Unknown location does not break USSD flow.
- Dashboard shows both raw and normalized location.

---

# Phase 4: Spoilage-Rate Engine

## Goal

Calculate a believable, explainable spoilage rate.

## Inputs

| Input | Source |
|---|---|
| Cargo type | Shipment form |
| Expected arrival time | Shipment form |
| Current time | System |
| Delay reason | USSD |
| Current location | USSD |
| Estimated minutes to destination | Location table |
| Cargo value | Shipment form |

## Delay Reason Multipliers

| Reason | Multiplier | Why |
|---|---:|---|
| Traffic | 1.1 | Usually moving slowly, not fully stopped. |
| Vehicle problem | 1.5 | High uncertainty and possible long stop. |
| Police/roadblock | 1.2 | Delay may clear, but timing uncertain. |
| Loading delay | 1.0 | Cargo may not yet be exposed long. |
| Weather/road condition | 1.4 | Can worsen and affect travel time. |
| Other | 1.2 | Unknown risk. |

## Risk Formula

Use an explainable rule-based formula:

```text
hoursLate = max(0, currentTime - expectedArrivalTime)
remainingHours = estimatedMinutesToDestination / 60
exposureHours = hoursLate + remainingHours

rawSpoilageRate =
  baseSpoilagePerHour[cargoType]
  * exposureHours
  * reasonMultiplier[lateReason]

spoilageRate = clamp(rawSpoilageRate, 0, 95)
valueAtRisk = cargoValue * spoilageRate / 100
```

## Risk Levels

| Spoilage Rate | Risk Level | Action |
|---:|---|---|
| 0-15% | Normal | Log only. |
| 16-35% | Watch | SMS buyer with delay update. |
| 36-60% | High | SMS buyer + voice call dispatcher. |
| 61-95% | Critical | Trigger rescue broadcast immediately. |

## Example

Shipment:

- Cargo: tomatoes.
- Base spoilage: 5% per hour late.
- Expected arrival: 14:00.
- Current time: 15:30.
- Driver location: Kibaha.
- Estimated time to destination: 95 minutes.
- Reason: vehicle problem.
- Cargo value: TZS 1,200,000.

Calculation:

```text
hoursLate = 1.5
remainingHours = 1.58
exposureHours = 3.08
reasonMultiplier = 1.5

spoilageRate = 5 * 3.08 * 1.5
spoilageRate = 23.1%
valueAtRisk = TZS 277,200
```

Risk level: `Watch`.

If the same shipment is fish:

```text
spoilageRate = 12 * 3.08 * 1.5
spoilageRate = 55.4%
```

Risk level: `High`.

## Build Steps

1. Create product sensitivity config.
2. Create delay reason multiplier config.
3. Create `calculateSpoilageRisk()` function.
4. Store spoilage rate on shipment.
5. Store value at risk.
6. Store risk explanation text.
7. Display calculation breakdown in dashboard.

## Acceptance Criteria

- Risk calculation is deterministic and explainable.
- Same inputs always produce same result.
- Dashboard shows:
  - spoilage percentage,
  - risk level,
  - reason,
  - location,
  - value at risk,
  - recommended action.

---

# Phase 5: Automated Africa's Talking Actions

## Goal

Use the calculated spoilage rate to trigger the right communication flow.

## Action Matrix

| Risk Level | AT APIs Used | Action |
|---|---|---|
| Normal | USSD | Log check-in only. |
| Watch | USSD + SMS | Alert buyer with delay and estimated spoilage. |
| High | USSD + SMS + Voice | Alert buyer and call dispatcher. |
| Critical | USSD + SMS + Voice | Alert buyer, call dispatcher, broadcast rescue to backup drivers. |
| Delivered | USSD + Airtime/Mobile Data | Reward driver after proof-of-delivery. |
| Rescue Fee | Payments | Buyer/aggregator confirms rescue payment or payout. |
| Rich Updates | WhatsApp | Send detailed status card to buyer if available. |

## SMS Templates

### Buyer Watch Alert

```text
FreshRoute: Tomato shipment FR-104 delayed near Kibaha. Estimated spoilage risk: 23%. We are monitoring.
```

### Buyer High-Risk Alert

```text
FreshRoute Alert: Fish shipment FR-208 is HIGH RISK near Kibaha. Estimated spoilage: 55%. Dispatcher has been called.
```

### Backup Driver Broadcast

```text
FreshRoute Rescue: Backup needed near Kibaha for fish shipment to Tandika. Use USSD to accept.
```

## Voice Call Trigger

Trigger when risk is `High` or `Critical`.

Message:

```text
FreshRoute alert. Shipment FR-208 is high risk. Driver reported vehicle problem near Kibaha. Estimated spoilage is 55 percent. Assign rescue now.
```

## Reward Trigger

When driver completes delivery through USSD:

- if driver gave delay reason and location, send airtime reward;
- if rescue driver completed delivery, send mobile data reward;
- log reward if sandbox limitation prevents real send.

## Acceptance Criteria

- Risk level controls API actions.
- Every API action appears in the dashboard activity feed.
- Demo can show all AT APIs even if some are mocked.
- Buyer and dispatcher messages include spoilage rate.

---

# Phase 6: Rescue Dispatch

## Goal

When spoilage risk is high, the system should not only alert; it should coordinate a rescue.

## Trigger

Rescue is triggered automatically when:

```text
spoilageRate >= 61%
```

Or manually when dispatcher clicks:

```text
Broadcast Rescue
```

## Rescue Flow

1. System identifies backup drivers near the reported location.
2. System sends SMS rescue request.
3. Backup driver opens USSD.
4. Driver accepts rescue.
5. Shipment status changes to `rescue_assigned`.
6. Buyer receives SMS/WhatsApp update.
7. Dispatcher dashboard shows backup driver.

## Backup Driver USSD

```text
CON FreshRoute Rescue Offer
Fish shipment near Kibaha to Tandika.
1. Accept rescue
2. Decline
```

Accept response:

```text
END Rescue accepted. Proceed to Kibaha handoff point. Buyer and dispatcher notified.
```

## Acceptance Criteria

- Critical shipment can trigger rescue flow.
- Backup driver acceptance updates dashboard.
- Buyer receives rescue-assigned alert.
- Final delivery can be completed by original or rescue driver.

---

# Phase 7: Dashboard and Demo Polish

## Goal

Make the spoilage calculation visible and judge-friendly.

## Dashboard Sections

### 1. Active Shipments

Show:

- product,
- driver,
- destination,
- status,
- spoilage rate,
- risk level.

### 2. Spoilage Breakdown

Show:

- cargo sensitivity,
- delay reason,
- reported location,
- estimated minutes remaining,
- exposure hours,
- reason multiplier,
- value at risk.

### 3. Recommended Action

Examples:

- `Monitor only`
- `Alert buyer`
- `Call dispatcher`
- `Broadcast rescue`

### 4. Africa's Talking Activity

Show:

- USSD inbound,
- SMS sent,
- Voice triggered,
- Airtime sent,
- Mobile Data sent,
- Payment logged,
- WhatsApp update sent.

## Demo Buttons

- `Load Tomato Scenario`
- `Load Fish Scenario`
- `Simulate Driver Delay`
- `Simulate Critical Spoilage`
- `Broadcast Rescue`
- `Complete Delivery`

## Acceptance Criteria

- Presenter can explain calculation in 30 seconds.
- Dashboard proves why the system made the decision.
- Demo finishes in under 5 minutes.
- There is no black-box AI claim.

---

# Recommended Hackathon Build Order

## Step 1

Build shipment creation and dashboard.

## Step 2

Build USSD main menu.

## Step 3

Add late-delivery reason menu.

## Step 4

Add location input after reason selection.

## Step 5

Build location normalization table.

## Step 6

Build spoilage-rate engine.

## Step 7

Display spoilage rate and value at risk.

## Step 8

Trigger SMS/Voice based on risk level.

## Step 9

Add rescue broadcast and backup-driver USSD accept flow.

## Step 10

Add Airtime/Mobile Data rewards and Payments/WhatsApp logs.

## Step 11

Add demo reset, sample scenarios, and API activity feed.

## Step 12

Practice the 5-minute demo until it is smooth.

---

# Technical Function Contract

```ts
type DelayReason =
  | "traffic"
  | "vehicle_problem"
  | "police_roadblock"
  | "loading_delay"
  | "weather_road"
  | "other";

type SpoilageInput = {
  cargoType: string;
  cargoValue: number;
  expectedArrivalAt: Date;
  currentTime: Date;
  delayReason: DelayReason;
  reportedLocation: string;
  destination: string;
};

type SpoilageResult = {
  normalizedLocation: string;
  estimatedMinutesToDestination: number;
  hoursLate: number;
  exposureHours: number;
  baseSpoilagePerHour: number;
  reasonMultiplier: number;
  spoilageRate: number;
  valueAtRisk: number;
  riskLevel: "normal" | "watch" | "high" | "critical";
  recommendedAction: string;
};
```

## Pseudocode

```ts
function calculateSpoilageRisk(input: SpoilageInput): SpoilageResult {
  const location = normalizeLocation(input.reportedLocation);
  const baseRate = productSensitivity[input.cargoType] ?? 3;
  const multiplier = reasonMultipliers[input.delayReason] ?? 1.2;

  const hoursLate = Math.max(
    0,
    differenceInMinutes(input.currentTime, input.expectedArrivalAt) / 60
  );

  const remainingHours = location.estimatedMinutesToDestination / 60;
  const exposureHours = hoursLate + remainingHours;

  const rawRate = baseRate * exposureHours * multiplier;
  const spoilageRate = Math.min(95, Math.max(0, rawRate));
  const valueAtRisk = input.cargoValue * (spoilageRate / 100);

  return {
    normalizedLocation: location.name,
    estimatedMinutesToDestination: location.estimatedMinutesToDestination,
    hoursLate,
    exposureHours,
    baseSpoilagePerHour: baseRate,
    reasonMultiplier: multiplier,
    spoilageRate,
    valueAtRisk,
    riskLevel: getRiskLevel(spoilageRate),
    recommendedAction: getRecommendedAction(spoilageRate),
  };
}
```

---

# Winning Explanation

Say this during the demo:

```text
The driver does not need GPS or a smartphone. After reporting why they are late, they enter their nearest location by USSD. FreshRoute combines that location with the cargo type, delay reason, expected arrival time, and remaining travel time to estimate spoilage risk. That risk then decides whether we simply monitor, alert the buyer, call the dispatcher, or trigger rescue.
```

This makes the system feel intelligent while staying realistic for the Africa's Talking sandbox.
