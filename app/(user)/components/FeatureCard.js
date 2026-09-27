export default function FeatureCard({
  title,
  subtitle,
  description
}) {
  return <div className="card teacher-card">
      <h3 className="text-xl font-bold mt-4">{title}</h3>
      <p className="text-primary mb-2">{subtitle}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>;
}
