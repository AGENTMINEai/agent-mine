export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-semibold uppercase leading-none ${className}`}
      style={{ letterSpacing: "0.12em" }}
    >
      <span className="brand-gold">AGENT</span>
      <span className="brand-blue">MINE</span>
    </span>
  );
}
