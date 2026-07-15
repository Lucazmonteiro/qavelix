type FoundationCardProps = {
  title: string;
  description: string;
};

export function FoundationCard({ title, description }: FoundationCardProps) {
  return (
    <article className="foundation-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
