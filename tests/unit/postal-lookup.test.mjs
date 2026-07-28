import assert from "node:assert/strict";
import test from "node:test";

import {
  lookupPostalAddress,
  viaCepProvider,
  zippopotamProvider,
} from "../../src/lib/postal-lookup.ts";

function withMockedFetch(handler, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;

  return run().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

test("provider selection: ViaCEP only claims Brazil, Zippopotam is the catch-all fallback", () => {
  assert.equal(viaCepProvider.supports("BR"), true);
  assert.equal(viaCepProvider.supports("br"), true);
  assert.equal(viaCepProvider.supports("US"), false);
  assert.equal(zippopotamProvider.supports("US"), true);
  assert.equal(zippopotamProvider.supports("XX"), true);
});

test("successful ViaCEP lookup returns full street-level address", async () => {
  await withMockedFetch(
    async (url) => {
      assert.match(String(url), /^https:\/\/viacep\.com\.br\/ws\/01310100\/json\/$/);
      return jsonResponse({
        cep: "01310-100",
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
        uf: "SP",
      });
    },
    async () => {
      const result = await lookupPostalAddress("01310-100", "BR");

      assert.equal(result.ok, true);
      assert.equal(result.address.street, "Avenida Paulista");
      assert.equal(result.address.neighborhood, "Bela Vista");
      assert.equal(result.address.city, "São Paulo");
      assert.equal(result.address.state, "SP");
    },
  );
});

test("ViaCEP's own not-found signal (200 + erro:true) maps to a not_found result, not a crash", async () => {
  await withMockedFetch(
    async () => jsonResponse({ erro: true }),
    async () => {
      const result = await lookupPostalAddress("00000-000", "BR");

      assert.equal(result.ok, false);
      assert.equal(result.reason, "not_found");
    },
  );
});

test("malformed CEP never reaches the network", async () => {
  await withMockedFetch(
    async () => {
      throw new Error("fetch should not be called for a malformed CEP");
    },
    async () => {
      const result = await lookupPostalAddress("abc", "BR");

      assert.equal(result.ok, false);
      assert.equal(result.reason, "not_found");
    },
  );
});

test("successful Zippopotam lookup returns city/state (no street-level detail)", async () => {
  await withMockedFetch(
    async (url) => {
      assert.match(String(url), /^https:\/\/api\.zippopotam\.us\/us\/90210$/);
      return jsonResponse({
        "post code": "90210",
        country: "United States",
        places: [{ "place name": "Beverly Hills", state: "California" }],
      });
    },
    async () => {
      const result = await lookupPostalAddress("90210", "US");

      assert.equal(result.ok, true);
      assert.equal(result.address.city, "Beverly Hills");
      assert.equal(result.address.state, "California");
      assert.equal(result.address.street, undefined);
    },
  );
});

test("Zippopotam 404 maps to not_found, never blocking manual entry", async () => {
  await withMockedFetch(
    async () => new Response(null, { status: 404 }),
    async () => {
      const result = await lookupPostalAddress("00000", "XX");

      assert.equal(result.ok, false);
      assert.equal(result.reason, "not_found");
    },
  );
});

test("provider errors (network failure, non-2xx/404) resolve to a safe error result, never throw", async () => {
  await withMockedFetch(
    async () => {
      throw new TypeError("network down");
    },
    async () => {
      const result = await lookupPostalAddress("12345", "US");

      assert.equal(result.ok, false);
      assert.equal(result.reason, "error");
    },
  );

  await withMockedFetch(
    async () => new Response(null, { status: 500 }),
    async () => {
      const result = await lookupPostalAddress("12345", "US");

      assert.equal(result.ok, false);
      assert.equal(result.reason, "error");
    },
  );
});
