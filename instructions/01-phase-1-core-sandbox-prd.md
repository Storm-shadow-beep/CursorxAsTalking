# Phase 1 PRD: Core Sandbox Demo

Product: FreshRoute Rescue  
Phase goal: Build the smallest end-to-end demo where a perishable shipment is created, delayed, escalated, rescued, and completed.  
Recommended build time: 2-3 hours with Cursor.

## Problem

Perishable-goods logistics often fails at the exception point. A delivery can be going fine until the truck breaks down, the driver gets delayed, or the buyer cannot be reached. The current workaround is fragmented calls and WhatsApp messages. That does not scale when one coordinator manages multiple daily shipments.

## Target User

Primary user: produce aggregator or market buyer coordinating multiple small shipments.  
Secondary user: driver with a basic phone.  
Tertiary user: dispatcher/coordinator responsible for rescue decisions.

## Phase 1 Demo Promise

In the sandbox, judges should see one shipment move through this story:

1. Coordinator creates a tomato shipment.
2. System sends SMS to assigned driver.
3. Driver checks in through USSD.
4. Driver reports a delay.
5. Shipment risk changes from `Normal` to `High`.
6. Buyer receives SMS alert.
7. Dispatcher sees the exception in a web dashboard.
8. Coordinator marks backup assigned.
9. Shipment is completed.

## Scope

### Must Have

- Shipment creation form.
- Shipment list with status chips.
- Driver USSD callback endpoint.
- Basic USSD menu:
  - `1. Check in`
  - `2. Report delay`
  - `3. Report breakdown`
  - `4. Complete delivery`
- SMS send wrapper using Africa's Talking sandbox credentials.
- Event timeline per shipment.
- Spoilage risk rule:
  - `Normal`: no delay.
  - `Watch`: delay under 1 hour.
  - `High`: delay over 1 hour or breakdown.
- Dashboard view with current shipment risk and latest event.

### Should Have

- Seed data for 3 drivers and 2 buyers.
- Mock mode toggle if API credentials are unavailable.
- Clear demo buttons:
  - `Create sample shipment`
  - `Simulate driver delay`
  - `Simulate delivery completed`

### Cut From Phase 1

- Real maps/GPS.
- Real route optimization.
- Authentication.
- Payments.
- Full driver marketplace.
- Machine learning.
- Production database design.

## User Stories

### Coordinator

As a coordinator, I want to create a perishable shipment so that the driver and buyer can be notified immediately.

Acceptance criteria:

- Form captures product, quantity, origin, destination, buyer phone, driver phone, and expected arrival time.
- On submit, shipment appears in dashboard.
- System logs `Shipment created`.
- System attempts to send driver SMS.

### Driver

As a driver, I want to report status through USSD so that I do not need a smartphone or data bundle.

Acceptance criteria:

- USSD endpoint accepts `sessionId`, `phoneNumber`, and `text`.
- If `text` is empty, return main menu.
- If driver selects delay or breakdown, shipment event is created.
- USSD response uses `CON` for continuing menus and `END` for terminal messages.

### Buyer

As a buyer, I want to receive an SMS when my perishable shipment is at risk so that I can adjust market plans.

Acceptance criteria:

- High-risk event triggers SMS to buyer phone.
- SMS includes product, driver status, and next action.
- Failed API call is logged but does not crash the demo.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Create shipment from dashboard | P0 |
| F2 | Persist shipment and events | P0 |
| F3 | Receive USSD callback | P0 |
| F4 | Update shipment status from USSD | P0 |
| F5 | Send SMS via Africa's Talking sandbox wrapper | P0 |
| F6 | Display live event timeline | P0 |
| F7 | Provide mock fallback for demo reliability | P1 |

## Non-Functional Requirements

- Demo should work locally and deployed.
- API keys must be read from environment variables.
- All external API calls must be wrapped with graceful failure handling.
- Dashboard must be readable from projector distance.
- USSD demo path must be explainable in under 60 seconds.

## Data Model

### Shipment

- `id`
- `productType`
- `quantity`
- `origin`
- `destination`
- `buyerName`
- `buyerPhone`
- `driverName`
- `driverPhone`
- `expectedArrivalAt`
- `status`: `created`, `in_transit`, `at_risk`, `rescue_assigned`, `delivered`
- `risk`: `normal`, `watch`, `high`
- `createdAt`
- `updatedAt`

### ShipmentEvent

- `id`
- `shipmentId`
- `actorPhone`
- `type`: `created`, `driver_notified`, `check_in`, `delay`, `breakdown`, `buyer_alerted`, `rescue_assigned`, `delivered`
- `message`
- `createdAt`

## API Requirements

### `POST /api/shipments`

Creates a shipment and sends driver SMS.

### `GET /api/shipments`

Returns shipments and latest events.

### `POST /api/ussd`

Handles Africa's Talking USSD callbacks.

### `POST /api/demo/simulate`

Triggers demo events without depending on the phone simulator.

## Africa's Talking Usage

- SMS: notify driver and buyer.
- USSD: driver check-ins and delivery completion.

## Demo Script

1. Show empty dashboard.
2. Click `Create sample shipment`.
3. Point out driver SMS event.
4. Open USSD simulator or call the local endpoint with sample payload.
5. Select `Report delay`.
6. Show risk becomes `High`.
7. Show buyer alert event.
8. Click `Complete delivery`.
9. End with impact metric: `1 high-risk shipment rescued before spoilage`.

## Success Criteria

- End-to-end path completes in under 3 minutes.
- At least two Africa's Talking APIs are demonstrated or clearly logged.
- Judges understand the pain without a long explanation.
- The demo still works if Africa's Talking sandbox calls fail by showing mock logs.

## Cursor Build Prompt

```text
Build a Next.js app called FreshRoute Rescue. It needs a shipment dashboard, shipment creation form, event timeline, and API routes for Africa's Talking SMS and USSD callbacks. Use environment variables for AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY. Add a mock mode fallback. Keep the UI dashboard-focused, not a landing page.
```
