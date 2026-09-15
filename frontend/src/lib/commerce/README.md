# Commerce API (transactional store)

Payments run on **Supabase Edge Functions**, not Next.js API routes.

**There is no Stripe in this project.** Checkout is internal (`checkout_init` → `checkout_pay`) with admin test buttons until an external payment gateway is connected.

## Flow

```
User → checkout_init → billing form → checkout_pay (gateway TBD)
  OR admin checkout_test (success) → fulfillInternalOrder
  → wallet_apply_credits → order paid → receipt_sent_at → (invoice email — see INVOICE.md)
```

## Client

```ts
import { invokeCommerceAction } from '@/lib/commerce/api'

await invokeCommerceAction({ type: 'checkout_init', customCredits: 1000, currency: 'eur' })
```

Base URL: `POST ${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/commerce`

## Actions (checkout)

| Action | Purpose |
|--------|---------|
| `checkout_init` | Create pending order from pack / custom credits |
| `checkout_get` | Load existing order |
| `checkout_pay` | Start payment (gateway placeholder) |
| `checkout_test` | Admin only — simulate success or failure |

## Other actions

| Spec | Implementation |
|------|----------------|
| `GET /products` | `{ type: 'products_list' }` |
| `GET /wallet` | `{ type: 'wallet_get' }` |
| `GET /wallet/transactions` | `{ type: 'transactions_list' }` |
| `POST /store/purchase` | `{ type: 'purchase_with_credits', productId }` |
| `POST /market/buy` | `{ type: 'buy_card_with_credits', cardId }` |
| `POST /withdrawals/create` | `{ type: 'withdrawal_create' }` |
| Admin | `admin_transactions`, `admin_products_upsert` |

## Testing checkout (before payment supplier)

1. Sign in as admin.
2. Open checkout (e.g. purchase credits → checkout).
3. Fill required billing fields (first name, last name, city, country, postal code).
4. Use **Payment success (test)** — fulfills order and sends invoice email (PDF) when `SENDMAIL_URL` + `MAIL_API_KEY` are set on the API VPS.

## Deploy

1. Apply commerce SQL on the API VPS database if not already applied.
2. Set `SITE_URL` on the `functions` service.
3. Redeploy the `commerce` edge function after backend changes.

See [INVOICE.md](./INVOICE.md) for planned PDF invoice + email architecture.
