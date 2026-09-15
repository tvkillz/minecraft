# Invoice email + PDF — proposed architecture

**Status:** implemented in `sendmail/` + `commerce` `fulfillInternalOrder`.

Goal: on successful payment (starting with admin **Payment success (test)** on checkout), email the player a **portal-styled HTML message** with a **PDF invoice** attached. Use the same test company data already in legal/footer content. No Stripe; hook into internal fulfillment only.

---

## Trigger point

Today, paid orders are finalized in the commerce edge function:

```
checkout_test (outcome: success)  →  fulfillInternalOrder()
checkout_pay (future gateway)     →  fulfillInternalOrder()   [when integrated]
```

`fulfillInternalOrder` sets `status: 'paid'` and stamps `receipt_sent_at` immediately — **before any email is sent**. When implementing invoices:

1. Fulfill order (credits, inventory) first — do not roll back on mail failure.
2. Call invoice sender **after** `status === 'paid'`.
3. Set `receipt_sent_at` **only after** sendmail confirms delivery (idempotent: skip if already set).

Do **not** send from the browser success page — the user can close the tab; fulfillment is server-side.

---

## Data available at send time

### From `orders` + `order_items`

| Field | Source |
|-------|--------|
| Invoice / order number | `orders.id` (UUID; can format short ref later) |
| Date | `orders.updated_at` when paid |
| Line description | `order_items.title_snapshot` (e.g. credit pack title) |
| Quantity | credits amount or `order_items.quantity` |
| Unit / total | `order_items.unit_price_cents`, `orders.total_cents` |
| Currency | `orders.currency` |
| VAT | Currently same as total (`vatCents` on checkout UI) |
| Recipient email | `orders.receipt_email` (set at `checkout_init` from user display email) |

### From `user_billing_profiles` (saved on checkout)

Required on checkout before pay/test:

- `first_name`, `last_name`, `city`, `country`, `postal_code`

Optional:

- `address_line1`, `address_line2`, `state_province`, `phone`

### Seller (test company) — from content pack

Compiled into `appConfig.descriptions.footer.contact` from `projects/{id}/copy/footer.json`:

```json
{
  "companyName": "Test LTD",
  "companyNumber": "00000000",
  "address": "123 Example Street, Testville, TE1 1ST, United Kingdom",
  "email": "support@voidborn.fun"
}
```

**Recommendation:** pass seller block from edge function env (mirroring footer.json) so PDF generation does not depend on the frontend bundle. Example env on `functions` service:

```env
INVOICE_COMPANY_NAME=Test LTD
INVOICE_COMPANY_NUMBER=00000000
INVOICE_COMPANY_ADDRESS=123 Example Street, Testville, TE1 1ST, United Kingdom
INVOICE_COMPANY_EMAIL=support@voidborn.fun
```

Keep values in sync with `footer.json` when legal copy changes.

---

## Recommended split of responsibilities

```
┌─────────────────────┐     POST /invoice      ┌──────────────────────┐
│ commerce edge fn    │ ──────────────────────►│ sendmail (VPS, Node) │
│ fulfillInternalOrder│   Bearer MAIL_API_KEY  │                      │
│  - load order       │   JSON payload         │  - renderPortalEmail │
│  - load billing     │                        │  - pdfkit PDF        │
│  - load user email  │ ◄──────────────────────│  - nodemailer SMTP   │
└─────────────────────┘     { success, id }    └──────────────────────┘
```

| Layer | Responsibility |
|-------|----------------|
| **commerce** (`fulfillInternalOrder`) | Service-role DB reads; build structured invoice payload; call sendmail; update `receipt_sent_at` on success |
| **sendmail** | Auth (`MAIL_API_KEY`); HTML body via existing `renderPortalEmail()`; PDF via **pdfkit**; SMTP send with attachment |

**Why PDF in sendmail, not Deno:** Node already has nodemailer + attachment support; pdfkit is lightweight and fits the VPS relay. Edge functions should not open SMTP.

**Why not give sendmail DB access:** Keeps relay stateless; commerce already has service role.

---

## New sendmail endpoint (proposed)

`POST /invoice` (Bearer `MAIL_API_KEY`) — dedicated route, not raw HTML from clients.

**Request body (example):**

```json
{
  "recipient": "player@example.com",
  "order": {
    "id": "uuid",
    "paidAt": "2026-06-30T12:00:00.000Z",
    "totalCents": 1000,
    "currency": "eur",
    "creditsGranted": 1000
  },
  "lineItems": [
    { "title": "VOIDBORN Credits", "quantity": 1000, "unitPriceCents": 1000 }
  ],
  "buyer": {
    "firstName": "Ada",
    "lastName": "Lovelace",
    "addressLine1": "",
    "city": "London",
    "postalCode": "SW1A 1AA",
    "country": "United Kingdom"
  },
  "seller": {
    "companyName": "Test LTD",
    "companyNumber": "00000000",
    "address": "123 Example Street, Testville, TE1 1ST, United Kingdom",
    "email": "support@voidborn.fun"
  }
}
```

**Response:** `{ "success": true, "messageId": "..." }`

Reuse `POST /send` attachment shape internally:

```json
{
  "filename": "VOIDBORN-invoice-{orderId-short}.pdf",
  "content": "<base64>",
  "encoding": "base64"
}
```

---

## Email design (site styling)

Reuse `sendmail/src/lib/emailTemplate.js`:

- `renderPortalEmail()` — dark portal palette, gold accents, bundled wordmark (same as auth emails)
- **Subject:** `Your VOIDBORN invoice — Order {shortId}`
- **Body:** short confirmation + order summary table (item, credits, total incl. VAT)
- **CTA:** link to `/portal/transactions` or market
- **Footer:** support email from seller block

PDF should mirror the same facts (not necessarily pixel-identical to HTML) with a clean A4 layout:

1. Seller block (Test LTD, company number, address)
2. Invoice number + date
3. Buyer block (name, address lines present)
4. Line table
5. Total incl. VAT
6. Payment method note: `Test payment` today; `Card via {gateway}` when supplier is connected

---

## Testing before payment supplier

1. Admin signs in, opens checkout with a credit pack.
2. Fills required billing fields (validated on Pay and **Payment success (test)**).
3. Clicks **Payment success (test)** → `checkout_test` → `fulfillInternalOrder` → `sendOrderInvoice`.
4. Verify:
   - Order `paid`, credits applied
   - Email received with PDF
   - `receipt_sent_at` set once
   - Repeat webhook/test does not duplicate email (`receipt_sent_at` guard)

**Local sendmail dev:**

```bash
cd sendmail && npm run dev
# POST fixture to http://127.0.0.1:6001/invoice with MAIL_API_KEY
```

Point commerce `SENDMAIL_URL` at `https://voidborn.fun/api/sendmail`.

---

## Env vars summary

| Where | Variable |
|-------|----------|
| API VPS `functions` | `SENDMAIL_URL`, `MAIL_API_KEY`, `INVOICE_COMPANY_*` |
| sendmail VPS | existing `SMTP_*`, `MAIL_API_KEY`, optional `MAIL_BRAND_NAME`, `SITE_URL` |

---

## Out of scope (for now)

- `purchase_with_credits` / market credit buys (no `orders` row today)
- Stripe / `stripe-webhook` (deprecated for this project)
- Generating PDF in the browser

---

## Implementation checklist

- [x] `sendmail`: `invoiceController.js`, `invoicePdf.js`, `invoiceEmail.js`, `invoicePayload.js`, route in `app.js`, `pdfkit` dependency
- [x] `commerce`: `sendOrderInvoice()`; `checkout_test` returns `invoiceSent`
- [ ] `backend/.env`: `SENDMAIL_URL`, `MAIL_API_KEY`, `INVOICE_COMPANY_*`
- [ ] API VPS: `docker compose up -d functions --force-recreate`
- [ ] Frontend VPS: `npm install` in sendmail + pm2 restart
- [ ] Demo: admin **Payment success (test)** on checkout
