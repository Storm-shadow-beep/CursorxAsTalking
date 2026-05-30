# FreshRoute Rescue — Implementation Guide

This document describes what was built, how it fits the hackathon instructions, and how to run the demo. **Admin dashboard UI is out of scope** (built by another teammate); this repo delivers the **REST API + USSD + Africa's Talking orchestration**.

## Architecture

Two servers work together:

| Service | Path | Port | Role |
|---------|------|------|------|
| **AT Sandbox Suite** (existing) | `F:\important_projects\hackathons\said-at\africastalking-demo-api-all` | 3000 | Low-level SMS, USSD (demo), Voice, Airtime, WhatsApp HTTP endpoints |
| **FreshRoute Rescue** (new) | `F:\important_projects\hackathons\CursorxTalking\freshroute` | 3001 | Business logic: shipments, spoilage, rescue, USSD menus, API audit trail |

FreshRoute calls the AT backend over HTTP (`AT_BACKEND_URL`, default `http://localhost:3000`). Credentials live in the **AT project** `.env` (`AT_USERNAME`, `AT_API_KEY`, WhatsApp vars, voice number).

```
Driver/Buyer phones
        │
        ▼
Africa's Talking Sandbox ──webhook──► FreshRoute POST /api/ussd
        │
        ▼
FreshRoute services ──HTTP──► AT Suite /sms, /voice, /airtime, /whatsapp
        │
        ▼
Admin dashboard (separate) ◄── REST GET /api/shipments, /api/activity
```

## Phases implemented

| Phase | Scope in this repo |
|-------|-------------------|
| **1** | Shipments CRUD (API), USSD check-in / delay / breakdown / complete, SMS on create, event timeline, risk states |
| **2** | `AfricaTalkingService` via HTTP proxy, API activity log (`GET /api/activity`), Voice on high/critical, Airtime on delivery with check-in |
| **3** | Driver directory, rescue broadcast SMS, USSD accept/decline rescue, `rescue_assigned` status |
| **4** | Demo reset, load scenarios, simulate actions (no dashboard UI) |
| **7** | Spoilage engine, location normalization, USSD late-reason + location flow, risk-driven alerts + auto rescue at critical |

**Not built here:** Admin dashboard UI (Phase 4 UI, Phase 7 dashboard sections) — consume the APIs below.

## Quick start

### 1. Start Africa's Talking backend

```powershell
cd F:\important_projects\hackathons\said-at\africastalking-demo-api-all
copy .env.example .env
# Edit .env with your sandbox API key
npm install
npm run dev
```

Verify: `http://localhost:3000/health`

### 2. Start FreshRoute

```powershell
cd F:\important_projects\hackathons\CursorxTalking\freshroute
copy .env.example .env
npm install
npm run dev
```

Verify: `http://localhost:3001/health`

### 3. Ngrok & Africa's Talking callbacks

You run **two servers**. Callbacks split like this:

| Product | Required for FreshRoute demo? | Where to point in AT dashboard |
|---------|------------------------------|--------------------------------|
| **USSD** | **Yes** | `https://<ngrok-3001>/api/ussd` → FreshRoute |
| **SMS (outbound)** | Yes (sends only) | No callback — FreshRoute calls AT `/sms/send` |
| **SMS (2-way inbound)** | Optional | See inbound row below |
| **Voice (outbound)** | Yes for high-risk escalation | No callback to *start* a call |
| **Voice (events/actions)** | **Yes if using real voice calls** | See voice row below |
| **Airtime** | Yes (reward on delivery) | **No webhook** — API only via `/airtime/send` |
| **WhatsApp (outbound)** | Yes for buyer updates | No callback to *send* |
| **WhatsApp (inbound)** | Optional | See WhatsApp row below |

#### Option A — One ngrok on FreshRoute (port 3001) — recommended

Run `ngrok http 3001` and set **all** dashboard URLs to the FreshRoute host:

| AT dashboard field | URL |
|--------------------|-----|
| USSD Service Callback | `https://<ngrok>/api/ussd` |
| SMS Inbound (2-way only) | `https://<ngrok>/api/webhooks/sms/inbound` |
| Voice Events | `https://<ngrok>/api/webhooks/voice/events` |
| Voice Actions | `https://<ngrok>/api/webhooks/voice/actions` |
| WhatsApp Webhook | `https://<ngrok>/api/webhooks/whatsapp/webhook` |

FreshRoute **proxies** inbound webhooks to the AT backend on `http://localhost:3000`. The AT server must be running.

List URLs anytime: `GET http://localhost:3001/api/webhooks`

#### Option B — Two ngrok tunnels

| Tunnel | Port | Use for |
|--------|------|---------|
| ngrok #1 | 3001 | USSD → `/api/ussd` |
| ngrok #2 | 3000 | SMS inbound, Voice events/actions, WhatsApp → paths in AT README |

Do **not** point USSD at `https://<ngrok-3000>/ussd` — that is the generic AT demo menu, not FreshRoute.

#### What FreshRoute does without callbacks

Outbound only (no inbound URL needed):

- Driver/buyer **SMS** on create, risk alerts, rescue broadcast
- **Voice** call to dispatcher on high/critical risk
- **Airtime** after delivery with check-in
- **WhatsApp** buyer status messages (if `AT_WHATSAPP_*` is set on the **AT backend** `.env`)

Those appear in `GET /api/activity` even when sandbox returns errors (logged as `failed` or `mocked`).

### Mock mode

If the AT server is down or you want logs only:

```env
AFRICASTALKING_MOCK=true
```

Activity rows will show status `mocked`.

## API reference (for dashboard teammate)

### Shipments

- `POST /api/shipments` — create shipment, SMS driver
- `GET /api/shipments` — list + metrics + event timelines
- `GET /api/shipments/:id` — single shipment with events

### USSD (Africa's Talking callback)

- `POST /api/ussd` — body: `sessionId`, `phoneNumber`, `text` (form-urlencoded from AT)
- `GET /api/ussd` — returns usage hint only (opening this URL in a browser is GET and will **not** run USSD logic)

## USSD troubleshooting (“Dear customer, something went wrong”)

That message is from the **telco/AT gateway**, not FreshRoute. It means AT did **not** receive valid plain text starting with `CON` or `END` (often within ~15s).

| Check | What to do |
|-------|------------|
| Ngrok target port | `ngrok http 3001` (FreshRoute), **not** 3000 |
| FreshRoute running | `http://localhost:3001/health` returns `ok: true` |
| Callback path | Dashboard URL must end with `/api/ussd` exactly |
| Link your SIM | `POST /api/demo/link-sandbox-phone` with the **same** number you dial from |
| Ngrok inspector | Open `http://127.0.0.1:4040` → see if POST `/api/ussd` is **200** and body starts with `CON` |
| Wrong response | **400 JSON** or **HTML** (ngrok warning page) → telco shows generic error |

```powershell
# Replace with your sandbox mobile from AT dashboard
$phone = "+2547XXXXXXXX"
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/demo/link-sandbox-phone `
  -ContentType "application/json" -Body (@{ phoneNumber = $phone } | ConvertTo-Json)

# Simulate AT callback through ngrok
Invoke-WebRequest -Method POST -Uri "https://company-impure-spotting.ngrok-free.dev/api/ussd" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "sessionId=test-1&phoneNumber=$([uri]::EscapeDataString($phone))&text="
```

If local works but the phone still fails, check ngrok **4040** for failed requests (502 = FreshRoute not running; 404 = wrong path/port).

**Test USSD locally (PowerShell):**

```powershell
# 1) Load demo shipment (driver phone +255712000001)
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/demo/load-winning-scenario

# 2) Open USSD main menu
Invoke-WebRequest -Method POST -Uri http://localhost:3001/api/ussd `
  -ContentType 'application/x-www-form-urlencoded' `
  -Body 'sessionId=test-1&phoneNumber=%2B255712000001&text='
```

### Rescue

- `POST /api/rescue/broadcast/:shipmentId` — manual broadcast
- `GET /api/rescue/offers?shipmentId=FR-101`

### Drivers

- `GET /api/drivers`
- `GET /api/drivers/available-backups?excludePhone=...`

### Africa's Talking activity (for “API Activity” panel)

- `GET /api/activity`
- `GET /api/activity?shipmentId=FR-101&product=whatsapp`

### Demo helpers (presenter / testing)

- `POST /api/demo/reset`
- `POST /api/demo/load-winning-scenario` — tomato shipment + seed drivers
- `POST /api/demo/load-fish-scenario`
- `POST /api/demo/simulate` — body: `{ "action": "driver_delay" | "critical_spoilage" | "breakdown" | "complete_delivery" | "check_in", "shipmentId": "FR-101" }`
- `GET /api/demo/spoilage-preview?cargoType=fish&location=Kibaha&delayReason=vehicle_problem`

## USSD flows

**Main menu** (assigned driver with active shipment):

1. Check in  
2. Report late delivery → reason → location → spoilage calculation  
3. Report breakdown → immediate high-risk path  
4. Complete delivery → airtime if check-in done  

**Rescue offer** (backup driver with open offer):

1. Accept rescue  
2. Decline  

## Spoilage & automated actions

| Spoilage % | Risk | Actions |
|------------|------|---------|
| 0–15 | normal | Log only |
| 16–35 | watch | SMS + WhatsApp buyer |
| 36–60 | high | SMS + WhatsApp buyer + Voice dispatcher |
| 61–95 | critical | Above + auto rescue broadcast to backup drivers |

Formula: `baseRate[cargo] × exposureHours × reasonMultiplier`, clamped 0–95%. Locations normalized via sandbox zone table (Kibaha, Mbezi, Ubungo, etc.).

## Seed data

Drivers: Amani (Kibaha), Neema (Kariakoo), Baraka (Morogoro Road), Fatuma (Mbezi).  
Default winning scenario: tomatoes Kibaha → Tandika, driver `+255712000001`.

**Important:** Use sandbox phone numbers in `.env` / seed that match your AT sandbox allowed numbers.

## Demo script (5 min, API-only)

1. `POST /api/demo/reset` then `POST /api/demo/load-winning-scenario`
2. Show `GET /api/shipments` and `GET /api/activity` (driver SMS)
3. Simulate USSD late delivery (`POST /api/ussd` with driver phone) or `POST /api/demo/simulate` `{ "action": "driver_delay" }`
4. Show spoilage fields on shipment + buyer SMS/WhatsApp in activity
5. `POST /api/demo/simulate` `{ "action": "critical_spoilage" }` or manual `POST /api/rescue/broadcast/FR-101`
6. Backup driver USSD accept → `rescue_assigned`
7. `POST /api/demo/simulate` `{ "action": "complete_delivery" }` → airtime in activity

## File layout

```text
CursorxTalking/
  instructions/          # PRDs (source of truth)
  implementation.md        # This file
  freshroute/
    src/
      server.js
      config/
      data/seed.js
      store.js             # In-memory DB
      services/
        africaTalking.js   # HTTP client → AT backend
        spoilage.js
        location.js
        shipmentService.js
        rescueService.js
        ussdHandler.js
      routes/
        shipments.js, ussd.js, drivers.js, rescue.js, activity.js, demo.js
```

## WhatsApp

Buyer updates are sent via `POST /whatsapp/send` on the AT backend when risk ≥ watch. Configure `AT_WHATSAPP_API_URL` and `AT_WHATSAPP_SENDER` in the **AT project** `.env`. Failures are logged in `/api/activity` as `failed` without breaking the flow.

## Next steps for dashboard teammate

Wire UI to:

- `GET /api/shipments` (status chips, spoilage %, risk level, rescue card data)
- `GET /api/activity` (AT product feed)
- `POST /api/rescue/broadcast/:id` button on high-risk rows
- Demo buttons mapping to `/api/demo/*` endpoints
