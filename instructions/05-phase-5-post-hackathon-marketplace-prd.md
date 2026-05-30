# Phase 5 PRD: Post-Hackathon Marketplace Pilot

Product: FreshRoute Rescue  
Phase goal: Convert the hackathon prototype into a small pilot that could qualify for the Africa's Talking Marketplace Program.  
Recommended timeline: 2 weeks after hackathon.

## Problem

Winning a hackathon is useful, but the bigger opportunity is proving that real aggregators and drivers will use the workflow. The post-hackathon phase should avoid building a full SaaS product too early. The goal is to validate behavior.

## Pilot Objective

Run 20 monitored perishable shipments with 2 real produce aggregators or farmer groups.

## Hypotheses

| Hypothesis | Validation Signal |
|---|---|
| Drivers will use USSD check-ins if the menu is short and airtime is rewarded. | At least 70% of shipments receive driver check-in. |
| Buyers value exception alerts. | At least 2 buyers ask to keep receiving alerts after pilot. |
| Coordinators will change behavior based on high-risk alerts. | At least 3 shipments trigger manual intervention or rescue action. |
| Airtime incentives improve reporting. | Drivers with reward promise check in more often than drivers without reward. |

## Scope

### Must Have

- Basic authentication.
- Organization/workspace for each pilot customer.
- CSV export of shipment events.
- Phone number allowlist.
- Configurable SMS templates.
- Pilot analytics report.
- Manual admin override.

### Should Have

- WhatsApp buyer notification if approved/available.
- Driver reliability score.
- Simple billing estimate by shipment/API usage.
- Marketplace listing draft.

### Cut From Phase 5

- Full self-serve signup.
- Complex billing.
- Native mobile app.
- AI route optimization.
- Real-time GPS.
- Enterprise integrations.

## Pilot User Stories

### Aggregator

As an aggregator, I want to monitor today's shipments so that I know which loads are at risk before buyers complain.

Acceptance criteria:

- Aggregator sees only their shipments.
- Aggregator can create shipment in under 60 seconds.
- Aggregator receives daily summary.

### Driver

As a driver, I want the USSD menu to be short so that I can update status quickly while working.

Acceptance criteria:

- USSD flow has no more than 2 levels for common actions.
- Driver can complete check-in in under 30 seconds.
- Driver receives reward confirmation after eligible completion.

### Pilot Admin

As the product team, we want to learn from every shipment so that we know whether to continue, pivot, or kill the idea.

Acceptance criteria:

- Every shipment has event history.
- Export includes timestamps for alerts and responses.
- Pilot report shows check-in rate, exceptions, rescues, and feedback.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Organization-level shipment separation | P0 |
| F2 | Login for pilot coordinators | P0 |
| F3 | Configurable driver and buyer contacts | P0 |
| F4 | CSV export | P0 |
| F5 | Daily summary SMS/email | P1 |
| F6 | Pilot analytics dashboard | P1 |
| F7 | Marketplace listing draft content | P1 |

## Metrics

### Product Metrics

- number of shipments monitored,
- driver check-in completion rate,
- average time from risk event to coordinator action,
- number of buyer alerts sent,
- number of rescue broadcasts sent,
- number of deliveries completed with proof-of-delivery.

### Business Metrics

- number of aggregators willing to continue,
- estimated value of cargo monitored,
- estimated value of cargo saved or protected,
- willingness to pay per shipment or per month.

## Customer Discovery Questions

Ask these after real shipments, not before:

1. Tell me about the last shipment that arrived late. What happened step by step?
2. Who did you call first when the delay happened?
3. What did the delay cost you in money, time, or buyer trust?
4. What did the driver do when they could not arrive on time?
5. What would make this workflow annoying enough that you would stop using it?

## Marketplace Positioning

### Category

Transport and logistics communication workflow.

### Listing Headline

FreshRoute Rescue: USSD-first exception response for perishable logistics.

### Listing Description

FreshRoute Rescue helps produce aggregators, farmer groups, and logistics coordinators monitor perishable shipments, receive driver check-ins over USSD, alert buyers by SMS, escalate urgent cases by voice, and reward reliable updates with airtime.

### Ideal Customer

SME produce aggregators, farmer cooperatives, cold-chain operators, and market buyers coordinating multiple informal drivers.

## Two-Week Plan

### Days 1-2

Interview 5 aggregators or market buyers. Confirm the exact shipment workflow and late-delivery stories.

### Days 3-4

Harden prototype for pilot: auth, organization separation, CSV export, phone allowlist.

### Days 5-7

Run first 5 real or concierge-monitored shipments. Manually support every issue.

### Days 8-10

Improve USSD copy and alert timing based on driver/coordinator feedback.

### Days 11-13

Run 15 more shipments. Measure check-in rate and intervention rate.

### Day 14

Prepare pilot report and Marketplace Program pitch.

## Success Criteria

- 20 shipments monitored.
- 70% driver check-in rate.
- 3 or more high-risk events detected.
- 2 pilot customers willing to continue.
- One clear pricing hypothesis based on customer feedback.

## Kill Criteria

Stop or pivot if:

- drivers will not use USSD even with airtime rewards,
- aggregators do not experience late deliveries as a costly recurring problem,
- buyers ignore alerts,
- coordinators still prefer manual calls because the product adds no speed or confidence.

## Cursor Build Prompt

```text
Prepare FreshRoute for a 2-week pilot. Add simple auth, organization separation, CSV export, pilot analytics, configurable contacts, and a marketplace listing page. Keep the product focused on validating real shipment behavior, not adding advanced logistics features.
```
