// Postal-code-to-address lookup, abstracted behind a small provider interface so a
// provider can be swapped or added without touching the billing-address form. Both
// providers below are free, require no API key, and impose no recurring cost — see
// CLAUDE.md-adjacent audit notes on why these were chosen over a paid provider.
//
// This is a UX convenience only, never a validation boundary: a failed or unsupported
// lookup must never block manual entry — every caller treats a non-"ok" result as "just
// let the visitor type the address in by hand."

export type PartialAddress = {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type PostalLookupResult =
  | { ok: true; address: PartialAddress }
  | { ok: false; reason: "not_found" | "unsupported_country" | "error" };

export type PostalLookupProvider = {
  supports(countryCode: string): boolean;
  lookup(postalCode: string, countryCode: string): Promise<PostalLookupResult>;
};

const lookupTimeoutMs = 5_000;

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Brazil (CEP) via ViaCEP — free, no key, no signup, and gives full street/neighborhood
// detail, a very expected UX for a Brazilian postal code given pt-BR is one of this
// app's three supported locales.
export const viaCepProvider: PostalLookupProvider = {
  supports(countryCode) {
    return countryCode.toUpperCase() === "BR";
  },

  async lookup(postalCode) {
    const cep = sanitizeDigits(postalCode);

    if (cep.length !== 8) {
      return { ok: false, reason: "not_found" };
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: AbortSignal.timeout(lookupTimeoutMs),
      });

      if (!response.ok) {
        return { ok: false, reason: "error" };
      }

      const payload = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      // ViaCEP's own "not found" signal is a 200 response with { erro: true }, not a
      // non-2xx status.
      if (payload.erro) {
        return { ok: false, reason: "not_found" };
      }

      return {
        ok: true,
        address: {
          street: payload.logradouro || undefined,
          neighborhood: payload.bairro || undefined,
          city: payload.localidade || undefined,
          state: payload.uf || undefined,
        },
      };
    } catch {
      return { ok: false, reason: "error" };
    }
  },
};

// Generic international fallback via Zippopotam.us — free, no key, no signup, broad
// country coverage. Only resolves city/state from a postal code (no street-level detail
// — most countries don't have a free public API for that), which is still a genuinely
// useful partial autofill; street/number/complement stay manual everywhere outside
// Brazil.
export const zippopotamProvider: PostalLookupProvider = {
  supports() {
    // Deliberately permissive — an unsupported/unknown country simply gets a "not
    // found" result from the API itself (or a network error), both of which already
    // fall back to manual entry.
    return true;
  },

  async lookup(postalCode, countryCode) {
    const trimmedPostalCode = postalCode.trim();

    if (!trimmedPostalCode) {
      return { ok: false, reason: "not_found" };
    }

    try {
      const response = await fetch(
        `https://api.zippopotam.us/${encodeURIComponent(countryCode.toLowerCase())}/${encodeURIComponent(trimmedPostalCode)}`,
        { signal: AbortSignal.timeout(lookupTimeoutMs) },
      );

      if (response.status === 404) {
        return { ok: false, reason: "not_found" };
      }

      if (!response.ok) {
        return { ok: false, reason: "error" };
      }

      const payload = (await response.json()) as {
        places?: Array<{ "place name"?: string; state?: string }>;
      };
      const place = payload.places?.[0];

      if (!place) {
        return { ok: false, reason: "not_found" };
      }

      return {
        ok: true,
        address: {
          city: place["place name"] || undefined,
          state: place.state || undefined,
        },
      };
    } catch {
      return { ok: false, reason: "error" };
    }
  },
};

const providers: PostalLookupProvider[] = [viaCepProvider, zippopotamProvider];

// Picks the first provider that supports the given country and runs the lookup —
// viaCepProvider only claims BR, zippopotamProvider claims everything else (including BR
// as a never-reached fallback, since viaCepProvider is checked first), so callers never
// need to know which provider actually served the request.
export async function lookupPostalAddress(
  postalCode: string,
  countryCode: string,
): Promise<PostalLookupResult> {
  const provider = providers.find((candidate) => candidate.supports(countryCode));

  if (!provider) {
    return { ok: false, reason: "unsupported_country" };
  }

  return provider.lookup(postalCode, countryCode);
}
