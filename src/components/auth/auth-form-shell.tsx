import type { ReactNode } from "react";

type AuthFormShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthFormShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthFormShellProps) {
  return (
    <main className="page-shell auth-page" id="main-content">
      <div className="auth-form-shell">
        <div className="auth-form-shell__header">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
        {footer ? <div className="auth-form__footer">{footer}</div> : null}
      </div>
    </main>
  );
}
