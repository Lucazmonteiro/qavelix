"use client";

import { useState } from "react";

import type { getDictionary } from "@/i18n/dictionaries";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";

type Dictionary = ReturnType<typeof getDictionary>;

type PasswordSettingsFormProps = {
  dictionary: Dictionary;
};

// Only rendered by the settings page when hasPasswordCredential(userId) is true — see
// session.ts. Uses Better Auth's own official changePassword flow (POST
// /api/auth/change-password), never a hand-rolled password update, and requires the
// current password like every other secure change-password flow.
export function PasswordSettingsForm({ dictionary }: PasswordSettingsFormProps) {
  const copy = dictionary.dashboard.settings.security;
  const fieldsCopy = dictionary.auth.fields;
  const authCopy = dictionary.auth;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function resetFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setSuccess(false);

    if (newPassword.length < 8) {
      setError(authCopy.validation.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(authCopy.validation.passwordMismatch);
      return;
    }

    setIsSaving(true);
    setError(null);

    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });

    setIsSaving(false);

    if (changeError) {
      setError(mapAuthErrorCode(changeError.code, authCopy.errors));
      return;
    }

    setSuccess(true);
    resetFields();
  }

  return (
    <form className="settings-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2 className="dashboard-card__title">{copy.title}</h2>
      <div className="auth-field">
        <label htmlFor="settings-current-password">{fieldsCopy.currentPasswordLabel}</label>
        <input
          autoComplete="current-password"
          id="settings-current-password"
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setSuccess(false);
          }}
          placeholder={fieldsCopy.currentPasswordPlaceholder}
          type="password"
          value={currentPassword}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="settings-new-password">{fieldsCopy.newPasswordLabel}</label>
        <input
          autoComplete="new-password"
          id="settings-new-password"
          onChange={(event) => {
            setNewPassword(event.target.value);
            setSuccess(false);
          }}
          placeholder={fieldsCopy.newPasswordPlaceholder}
          type="password"
          value={newPassword}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="settings-confirm-password">{fieldsCopy.confirmPasswordLabel}</label>
        <input
          autoComplete="new-password"
          id="settings-confirm-password"
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setSuccess(false);
          }}
          placeholder={fieldsCopy.confirmPasswordPlaceholder}
          type="password"
          value={confirmPassword}
        />
      </div>
      {error ? (
        <p className="form-status__error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="form-status__success" role="status">
          {copy.passwordChangedMessage}
        </p>
      ) : null}
      <button className="button button--primary" disabled={isSaving} type="submit">
        {isSaving ? copy.changingPasswordLabel : copy.changePasswordLabel}
      </button>
    </form>
  );
}
