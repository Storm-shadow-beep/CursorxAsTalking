# Phase 3 PRD: Rescue Dispatch Workflow

Product: FreshRoute Rescue  
Phase goal: Make the product feel operational, not just a set of alerts.  
Recommended build time: 1.5-2 hours.

## Problem

Knowing a shipment is delayed is not enough. The winning product must show what happens next. For perishable goods, the valuable action is assigning backup transport before the cargo spoils.

## Phase 3 Demo Promise

Judges should see a shipment go from `High Risk` to `Rescue Assigned` because a backup driver accepted the rescue request through USSD.

## Scope

### Must Have

- Driver directory with availability.
- Rescue broadcast button.
- SMS broadcast to backup drivers.
- USSD rescue acceptance path.
- Dashboard state transition to `rescue_assigned`.
- Rescue assignment card showing original driver, backup driver, and reason.

### Should Have

- Driver distance mocked by zone.
- Driver reliability score based on completed check-ins.
- Manual assignment fallback.
- `Time to rescue assignment` metric.

### Cut From Phase 3

- Real-time maps.
- Automatic route matching.
- Driver bidding.
- Driver app.
- Payment settlement.

## User Stories

### Dispatcher

As a dispatcher, I want to broadcast a rescue request to available backup drivers so that I can save a shipment without calling everyone manually.

Acceptance criteria:

- `Broadcast rescue` button appears for high-risk shipments.
- System sends/logs SMS to available backup drivers.
- Shipment event logs all drivers contacted.

### Backup Driver

As a backup driver, I want to accept a rescue through USSD so that I can respond even without mobile data.

Acceptance criteria:

- USSD menu recognizes available rescue offers for driver phone number.
- Driver selects `Accept rescue`.
- System assigns driver and updates shipment status.

### Coordinator

As a coordinator, I want to see whether rescue has been assigned so that I can update the buyer confidently.

Acceptance criteria:

- Dashboard changes status to `Rescue Assigned`.
- Timeline logs backup driver name and phone.
- Buyer receives SMS update.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Maintain driver directory | P0 |
| F2 | Filter backup drivers by availability | P0 |
| F3 | Send/log rescue broadcast SMS | P0 |
| F4 | Add USSD rescue acceptance path | P0 |
| F5 | Assign backup driver to shipment | P0 |
| F6 | Notify buyer after rescue assignment | P0 |
| F7 | Track time from high-risk event to rescue assignment | P1 |

## Data Model Additions

### Driver

- `id`
- `name`
- `phone`
- `zone`
- `vehicleType`
- `available`: boolean
- `reliabilityScore`
- `completedRescues`

### RescueOffer

- `id`
- `shipmentId`
- `driverId`
- `status`: `sent`, `accepted`, `expired`, `declined`
- `sentAt`
- `respondedAt`

## USSD Rescue Menu

If a driver with an open rescue offer starts USSD:

```text
CON FreshRoute Rescue Offer
Shipment: {{product}} to {{destination}}
1. Accept rescue
2. Decline
```

Accept response:

```text
END Rescue accepted. Proceed to {{handoffLocation}}. Buyer and dispatcher notified.
```

Decline response:

```text
END Rescue declined. Thank you.
```

## Dashboard Requirements

### Rescue Panel

Display for high-risk shipment:

- product,
- risk reason,
- original driver,
- elapsed delay,
- available backup drivers,
- broadcast button,
- assignment status.

### Metrics Strip

- active shipments,
- high-risk shipments,
- rescues assigned,
- average rescue assignment time,
- driver check-in rate.

## Success Criteria

- Rescue can be assigned through the demo in under 90 seconds.
- At least 3 backup drivers can be shown as contacted.
- The buyer receives/logs an update after rescue assignment.
- The product now demonstrates action, not just visibility.

## Cursor Build Prompt

```text
Add a rescue dispatch workflow to FreshRoute. Create a seeded driver directory, rescue offers, SMS broadcast logging, and a USSD path for backup drivers to accept rescue offers. Add a rescue panel to high-risk shipments and update buyer SMS when rescue is assigned.
```
