type DashboardHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

// Composed by each dashboard page itself (matching how every other page in this app
// renders its own heading/hero content rather than a layout injecting it) — not part of
// DashboardShell, since the layout doesn't know which specific page is being rendered.
export function DashboardHeader({ eyebrow, title, description }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
