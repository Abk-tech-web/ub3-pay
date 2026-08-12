# Data models (Firestore collections)

## `users/{uid}`
```
{
  uid: string,
  email: string,
  displayName: string,
  authProvider: "google" | "password",
  createdAt: timestamp,
  kycStatus: "unverified" | "pending" | "approved" | "rejected" | "manual_review",
  kycRecordId: string | null,       // → kyc_records/{id}
  nairaAccount: {                    // present once KYC approved
    accountNumber: string,
    bankName: string,
    provider: "paystack" | "flutterwave" | "monnify"
  } | null,
  security: {
    pinSet: boolean,
    biometricEnabled: boolean,
    totpEnabled: boolean
  },
  deviceFingerprints: string[]
}
```

## `kyc_records/{id}`
```
{
  uid: string,
  provider: "smile_id" | "verifyme" | "prembly",
  bvnVerified: boolean,
  documentType: "nin_slip" | "drivers_license" | "passport",
  documentVerified: boolean,
  livenessScore: number,
  identityHash: string,              // for duplicate-account cross-check
  status: "pending" | "approved" | "rejected" | "manual_review",
  reviewerNotes: string | null,
  createdAt: timestamp,
  decidedAt: timestamp | null
}
// PII (raw BVN, document images) is NOT stored here — only references to
// the vendor's own secured storage, plus derived flags. See vendor docs
// for their retention/encryption model before storing anything locally.
```

## `wallets/{uid}/assets/{chainId_tokenSymbol}`
```
{
  chainId: string,          // e.g. "ethereum", "solana", "tron"
  tokenSymbol: string,      // e.g. "USDT", "ETH"
  address: string,
  balance: string,          // stringified to avoid float precision issues
  usdValue: number,
  lastSyncedAt: timestamp
}
```

## `transactions/{id}`
```
{
  id: string,
  uid: string,
  type: "buy" | "sell" | "swap_crypto_to_ngn" | "swap_ngn_to_crypto"
      | "withdraw_crypto" | "withdraw_ngn" | "deposit_crypto" | "deposit_ngn",
  status: "pending" | "processing" | "completed" | "failed" | "reversed",
  chainId: string | null,
  tokenSymbol: string | null,
  amountCrypto: string | null,
  amountNgn: number | null,
  rate: number | null,
  feeNgn: number | null,
  feeCrypto: string | null,
  idempotencyKey: string,      // dedupe on retry — unique index
  providerReference: string | null,   // BaaS/blockchain tx hash
  createdAt: timestamp,
  completedAt: timestamp | null
}
```

## `naira_deposits/{id}`
```
{
  uid: string,
  amountNgn: number,
  providerReference: string,   // BaaS webhook transaction id — unique index
  status: "confirmed" | "reversed",
  receivedAt: timestamp
}
```

## `audit_log/{id}`
```
{
  actor: string,             // uid or "system:webhook_name"
  action: string,             // e.g. "kyc_record_viewed"
  targetUid: string | null,
  metadata: object,
  at: timestamp
}
// Every read/write touching kyc_records or raw PII should append here.
```
