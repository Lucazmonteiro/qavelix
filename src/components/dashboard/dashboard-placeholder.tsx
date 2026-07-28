type DashboardPlaceholderProps = {
  badge: string;
  title: string;
  description: string;
};

// Shared by the 4 not-yet-built dashboard sections (Usage, Plan, Billing, Settings) so
// the "coming soon" treatment is defined once, not duplicated per page.
export function DashboardPlaceholder({ badge, title, description }: DashboardPlaceholderProps) {
  return (
    <div className="foundation-card dashboard-placeholder">
      <span className="dashboard-placeholder__badge">{badge}</span>
      <h2 className="dashboard-card__title">{title}</h2>
      <p>{description}</p>
    </div>
  );
}
