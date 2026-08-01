"use client";

import { useEffect, useRef, useState } from "react";

import { countryCodes, getCountryDisplayName, isCountryCode } from "@/lib/countries";
import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { lookupPostalAddress } from "@/lib/postal-lookup";

type Dictionary = ReturnType<typeof getDictionary>;

type BillingAddressFormProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type AddressResponse = {
  ok: boolean;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  } | null;
  error?: { code?: string };
};

type LookupStatus = "idle" | "loading" | "success" | "not_found" | "error";

const debounceMs = 500;
// Generous but bounded — matches the kind of ceilings Stripe's own Address object
// tolerates, just enough to stop a pasted essay from being submitted as a street name.
const MAX_POSTAL_CODE_LENGTH = 20;
const MAX_ADDRESS_LINE_LENGTH = 200;
const MAX_HOUSE_NUMBER_LENGTH = 20;
const MAX_CITY_LENGTH = 100;
const MAX_REGION_LENGTH = 100;

function defaultCountryForLocale(locale: Locale): string {
  if (locale === "pt-BR") {
    return "BR";
  }

  if (locale === "es") {
    return "ES";
  }

  return "US";
}

// Postal-code autofill is a UX convenience only (see postal-lookup.ts) — every field it
// can fill stays a normal editable input, manual entry always works even if the lookup
// never runs or fails, and a field the visitor has already typed into is never silently
// overwritten by a later lookup result.
export function BillingAddressForm({ dictionary, locale }: BillingAddressFormProps) {
  const copy = dictionary.dashboard.billingAddress;
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState(() => defaultCountryForLocale(locale));
  const touchedFieldsRef = useRef(new Set<"street" | "city" | "state">());
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load the existing Stripe-stored address, if any, on mount.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/billing/address", { cache: "no-store" });
        const payload = (await response.json()) as AddressResponse;

        if (cancelled || !payload.ok || !payload.address) {
          return;
        }

        // Stripe only stores a two-line address (line1/line2), not separate
        // street/number fields — line1 is shown as-is in "street" rather than
        // attempting to parse a house number back out of it, which would risk
        // fabricating a split that wasn't actually there.
        setStreet(payload.address.line1);
        setComplement(payload.address.line2 ?? "");
        setCity(payload.address.city);
        setRegion(payload.address.state ?? "");
        setPostalCode(payload.address.postalCode);

        if (isCountryCode(payload.address.country)) {
          setCountry(payload.address.country);
        }
      } catch {
        // No existing address to prefill — the form just starts empty, which is a
        // perfectly normal state, not an error.
      } finally {
        if (!cancelled) {
          setIsLoadingAddress(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only ever runs once on mount — this is a one-time prefill, not a live sync.
  }, []);

  // Debounced postal-code lookup — re-runs when the postal code or country changes,
  // never fires on every keystroke. An empty postal code is handled at render time (see
  // lookupMessage below) rather than by setting state synchronously here for a path that
  // does no real async work.
  useEffect(() => {
    if (!postalCode.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLookupStatus("loading");

      void (async () => {
        const result = await lookupPostalAddress(postalCode, country);

        if (!result.ok) {
          setLookupStatus(result.reason === "not_found" ? "not_found" : "error");
          return;
        }

        setLookupStatus("success");

        const touched = touchedFieldsRef.current;

        if (!touched.has("street") && result.address.street) {
          setStreet(result.address.street);
        }

        if (!touched.has("city") && result.address.city) {
          setCity(result.address.city);
        }

        if (!touched.has("state") && result.address.state) {
          setRegion(result.address.state);
        }
      })();
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [postalCode, country]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/billing/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line1: number ? `${street}, ${number}` : street,
          line2: complement || undefined,
          city,
          state: region || undefined,
          postalCode,
          country,
        }),
      });
      const payload = (await response.json()) as AddressResponse;

      if (!response.ok || !payload.ok) {
        setSaveError(
          payload.error?.code === "billing_not_configured" ? copy.notConfiguredMessage : copy.errorMessage,
        );
        return;
      }

      setSaveSuccess(true);
    } catch {
      setSaveError(copy.errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  // An empty postal code never shows a lookup message, regardless of whatever
  // lookupStatus was left over from a previous, now-cleared value.
  const lookupMessage = !postalCode.trim()
    ? null
    : lookupStatus === "loading"
      ? copy.lookupLoadingLabel
      : lookupStatus === "success"
        ? copy.lookupSuccessLabel
        : lookupStatus === "not_found"
          ? copy.lookupNotFoundLabel
          : lookupStatus === "error"
            ? copy.lookupErrorLabel
            : null;

  return (
    <form className="settings-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2 className="dashboard-card__title">{copy.title}</h2>
      <p className="settings-form__note">{copy.description}</p>

      <div className="auth-field">
        <label htmlFor="billing-postal-code">{copy.postalCodeLabel}</label>
        <input
          disabled={isLoadingAddress}
          id="billing-postal-code"
          maxLength={MAX_POSTAL_CODE_LENGTH}
          onChange={(event) => setPostalCode(event.target.value)}
          placeholder={copy.postalCodePlaceholder}
          type="text"
          value={postalCode}
        />
      </div>

      {lookupMessage ? (
        <p className="settings-form__note" role="status">
          {lookupMessage}
        </p>
      ) : null}

      <div className="auth-field">
        <label htmlFor="billing-country">{copy.countryLabel}</label>
        <select
          disabled={isLoadingAddress}
          id="billing-country"
          onChange={(event) => setCountry(event.target.value)}
          value={country}
        >
          {countryCodes.map((code) => (
            <option key={code} value={code}>
              {getCountryDisplayName(code, locale)}
            </option>
          ))}
        </select>
      </div>

      <div className="auth-field">
        <label htmlFor="billing-street">{copy.streetLabel}</label>
        <input
          disabled={isLoadingAddress}
          id="billing-street"
          maxLength={MAX_ADDRESS_LINE_LENGTH}
          onChange={(event) => {
            touchedFieldsRef.current.add("street");
            setStreet(event.target.value);
          }}
          placeholder={copy.streetPlaceholder}
          type="text"
          value={street}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="billing-number">{copy.numberLabel}</label>
        <input
          disabled={isLoadingAddress}
          id="billing-number"
          maxLength={MAX_HOUSE_NUMBER_LENGTH}
          onChange={(event) => setNumber(event.target.value)}
          placeholder={copy.numberPlaceholder}
          type="text"
          value={number}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="billing-complement">{copy.complementLabel}</label>
        <input
          disabled={isLoadingAddress}
          id="billing-complement"
          maxLength={MAX_ADDRESS_LINE_LENGTH}
          onChange={(event) => setComplement(event.target.value)}
          placeholder={copy.complementPlaceholder}
          type="text"
          value={complement}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="billing-city">{copy.cityLabel}</label>
        <input
          disabled={isLoadingAddress}
          id="billing-city"
          maxLength={MAX_CITY_LENGTH}
          onChange={(event) => {
            touchedFieldsRef.current.add("city");
            setCity(event.target.value);
          }}
          type="text"
          value={city}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="billing-state">{copy.stateLabel}</label>
        <input
          disabled={isLoadingAddress}
          id="billing-state"
          maxLength={MAX_REGION_LENGTH}
          onChange={(event) => {
            touchedFieldsRef.current.add("state");
            setRegion(event.target.value);
          }}
          type="text"
          value={region}
        />
      </div>

      {saveError ? (
        <p className="form-status__error" role="alert">
          {saveError}
        </p>
      ) : null}
      {saveSuccess ? (
        <p className="form-status__success" role="status">
          {copy.successMessage}
        </p>
      ) : null}

      <button className="button button--primary" disabled={isSaving || isLoadingAddress} type="submit">
        {isSaving ? copy.savingLabel : copy.saveLabel}
      </button>
    </form>
  );
}
