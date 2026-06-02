export type {
  CheckoutLineItem,
  CheckoutMode,
  CheckoutPaymentStatus,
  CheckoutSession,
  CheckoutSessionDetails,
  CheckoutSessionStatus,
  CreateCheckoutSessionRequest,
  PaymentProvider,
  StripeCheckoutConfig,
} from './types';

export { getStripeCheckoutConfig } from './config';
export { PaymentError, StripeCheckoutProvider } from './providers/StripeCheckoutProvider';

import type { StripeCheckoutConfig } from './types';
import { StripeCheckoutProvider } from './providers/StripeCheckoutProvider';

export function createPayment(config: StripeCheckoutConfig): StripeCheckoutProvider {
  return new StripeCheckoutProvider(config);
}

