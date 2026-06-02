import type {
  CheckoutSession,
  CheckoutSessionDetails,
  CreateCheckoutSessionRequest,
  PaymentProvider,
  StripeCheckoutConfig,
} from '../types';

const DEFAULT_CHECKOUT_HOSTS = ['checkout.stripe.com'];
const SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}';

export class PaymentError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'PaymentError';
    this.status = status;
  }
}

export class StripeCheckoutProvider implements PaymentProvider {
  private readonly config: StripeCheckoutConfig;
  private readonly fetcher: typeof fetch;

  constructor(config: StripeCheckoutConfig) {
    if (!config.createSessionUrl) {
      throw new PaymentError('Stripe Checkout session endpoint is required');
    }

    if (!config.fetcher && typeof fetch === 'undefined') {
      throw new PaymentError('A fetch implementation is required');
    }

    this.config = config;
    this.fetcher = config.fetcher || fetch.bind(globalThis);
  }

  async createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<CheckoutSession> {
    this.validateRequest(request);

    const payload = await this.requestJson<CheckoutSession>(
      this.config.createSessionUrl,
      {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          mode: request.mode || 'payment',
        }),
      }
    );

    if (!payload.sessionId || !payload.url) {
      throw new PaymentError('Payment API returned an invalid Checkout Session');
    }

    this.validateCheckoutUrl(payload.url);
    return payload;
  }

  async redirectToCheckout(
    request: CreateCheckoutSessionRequest
  ): Promise<CheckoutSession> {
    const session = await this.createCheckoutSession(request);

    if (typeof window === 'undefined') {
      throw new PaymentError('Stripe Checkout redirect requires a browser');
    }

    window.location.assign(session.url);
    return session;
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSessionDetails> {
    if (!sessionId) {
      throw new PaymentError('Checkout Session ID is required');
    }

    if (!this.config.sessionStatusUrl) {
      throw new PaymentError('Stripe Checkout status endpoint is not configured');
    }

    const url = this.config.sessionStatusUrl.replace(
      SESSION_ID_PLACEHOLDER,
      encodeURIComponent(sessionId)
    );

    if (url === this.config.sessionStatusUrl) {
      throw new PaymentError(
        `Stripe Checkout status endpoint must contain ${SESSION_ID_PLACEHOLDER}`
      );
    }

    const payload = await this.requestJson<CheckoutSessionDetails>(url);

    if (!payload.sessionId || !payload.status || !payload.paymentStatus) {
      throw new PaymentError('Payment API returned an invalid Checkout Session status');
    }

    return payload;
  }

  private async requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(await this.config.getHeaders?.());
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await this.fetcher(url, {
        ...init,
        credentials: this.config.credentials || 'same-origin',
        headers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      throw new PaymentError(`Payment API request failed: ${message}`);
    }

    const payload = await this.parseJson(response);
    if (!response.ok) {
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : `Payment API request failed with status ${response.status}`;
      throw new PaymentError(message, response.status);
    }

    return payload as T;
  }

  private async parseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new PaymentError('Payment API returned invalid JSON', response.status);
    }
  }

  private validateRequest(request: CreateCheckoutSessionRequest): void {
    if (!Array.isArray(request.items) || !request.items.length) {
      throw new PaymentError('At least one Checkout line item is required');
    }

    request.items.forEach((item) => {
      if (!item.priceId) {
        throw new PaymentError('Each Checkout line item requires a Stripe Price ID');
      }

      if (
        item.quantity !== undefined &&
        (!Number.isInteger(item.quantity) || item.quantity < 1)
      ) {
        throw new PaymentError('Checkout line item quantity must be a positive integer');
      }
    });
  }

  private validateCheckoutUrl(url: string): void {
    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(url);
    } catch {
      throw new PaymentError('Payment API returned an invalid Checkout URL');
    }

    const allowedHosts = (this.config.allowedCheckoutHosts || DEFAULT_CHECKOUT_HOSTS).map(
      (host) => host.toLowerCase()
    );
    if (
      checkoutUrl.protocol !== 'https:' ||
      !allowedHosts.includes(checkoutUrl.hostname.toLowerCase())
    ) {
      throw new PaymentError('Payment API returned an untrusted Checkout URL');
    }
  }
}
