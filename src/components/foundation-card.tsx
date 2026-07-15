type FoundationCardProps = {
  title: string;
  description: string;
};

export function FoundationCard({ title, description }: FoundationCardProps) {
  return (
    <article className="border-border bg-surface shadow-soft rounded-lg border p-5">
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-muted mt-3 text-sm leading-6">{description}</p>
    </article>
  );
}
