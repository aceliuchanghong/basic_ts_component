# Stripe Checkout payment component

This module uses Stripe-hosted Checkout. The browser requests a Checkout Session
from your backend and redirects to the URL returned by Stripe. It supports
one-time payments and subscriptions without exposing a Stripe secret key in the
browser.

## Browser usage

```ts
import {
  createPayment,
  getStripeCheckoutConfig,
} from './src/payment';

const payment = createPayment({
  ...getStripeCheckoutConfig(),
  getHeaders: async () => ({
    Authorization: `Bearer ${await getCurrentUserToken()}`,
  }),
});

await payment.redirectToCheckout({
  mode: 'payment',
  referenceId: 'order_123',
  items: [{ priceId: 'price_basic', quantity: 1 }],
});
```

For subscriptions, use `mode: 'subscription'`. After Stripe redirects to your
success page, you can display the current status:

```ts
const sessionId = new URLSearchParams(window.location.search).get('session_id');
if (sessionId) {
  const session = await payment.getCheckoutSession(sessionId);
  console.log(session.paymentStatus);
}
```

The success page is only informational. Grant products or subscription access
from a verified Stripe webhook, not from a browser redirect.

## Backend contract

The browser component expects these routes:

```text
POST /api/payments/stripe/checkout-sessions
GET  /api/payments/stripe/checkout-sessions/:sessionId
```

The create request and response use JSON:

```json
{
  "mode": "payment",
  "referenceId": "order_123",
  "items": [{ "priceId": "price_basic", "quantity": 1 }]
}
```

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

The status response uses JSON:

```json
{
  "sessionId": "cs_test_...",
  "status": "complete",
  "paymentStatus": "paid",
  "referenceId": "order_123"
}
```

## Backend requirements

Create Checkout Sessions with the Stripe SDK on your server:

```ts
const session = await stripe.checkout.sessions.create(
  {
    mode: request.mode,
    line_items: request.items.map((item) => ({
      price: resolveAllowedStripePrice(item.priceId),
      quantity: item.quantity ?? 1,
    })),
    client_reference_id: order.id,
    success_url: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/payment-cancelled`,
  },
  { idempotencyKey: order.id }
);
```

The backend must:

- Authenticate the user before creating a Checkout Session.
- Authenticate status queries and ensure the Session belongs to the current
  user.
- Resolve each allowed product or Price ID on the server. Never accept arbitrary
  amounts, currencies, or product descriptions from the browser.
- Validate any browser-provided success and cancellation URLs against an allow
  list, or set them entirely on the server.
- Use an idempotency key derived from your order to avoid duplicate sessions.
- Verify the raw webhook request body with the `Stripe-Signature` header and
  your endpoint secret.
- Fulfill orders idempotently from `checkout.session.completed`. Handle the
  relevant subscription lifecycle events if subscriptions are enabled.
- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on the server only.

Webhook signature verification with the Stripe Node SDK:

```ts
const event = stripe.webhooks.constructEvent(
  rawRequestBody,
  request.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

If you use a Stripe custom Checkout domain, add that hostname through
`allowedCheckoutHosts` when creating the browser component.
