export type Quote = {
  x402Version: "1";
  scheme: string;
  network: string;
  mint: string;
  payTo: string;
  amount: string;
  reference: string;
  description?: string;
  expiresAt: number;
  maxAmountRequired?: string;
  signature?: string;
};

export type FluxClientOptions = {
  baseUrl: string;
  buildPaymentPayload?: (quote: Quote) => Promise<string>;
  onQuote?: (quote: Quote) => Promise<void> | void;
  onPending?: (ref: string) => Promise<void> | void;
};

export class FluxClient {
  baseUrl: string;
  buildPaymentPayload: (q: Quote) => Promise<string>;
  onQuote?: (q: Quote) => Promise<void> | void;
  onPending?: (ref: string) => Promise<void> | void;

  constructor(o: FluxClientOptions) {
    this.baseUrl = o.baseUrl.replace(/\/$/, "");
    this.onQuote = o.onQuote;
    this.onPending = o.onPending;
    this.buildPaymentPayload =
      o.buildPaymentPayload ||
      (async (q) => Buffer.from(JSON.stringify({ ref: q.reference })).toString("base64"));
  }

  async fetch(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    let res = await fetch(url, init);

    if (res.status !== 402) return res;

    const quote = (await res.json()) as Quote;
    await this.onQuote?.(quote);

    const payment = await this.buildPaymentPayload(quote);

    // retry loop with pending handling
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const retry = await fetch(url, {
        ...init,
        headers: { ...(init?.headers || {}), "X-PAYMENT": payment }
      });

      if (retry.status === 409) {
        await this.onPending?.(quote.reference);
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      return retry;
    }
  }
}
