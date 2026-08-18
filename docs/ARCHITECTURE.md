# Architecture

## High-level

```
┌────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  React Native   │────▶│  Firebase Auth /      │────▶│  Cloud Functions /   │
│  (Expo) client   │     │  Firestore            │     │  Node/NestJS API     │
└────────────────┘     └──────────────────────┘     └─────────┬───────────┘
                                                                 │
                    ┌────────────────────────┬───────────────────┼───────────────────┐
                    ▼                        ▼                   ▼                   ▼
            ┌───────────────┐      ┌────────────────┐   ┌───────────────┐   ┌───────────────┐
            │ KYC vendor     │      │ BaaS / virtual  │   │ Wallet infra   │   │ Rate/price API │
            │ (Smile ID etc) │      │ account (Paystack)│   │ (Fireblocks/  │   │ (CoinGecko/    │
            │                │      │                 │   │  per-chain SDK)│   │  Binance)       │
            └───────────────┘      └────────────────┘   └───────────────┘   └───────────────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │ Email service  │
                                      │ (SendGrid etc) │
                                      └───────────────┘
```

## Client (this repo)

- **Navigation**: `AuthNavigator` (signed-out) → `KycNavigator` (signed-in,
  unverified) → `MainTabNavigator` (verified). Gate is driven by
  `AuthContext.user.kycStatus`.
- **State**: two React contexts — `AuthContext` (session, KYC status) and
  `WalletContext` (balances, selected chain, transaction cache). No Redux;
  the surface area doesn't need it yet.
- **Services layer**: every screen talks to `src/services/*`, never
  directly to Firebase or a third-party SDK. This is the seam where mocks
  get swapped for real integrations — screens don't change.

## Backend (not in this repo — Cloud Functions / NestJS)

Recommended split into queue-based workers so nothing blocks on a
third-party webhook:

- `auth-service` — Firebase Auth wrapper, OTP issuance/verification via the
  email service (not Firebase's default mailer).
- `kyc-service` — receives KYC vendor webhooks, updates Firestore, enforces
  one-verified-identity-per-user via BVN/NIN hash cross-check.
- `baas-service` — provisions virtual accounts on KYC approval, consumes
  deposit webhooks, credits NGN balance idempotently (dedupe by provider
  transaction reference).
- `swap-service` — executes Swap 1 / Swap 2, pulls rate from
  `rate-service`, applies configurable margin, writes an immutable
  transaction record before touching any balance.
- `wallet-service` — address generation, balance polling/websocket
  subscription per chain, withdrawal broadcasting via wallet-infra
  provider.
- `rate-service` — caches CoinGecko/Binance prices, short TTL, single
  source of truth so swap and portfolio views never disagree.
- `notification-service` — transaction alerts, KYC status changes, all
  routed through the custom email service with SPF/DKIM/DMARC configured
  on the sending domain.

All of the above are idempotent by design: every mutating operation keys
off a client-generated idempotency token or the provider's own transaction
reference, so retries can't double-credit or double-charge.

## Chain/token registry

`src/config/chains.js` is a data-driven registry, not a switch statement —
adding a 16th chain means adding an entry, not touching every screen. Each
entry declares its adapter (`src/services/chains/*`), its native asset,
and which stablecoins it supports.
