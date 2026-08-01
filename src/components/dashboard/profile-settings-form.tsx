"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { getDictionary } from "@/i18n/dictionaries";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";
import { MAX_NAME_LENGTH } from "@/lib/auth-validation";

type Dictionary = ReturnType<typeof getDictionary>;

type ProfileSettingsFormProps = {
  dictionary: Dictionary;
  initialName: string;
  email: string;
};

// The only field this app can safely update today: the user table's `name` (see
// db/schema.ts) is a plain editable column with no verification requirement. Email is
// deliberately read-only — Better Auth's real changeEmail flow requires re-verifying the
// new address, and email verification is an explicit future milestone, out of scope
// here. Showing a working-looking email field that silently didn't persist would be
// exactly the "fake settings that do nothing" this page must avoid, so it's a plain,
// disabled input with an explanatory note instead.
export function ProfileSettingsForm({ dictionary, initialName, email }: ProfileSettingsFormProps) {
  const copy = dictionary.dashboard.settings.profile;
  const authCopy = dictionary.auth;
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(authCopy.validation.nameRequired);
      setSuccess(false);
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(authCopy.validation.nameTooLong);
      setSuccess(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await authClient.updateUser({ name: trimmedName });

    setIsSaving(false);

    if (updateError) {
      setError(mapAuthErrorCode(updateError.code, authCopy.errors));
      return;
    }

    setSuccess(true);
    // The page itself is server-rendered with the name read at request time (e.g. the
    // dashboard welcome greeting, the account menu's "signed in as") — refresh so it
    // reflects the change immediately instead of only updating this form's own local
    // state.
    router.refresh();
  }

  return (
    <form className="settings-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2 className="dashboard-card__title">{copy.title}</h2>
      <div className="auth-field">
        <label htmlFor="settings-name">{copy.nameLabel}</label>
        <input
          autoComplete="name"
          id="settings-name"
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => {
            setName(event.target.value);
            setSuccess(false);
          }}
          placeholder={copy.namePlaceholder}
          type="text"
          value={name}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="settings-email">{copy.emailLabel}</label>
        <input disabled id="settings-email" type="email" value={email} />
        <p className="settings-form__note">{copy.emailReadOnlyNote}</p>
      </div>
      {error ? (
        <p className="form-status__error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="form-status__success" role="status">
          {copy.successMessage}
        </p>
      ) : null}
      <button className="button button--primary" disabled={isSaving} type="submit">
        {isSaving ? copy.savingLabel : copy.saveLabel}
      </button>
    </form>
  );
}
