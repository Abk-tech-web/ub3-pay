# Ub3 Pay

Multi-chain crypto wallet + Naira exchange + KYC-gated on/off-ramp super-app.
React Native (Expo), mobile-first, dark-mode-first.

> **Status:** architecture + UI scaffold. Blockchain, KYC, BaaS, and email
> integrations are stubbed with mock data and marked `// TODO(integration)`
> — see `docs/TODO_INTEGRATIONS.md`. Nothing in this repo talks to a real
> bank, blockchain node, or KYC vendor yet; wiring those up requires signed
> agreements with licensed providers (see the note at the bottom of this file).

## Folder structure

```
ub3-pay/
├─ App.js                     entry point, wraps navigation + providers
├─ src/
│  ├─ config/                 chain/token registry, theme tokens
│  ├─ navigation/              stack + bottom-tab navigators
│  ├─ screens/                 one folder per flow (auth, kyc, home, wallet,
│  │                            swap, buysell, naira, activity, profile,
│  │                            comingsoon)
│  ├─ components/               shared UI primitives
│  ├─ services/                 API-facing modules (mocked, see below)
│  │  └─ chains/                 per-chain address/balance adapters
│  ├─ context/                  Auth + Wallet React context
│  └─ utils/                    formatters, validators
├─ landing-page/                standalone marketing site (plain HTML/CSS/JS)
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DATA_MODELS.md
│  └─ TODO_INTEGRATIONS.md
├─ .env.example
└─ package.json
```

## Running it

```bash
npm install
cp .env.example .env      # fill in your own keys — never commit this file
npm start                 # opens Expo dev tools
```

Requires Node 18+, Expo CLI (`npm i -g expo-cli` optional — `npx expo` works
without a global install), and either an Android emulator, iOS simulator
(Mac only), or the Expo Go app on a physical device.

## Environment variables

All required keys are listed in `.env.example` with no real values filled
in. Categories:

- **Firebase** — auth + Firestore data store
- **Email** — SendGrid/Postmark/SES for OTP, password reset, KYC status,
  transaction alerts, sent under the Ub3 Pay name/domain (never Firebase's
  default sender)
- **KYC** — a licensed identity verification vendor (Smile ID / VerifyMe /
  Prembly), BVN + document + liveness checks
- **BaaS** — virtual Naira account issuance (Paystack / Flutterwave /
  Monnify)
- **Rates** — CoinGecko / Binance for live pricing
- **Blockchain RPC** — one endpoint per chain (Infura/Alchemy-style for EVM
  chains, or a wallet-infra provider like Fireblocks/Coinbase MPC for
  managed key custody)
- **VTU** — future-phase airtime/data aggregator

**Never** put real values in a chat, a screenshot, or a commit. Copy
`.env.example` to `.env` locally and fill it in yourself; `.env` is already
git-ignored.

## Key management

Section 2 of the product spec calls for MPC/HSM-backed key management
rather than storing raw seed phrases server-side, even encrypted. This
scaffold does **not** implement key custody — `src/services/walletService.js`
is a mock. Before going further, pick one of:

- **Managed MPC** (Fireblocks, Coinbase MPC Wallet API) — fastest to ship,
  provider holds key shards, you never touch raw keys. Best fit given this
  app also custodies fiat and handles KYC.
- **Self-hosted MPC/HSM** — full control, significant security-engineering
  and compliance overhead; only worth it at scale with a dedicated security
  team.
- **Non-custodial (seed lives only on-device)** — simplest legally, but
  conflicts with the "buy crypto with NGN into an in-app wallet" flow as
  specified, since the app would need to sign on the user's behalf.

## A note on licensing

BVN/KYC verification, virtual Naira account issuance, and holding customer
fiat/crypto balances are regulated activities in Nigeria — this generally
requires SEC registration as a Virtual Asset Service Provider and/or a
partnership with a CBN-licensed institution for the banking/BVN pieces.
This repo is structured so the code is ready to plug into licensed
providers, but the actual BVN/virtual-account access itself has to come
through those providers (Smile ID, Paystack, etc.), not something built
in-house. Sort that out in parallel with development, not after.
