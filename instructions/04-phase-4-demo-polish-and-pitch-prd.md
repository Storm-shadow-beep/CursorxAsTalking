# Phase 4 PRD: Demo Polish and Winning Pitch

Product: FreshRoute Rescue  
Phase goal: Convert the working prototype into a 3-5 minute winning hackathon demo.  
Recommended build time: 1-1.5 hours.

## Problem

Hackathon judging is not only about code. A team can lose with a working product if the demo is confusing, slow, or too generic. FreshRoute must make the pain, API usage, and impact obvious in the first minute.

## Demo Objective

Make judges believe three things:

1. The problem is real and expensive.
2. Africa's Talking is essential to the solution.
3. The team can ship a marketplace-ready tool after the hackathon.

## Scope

### Must Have

- One-click demo reset.
- One-click sample shipment.
- Projector-readable dashboard.
- Visible API activity feed.
- Clear metrics:
  - shipments monitored,
  - high-risk alerts,
  - rescue assigned,
  - estimated cargo value protected.
- Demo script in repository.
- Pitch slide or README section.

### Should Have

- Timer-friendly demo path.
- Error-safe mock mode.
- Seeded realistic data:
  - tomatoes from Kibaha/Morogoro to Kariakoo/Tandika market,
  - driver breakdown,
  - backup boda/pickup driver,
  - buyer alert.

### Cut From Phase 4

- New features.
- Redesigns that risk breaking the demo.
- Complex animations.
- Extra user roles.

## User Stories

### Presenter

As the presenter, I want a resettable demo scenario so that I can run the same story reliably in front of judges.

Acceptance criteria:

- `Reset demo` clears previous demo data.
- `Load winning scenario` creates all sample drivers, buyer, shipment, and initial events.
- Demo path does not require typing long forms during judging.

### Judge

As a judge, I want to understand the business and technical value quickly.

Acceptance criteria:

- Dashboard displays the problem state without explanation.
- Africa's Talking API calls are visible.
- Final screen shows impact metrics.

## Demo Flow

### Minute 0: Opening

Say:

```text
FreshRoute Rescue saves perishable cargo before it spoils by turning USSD, SMS, Voice, and Airtime into a live rescue network for produce logistics.
```

### Minute 1: Create Shipment

Show a tomato shipment moving into Dar es Salaam. Explain that the driver has no app and only needs a basic phone.

### Minute 2: Exception Happens

Simulate driver USSD breakdown/delay. Dashboard changes to `High Risk`. Buyer receives SMS. Dispatcher gets voice escalation.

### Minute 3: Rescue Network

Broadcast rescue to backup drivers. Backup driver accepts via USSD. Buyer receives update.

### Minute 4: Delivery and Reward

Complete delivery. Airtime reward is logged. Show impact metrics.

### Minute 5: Close

Say:

```text
Most logistics tools assume smartphones and perfect tracking. FreshRoute starts where African logistics often actually operates: feature phones, urgent calls, informal drivers, and perishable goods that cannot wait.
```

## Pitch Structure

### Problem

Perishable logistics fails when exceptions are handled too late. Calls and WhatsApp groups do not create a reliable rescue process.

### Solution

FreshRoute Rescue gives coordinators a lightweight control tower and gives drivers a USSD workflow for check-ins, delay reporting, rescue acceptance, and proof-of-delivery.

### Why Africa's Talking

- USSD reaches drivers without smartphones.
- SMS reaches buyers and backup drivers instantly.
- Voice escalates urgent cases.
- Airtime incentivizes timely driver updates.

### Business Model

- Monthly subscription for aggregators/cooperatives.
- Pay-per-shipment rescue monitoring.
- Marketplace listing for logistics SMEs needing communication workflows.

### Beachhead

Start with produce aggregators and farmer groups moving high-spoilage goods into Dar es Salaam markets.

## UI Requirements

- Use a dense operational dashboard, not a marketing landing page.
- Use status colors:
  - green: normal,
  - amber: watch,
  - red: high risk,
  - blue: rescue assigned,
  - gray: delivered.
- Avoid tiny text; judges may watch from a distance.
- Keep buttons clear:
  - `Load Scenario`
  - `Simulate Delay`
  - `Broadcast Rescue`
  - `Accept Rescue`
  - `Complete Delivery`

## Success Criteria

- Demo finishes in under 5 minutes.
- No manual database edits during demo.
- No dependency on real external API success; mock mode can prove the event.
- At least four Africa's Talking products appear in the API activity feed.
- The story is specific to African perishable logistics, not generic package tracking.

## Cursor Build Prompt

```text
Polish FreshRoute for a hackathon demo. Add Reset Demo and Load Winning Scenario actions, a projector-readable metrics strip, API activity feed, and a guided demo state machine with buttons for Simulate Delay, Broadcast Rescue, Accept Rescue, and Complete Delivery. Do not add new product complexity.
```
