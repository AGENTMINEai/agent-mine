export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-obsidian-950">
      {/* neon auroras */}
      <div className="absolute -top-[34%] left-[62%] h-[74vw] w-[74vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,180,84,0.16),transparent_62%)] blur-3xl animate-aurora-a" />
      <div className="absolute top-[26%] -left-[18%] h-[62vw] w-[62vw] rounded-full bg-[radial-gradient(circle,rgba(77,225,255,0.13),transparent_64%)] blur-3xl animate-aurora-b" />
      <div className="absolute bottom-[-24%] right-[-10%] h-[54vw] w-[54vw] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.16),transparent_66%)] blur-3xl animate-aurora-a" />
      <div className="absolute top-[8%] left-[18%] h-[40vw] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(255,79,216,0.09),transparent_66%)] blur-3xl animate-aurora-b" />

      {/* grid + scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:76px_76px] [mask-image:radial-gradient(ellipse_at_center,black_18%,transparent_76%)]" />
      <div className="scanlines absolute inset-0 opacity-[0.18]" />

      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-mine-amber/40 to-transparent" />
      <div className="absolute inset-0 noise opacity-[0.03] mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(77,225,255,0.10),transparent_55%)]" />
    </div>
  );
}
