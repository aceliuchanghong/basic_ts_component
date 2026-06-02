export type CheckoutMode = 'payment' | 'subscription';

export interface CheckoutLineItem {
  priceId: string;
  quantity?: number;
}

export interface CreateCheckoutSessionRequest {
  items: CheckoutLineItem[];
  mode?: CheckoutMode;
  referenceId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export type CheckoutSessionStatus = 'open' | 'complete' | 'expired';
export type CheckoutPaymentStatus = 'paid' | 'unpaid' | 'no_payment_required';

export interface CheckoutSessionDetails {
  sessionId: string;
  status: CheckoutSessionStatus;
  paymentStatus: CheckoutPaymentStatus;
  referenceId?: string;
}

export interface StripeCheckoutConfig {
  createSessionUrl: string;
  sessionStatusUrl?: string;
  allowedCheckoutHosts?: string[];
  credentials?: RequestCredentials;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  fetcher?: typeof fetch;
}

export interface PaymentProvider {
  createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CheckoutSession>;
  redirectToCheckout(request: CreateCheckoutSessionRequest): Promise<CheckoutSession>;
  getCheckoutSession(sessionId: string): Promise<CheckoutSessionDetails>;
}

