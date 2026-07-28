import type { ReactNode } from "react";

type AuthFormShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  // Sign-in's own title ("Entrar"/"Sign in") is redundant with its submit button
  // directly below it — visually hidden (not removed outright) so the page keeps a real
  // <h1> for screen readers/document structure while the visible header reads as just
  // the "CONTA" eyebrow and the "Entre na sua conta..." description, both centered.
  hideTitle?: boolean;
};

export function AuthFormShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  hideTitle = false,
}: AuthFormShellProps) {
  return (
    <main className="page-shell auth-page" id="main-content">
      <div className="auth-form-shell">
        <div className="auth-form-shell__header">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={hideTitle ? "sr-only" : undefined}>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
        {footer ? <div className="auth-form__footer">{footer}</div> : null}
      </div>
    </main>
  );
}
