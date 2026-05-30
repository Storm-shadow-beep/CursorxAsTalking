# FreshRoute Rescue: Phase-by-Phase Execution Plan

## Final Winning Idea

FreshRoute Rescue is a USSD-first exception-response system for perishable logistics. It helps produce aggregators, farmer groups, drivers, and market buyers prevent cargo loss when a shipment is delayed, breaks down, or needs a backup driver.

## Why This Can Win

- It is not a generic courier-tracking app.
- It is built around a painful moment: perishable cargo at risk.
- It demonstrates Africa's Talking deeply:
  - USSD for drivers,
  - SMS for alerts,
  - Voice for urgent escalation,
  - Airtime for driver incentives.
- It works in a sandbox with simulated shipments.
- It has a clear post-hackathon pilot path.

## Build Sequence

| Phase | File | Outcome |
|---:|---|---|
| 1 | `01-phase-1-core-sandbox-prd.md` | End-to-end shipment, delay, alert, and completion demo. |
| 2 | `02-phase-2-africas-talking-integrations-prd.md` | Deep API usage across SMS, USSD, Voice, and Airtime. |
| 3 | `03-phase-3-rescue-dispatch-prd.md` | Backup-driver rescue workflow. |
| 4 | `04-phase-4-demo-polish-and-pitch-prd.md` | Reliable 3-5 minute winning demo. |
| 5 | `05-phase-5-post-hackathon-marketplace-prd.md` | Two-week pilot and Marketplace Program path. |

## Hackathon Build Priority

If time is tight, build in this order:

1. Shipment dashboard.
2. USSD status flow.
3. SMS alert flow.
4. High-risk state and event timeline.
5. Voice escalation log.
6. Airtime reward log.
7. Backup rescue flow.
8. Demo reset and scenario buttons.

## Suggested Tech Stack

- Next.js or Remix for fast full-stack demo.
- SQLite or JSON/in-memory store for hackathon speed.
- Africa's Talking Node.js SDK or direct REST calls.
- Tailwind/shadcn only if the project is already set up quickly.
- Deploy with Vercel, Render, Railway, or a simple tunnel if allowed.

## Data to Seed

### Drivers

- Amani Mwita, pickup, Kibaha zone.
- Neema Joseph, boda, Kariakoo zone.
- Baraka Said, pickup, Morogoro road zone.

### Buyer

- Tandika Market Buyer, phone set to sandbox test number.

### Shipment

- Product: tomatoes.
- Quantity: 45 crates.
- Origin: Kibaha collection point.
- Destination: Tandika market, Dar es Salaam.
- Risk trigger: vehicle breakdown and 2-hour delay.

## Demo Checklist

- Africa's Talking credentials or mock mode ready.
- USSD callback URL reachable.
- SMS send tested or mocked.
- Voice and Airtime can be logged even if sandbox limitations appear.
- Demo data reset works.
- Presenter can complete demo in under 5 minutes.
- Backup plan works offline with mock API logs.

## Pitch Close

FreshRoute Rescue does not ask informal drivers to become app users. It meets them where they already are: USSD, SMS, calls, and airtime. That is why Africa's Talking is not a plugin in this product; it is the product's distribution and workflow layer.
