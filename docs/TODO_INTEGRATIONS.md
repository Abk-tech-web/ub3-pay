# Integration TODOs

Everything below is a real, signed-partnership integration point — not
something to self-implement. Each links to the mock file standing in for
it today.

| Area | Provider options | Mock file | What's needed to go live |
|---|---|---|---|
| Auth (Google OAuth) | Firebase Auth | `src/services/authService.js` | Firebase project + OAuth consent screen |
| Transactional email | SendGrid / Postmark / SES | `src/services/emailService.js` | Verified sending domain, SPF/DKIM/DMARC records |
| KYC (BVN + doc + liveness) | Smile ID / VerifyMe / Prembly | `src/services/kycService.js` | Signed vendor agreement, sandbox → production keys |
| Virtual Naira account (BaaS) | Paystack / Flutterwave / Monnify | `src/services/baasService.js` | Signed BaaS agreement, webhook endpoint + signature verification |
| Blockchain key management | Fireblocks / Coinbase MPC / self-hosted MPC | `src/services/walletService.js` | Provider account, policy engine setup — see README "Key management" |
| Per-chain RPC/indexing | Infura/Alchemy/QuickNode (EVM), native RPCs elsewhere | `src/services/chains/*.js` | RPC API keys per chain |
| Price/rate data | CoinGecko / Binance | `src/services/rateService.js` | API key (CoinGecko free tier works for low volume) |
| VTU (Airtime/Data, future) | VTpass / ClubKonnect | `src/screens/comingsoon/AirtimeDataScreen.js` | Vendor account — screen is UI-complete, unwired |
| Error tracking | Sentry | not yet added | Sentry DSN in `.env` |

Search the codebase for `TODO(integration)` to find every call site.
