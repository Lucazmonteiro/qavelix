type FoundationCardProps = {
  title: string;
  description: string;
  icon?: string;
};

export function FoundationCard({ title, description, icon }: FoundationCardProps) {
  return (
    <article className="foundation-card">
      {icon ? (
        <span aria-hidden="true" className="foundation-card__icon">
          {icon}
        </span>
      ) : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
