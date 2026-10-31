export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-obsidian-950">
      <div className="absolute inset-0 grid-blue opacity-60 [mask-image:radial-gradient(ellipse_at_50%_0%,black_8%,transparent_68%)]" />
      <div className="absolute -top-[26%] left-1/2 h-[64vw] w-[86vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(61,123,255,0.16),transparent_62%)] blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[38vh] bg-[radial-gradient(ellipse_at_50%_120%,rgba(61,123,255,0.10),transparent_62%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute inset-0 noise opacity-[0.02] mix-blend-soft-light" />
    </div>
  );
}
