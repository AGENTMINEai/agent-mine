"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cinematic mining loop: a pre-rendered video (watermark removed, ping-pong
 * seamless loop). `bare` drops the frame treatment so it can be used as a
 * background layer and masked into the page.
 */
export function MiningVideo({
  className,
  children,
  bare = false,
}: {
  className?: string;
  children?: React.ReactNode;
  bare?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState("/media/rig-1248.mp4");

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) setSrc("/media/rig-720.mp4");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = video.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <video
        ref={video}
        src={src}
        poster="/media/rig-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {!bare && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(4,5,7,0.82)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-obsidian-950/90 to-transparent" />
        </>
      )}

      {!bare && children && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
          <div className="rounded-2xl border border-white/10 bg-obsidian-950/82 px-5 py-3 shadow-panel backdrop-blur-md">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
