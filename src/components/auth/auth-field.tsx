import { useId, type InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  // Permanent, non-error guidance shown below the input (e.g. password composition
  // rules) — always visible, independent of validation state, unlike `error`.
  hint?: string | null;
};

export function AuthField({ label, error, hint, id, ...inputProps }: AuthFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="auth-field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p className="auth-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="auth-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
