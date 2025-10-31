# @flux402/sdk (MVP)
Minimal client that handles 402 → pay → retry. The default `buildPaymentPayload` produces a demo header
(base64 of `{"ref": "<uuid>"}`) to work with the demo Verifier.

```ts
import { FluxClient } from "@flux402/sdk";
const flux = new FluxClient({ baseUrl: "http://localhost:8787" });
const res = await flux.fetch("/api/protected");
console.log(await res.json());
