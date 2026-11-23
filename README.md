# SafarSetu

Responsive React + Vite customer ride-booking website with an Express API scaffold
for SafarSetu Bike and Auto rides in Greater Noida. Authentication, booking,
maps, payments, and other provider-dependent features remain under development.


## Run locally

```powershell
npm install
Copy-Item .env.development.example .env.local
npm run dev
```

## Run the API locally

In a second terminal:

```powershell
Copy-Item backend\.env.example backend\.env
npm --prefix backend install
npm run dev:api
```

The API listens on `http://localhost:5000`; check `http://localhost:5000/api/health`.
MongoDB is optional for starting the scaffold, but health reports that the API is not
ready for bookings until the database is connected. Provider-dependent endpoints
return explicit unavailable responses until their integrations are implemented.
The backend `.env` file is local-only; never commit populated credentials.

Quality checks:

```powershell
npm test
npm --prefix backend test
npm run lint
npm run build
```

## Environment configuration

Vite client variables are public and are included in the browser bundle. Never put passwords, signing keys, payment secrets, or other server credentials in a `VITE_*` variable.

- `VITE_API_BASE_URL`: backend API origin and base path.
- `VITE_SOCKET_URL`: Socket.IO service origin.
- `VITE_DEMO_MODE`: keep `true` until backend services have been implemented and verified; use `false` only against a configured backend.
- `VITE_MAPS_PROVIDER`: maps-provider identifier passed to location APIs.
- `VITE_MAPS_API_KEY`: optional browser maps key; if used, restrict it by site and permitted APIs. No map SDK is activated without an implementation and valid restricted key.
- `VITE_PAYMENT_PUBLIC_KEY`: gateway public identifier only. Gateway secrets stay on the backend.

Use `.env.development.example` for local work and `.env.production.example` as a deployment template. Copy the appropriate template to a local, ignored env file and supply actual URLs. Do not commit populated secrets or environment files.

## Integration boundary

The client expects an authenticated backend to own authorization, validation, rate limiting, service coverage, fare/rule configuration, matching, cancellations, payment verification/refunds, rewards, notifications, and audit records. Relevant request wrappers are under `src/services/`.

The API response shapes used by the current UI are intentionally explicit in its service calls: public booking configuration (`activeVehicleTypes`, `serviceZones`, `fareRules`, `paymentMethods`), location suggestions/coverage/routes, fare quote options, booking status and rider details, session/profile, payment status, and reward progress. Align the backend contract and validate every field server-side before enabling live mode.

Authentication uses credentialed API requests and expects secure, HttpOnly, SameSite cookies set by the backend. The frontend does not persist bearer tokens. Ride creation, matching retries, and payment initialization use idempotency keys; the backend must enforce them atomically. Socket.IO events are hints for UI updates, not authorization or booking confirmation.

## Demo and production status

Demo mode deliberately does not send booking, authentication, payment, SOS, or notification requests and does not invent rider/route/fare data. Some informational content and provider integrations remain incomplete. Live mode must not be enabled until the real services and their security controls are operational.

**This project is not production-ready.** Before deployment, complete and verify at minimum:

- Google Maps (or another provider) autocomplete, draggable pickup/drop pins, route/distance/time calculation, and service-zone validation.
- Backend matching eligibility, atomic rider assignment, timeout/retry and cancellation/interruption state handling.
- Server-managed configurable fare rules, bargain limits/expiry and immutable accepted fares.
- Secure OTP/session recovery, CSRF defenses for cookie-authenticated mutations, API rate limits, privacy consent, saved-address APIs and account deletion policy.
- Payment gateway integration, server-side webhook verification, refunds, receipt generation, duplicate-payment protection and reconciliation.
- Reward accrual/redemption ledger and anti-fraud controls; never reduce rider earnings for customer rewards.
- Notification provider delivery and preference management; no client-side delivery claims.
- Rider verification data, emergency contact workflows, trip-share access controls and an operational SOS/support response. SOS is not a replacement for emergency services.
- Automated integration/E2E tests for booking, rejection, timeout, cancellation, network loss, payment failure/refund, rewards and responsive/accessibility behavior; plus security, operational and applicable regulatory review.

No live booking, payment, location tracking, rider matching or notification should be represented as successful until confirmed by its backend/provider.
