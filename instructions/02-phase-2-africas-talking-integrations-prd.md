# Phase 2 PRD: Africa's Talking Integration Depth

Product: FreshRoute Rescue  
Phase goal: Upgrade the demo from "uses SMS/USSD" to "Africa's Talking is the operating layer."  
Recommended build time: 2 hours.

## Problem

Many hackathon teams add SMS at the end as a notification. That looks shallow. FreshRoute should show that Africa's Talking enables the entire workflow for users who may not have smartphones, data, or a shared app.

## Phase 2 Demo Promise

Judges should see four Africa's Talking API moments:

1. SMS: driver and buyer notifications.
2. USSD: driver status update and proof-of-delivery.
3. Voice: dispatcher escalation when spoilage risk is high.
4. Airtime: reward for driver who completes timely check-ins or rescue delivery.

## Scope

### Must Have

- Central `AfricaTalkingService` wrapper.
- SMS send function with request/response logging.
- Voice call function or mockable voice escalation log.
- Airtime reward function or mockable airtime log.
- Integration status panel in dashboard.
- API call audit trail:
  - product used,
  - recipient,
  - payload summary,
  - result,
  - timestamp.

### Should Have

- Toggle between `sandbox` and `mock`.
- Demo-safe sample phone numbers.
- Replay button for API events.
- Copyable callback URLs for USSD setup.

### Cut From Phase 2

- WhatsApp rich media unless credentials are ready.
- Mobile Data reward unless Airtime is blocked.
- Payment flows.
- Production-grade retry queue.

## User Stories

### Judge

As a judge, I want to see which Africa's Talking APIs were used so that I can tell the team did more than add a notification.

Acceptance criteria:

- Dashboard includes `Africa's Talking API Activity`.
- Each API call appears with product label: SMS, USSD, Voice, Airtime.
- Failed sandbox calls show error and fallback state.

### Dispatcher

As a dispatcher, I want high-risk shipments to trigger a voice escalation so that urgent cases are not buried in a dashboard.

Acceptance criteria:

- Breakdown or long delay creates `High` risk.
- `High` risk triggers a voice escalation attempt or mock event.
- Dashboard timeline logs `Voice escalation triggered`.

### Driver

As a driver, I want a small airtime reward after completing required updates so that I have a reason to report status reliably.

Acceptance criteria:

- Delivery completion checks whether driver submitted at least one check-in.
- If yes, system triggers airtime reward or mock event.
- Timeline logs reward amount and recipient.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Centralize Africa's Talking config | P0 |
| F2 | Log every API call attempt | P0 |
| F3 | Trigger SMS on shipment creation and risk alert | P0 |
| F4 | Handle USSD status and POD flow | P0 |
| F5 | Trigger Voice escalation for high risk | P0 |
| F6 | Trigger Airtime reward on delivery completion | P0 |
| F7 | Show API activity panel | P0 |
| F8 | Mock external calls when credentials fail | P1 |

## Integration Design

### Environment Variables

- `AFRICASTALKING_USERNAME`
- `AFRICASTALKING_API_KEY`
- `AFRICASTALKING_ENV=sandbox`
- `AFRICASTALKING_MOCK=true|false`
- `DISPATCHER_PHONE`

### Service Methods

- `sendSms({ to, message, reason })`
- `startVoiceCall({ to, message, reason })`
- `sendAirtime({ to, amount, currencyCode, reason })`
- `recordUssdSession({ phoneNumber, sessionId, text })`

### API Activity Record

- `id`
- `shipmentId`
- `product`: `sms`, `ussd`, `voice`, `airtime`
- `direction`: `inbound`, `outbound`
- `recipientPhone`
- `summary`
- `status`: `sent`, `received`, `mocked`, `failed`
- `rawResponse`
- `createdAt`

## USSD Menu Specification

Main menu:

```text
CON FreshRoute Rescue
1. Check in
2. Report delay
3. Report breakdown
4. Complete delivery
```

Delay submenu:

```text
CON Delay duration?
1. Under 30 min
2. 30-60 min
3. Over 1 hour
```

Breakdown terminal response:

```text
END Breakdown logged. Dispatcher and buyer will be alerted.
```

Delivery complete response:

```text
END Delivery completed. Thank you. Airtime reward queued.
```

## Voice Escalation Script

The actual voice call can use a simple text-to-speech message or be mocked in the dashboard:

```text
FreshRoute alert. Tomato shipment FR-104 is high risk. Driver reported breakdown. Open dashboard and assign rescue.
```

## SMS Templates

Driver assignment:

```text
FreshRoute: You are assigned shipment {{shipmentId}}: {{product}} to {{destination}}. Use USSD to check in.
```

Buyer risk alert:

```text
FreshRoute Alert: {{product}} shipment {{shipmentId}} is HIGH RISK. Reason: {{reason}}. Rescue assignment in progress.
```

Backup driver request:

```text
FreshRoute Rescue: Backup needed near {{origin}} for {{product}} shipment to {{destination}}. Reply via USSD to accept.
```

Airtime reward:

```text
FreshRoute: Thanks for completing shipment {{shipmentId}} updates. Airtime reward sent.
```

## Success Criteria

- Dashboard shows at least one logged event for SMS, USSD, Voice, and Airtime.
- Demo can complete with real sandbox where possible and mock fallback where not.
- The pitch can say: "Africa's Talking is not just a notification provider here; it is how low-connectivity drivers participate."

## Cursor Build Prompt

```text
Add an AfricaTalkingService layer with SMS, Voice, Airtime, and USSD logging. Create an API Activity dashboard panel. Every external call must log success, failure, or mocked status. High-risk shipments trigger SMS to buyer and voice escalation to dispatcher. Delivered shipments trigger an airtime reward event.
```
