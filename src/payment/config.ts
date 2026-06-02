import type { StripeCheckoutConfig } from './types';

export function getStripeCheckoutConfig(): StripeCheckoutConfig {
  return {
    createSessionUrl:
      import.meta.env.VITE_STRIPE_CHECKOUT_SESSION_URL ||
      '/api/payments/stripe/checkout-sessions',
    sessionStatusUrl:
      import.meta.env.VITE_STRIPE_CHECKOUT_STATUS_URL ||
      '/api/payments/stripe/checkout-sessions/{CHECKOUT_SESSION_ID}',
  };
}

