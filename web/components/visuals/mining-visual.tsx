"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PoolOrb } from "./pool-orb";

const RigScene = dynamic(() => import("./rig-scene").then((m) => m.RigScene), { ssr: false });

type Mode = "svg" | "3d" | "lite";

/**
 * Picks the visual for the mine:
 *  - 3D rig + bloom on desktop with WebGL
 *  - same scene without bloom on small screens
 *  - the SVG gauge when WebGL is unavailable or motion is reduced
 */
export function MiningVisual({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [mode, setMode] = useState<Mode>("svg");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const canvas = document.createElement("canvas");
      webgl = Boolean(
        window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl"))
      );
    } catch {
      webgl = false;
    }
    if (!webgl || reduce) {
      setMode("svg");
      return;
    }
    setMode(window.innerWidth < 768 ? "lite" : "3d");
  }, []);

  if (mode === "svg") {
    return <PoolOrb className={className}>{children}</PoolOrb>;
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <RigScene className="absolute inset-0" dense={mode === "3d"} />
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
        <div className="rounded-2xl border border-white/10 bg-obsidian-950/78 px-5 py-3 shadow-panel backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  );
}
