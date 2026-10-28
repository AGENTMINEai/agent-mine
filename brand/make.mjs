import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(root, "..", "web");

const sg = fs.readFileSync(
  path.join(web, "node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2")
);
const jb = fs.readFileSync(
  path.join(web, "node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2")
);
const sgBold = fs.readFileSync(
  path.join(root, "fonts/space-grotesk-700.woff2")
);
const logo = fs.readFileSync(path.join(web, "public/brand/logo-mark.png")).toString("base64");
const logoUri = `data:image/png;base64,${logo}`;

const fonts = [
  { name: "Space Grotesk", data: sg, weight: 400, style: "normal" },
  { name: "Space Grotesk", data: sgBold, weight: 700, style: "normal" },
  { name: "JetBrains Mono", data: jb, weight: 400, style: "normal" },
  { name: "JetBrains Mono", data: jb, weight: 700, style: "normal" },
];

const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

const C = {
  bg: "#040507",
  ink: "#EEF0F5",
  soft: "#C9CDD6",
  muted: "#8A8F9C",
  faint: "#5B606C",
  gold: "#F0B90B",
  goldSoft: "#FFD9A3",
  blue: "#4DA6FF",
  blueSoft: "#A8CCFF",
  ok: "#54E6A4",
};

const SURFACE = [
  "radial-gradient(circle at 92% 6%, rgba(240,185,11,0.20), rgba(240,185,11,0) 55%)",
  "radial-gradient(circle at 4% 100%, rgba(77,225,255,0.13), rgba(77,225,255,0) 55%)",
  "radial-gradient(circle at 50% 120%, rgba(255,180,84,0.08), rgba(255,180,84,0) 60%)",
].join(", ");

function mark(size = 54) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        padding: 1,
        borderRadius: size * 0.22,
        backgroundImage: `linear-gradient(135deg, ${C.gold}AA, rgba(255,255,255,0.10) 45%, ${C.blue}99)`,
      },
    },
    h("img", {
      src: logoUri,
      width: size,
      height: size,
      style: { borderRadius: size * 0.2, backgroundColor: "#020611" },
    })
  );
}

function wordmark(size = 20) {
  return h(
    "div",
    { style: { display: "flex", fontSize: size, letterSpacing: "0.12em", fontWeight: 700 } },
    h("span", { style: { color: C.gold } }, "AGENT"),
    h("span", { style: { color: C.blue } }, "MINE")
  );
}

async function render(name, width, height, element) {
  const svg = await satori(element, { width, height, fonts });
  fs.writeFileSync(path.join(root, name + ".svg"), svg);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  const file = path.join(root, `${name}.png`);
  fs.writeFileSync(file, png);
  console.log("wrote", file, `${width}x${height}`, `${(png.length / 1024).toFixed(0)} KB`);
}

// 1. Announcement card 1200x675
const announcement = h(
  "div",
  {
    style: {
      width: 1200,
      height: 675,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
      backgroundColor: C.bg,
      boxSizing: "border-box",
      backgroundImage: SURFACE,
      padding: 64,
      fontFamily: "Space Grotesk",
    },
  },
  h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 16 } },
    mark(54),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 7 } },
      wordmark(21),
      h("div", { style: { display: "flex", fontSize: 10, letterSpacing: "0.32em", color: C.muted } }, "BSC · AGENT ID ONLY")
    )
  ),
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 6 } },
    h("div", { style: { display: "flex", fontSize: 70, lineHeight: 1.02, fontWeight: 700, color: C.ink, letterSpacing: "-0.03em" } }, "Put your idle agent"),
    h("div", { style: { display: "flex", fontSize: 70, lineHeight: 1.02, fontWeight: 700, color: C.gold, letterSpacing: "-0.03em" } }, "to work mining."),
    h("div", { style: { display: "flex", fontSize: 20, color: C.muted, marginTop: 22, maxWidth: 760, lineHeight: 1.45 } }, "A tax-funded mining vault, open only to wallets holding a Binance .ai Agent ID.")
  ),
  h(
    "div",
    { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 62 } },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 8 } },
      h("div", { style: { display: "flex", fontSize: 10, letterSpacing: "0.26em", color: C.muted } }, "VERIFIED CONTRACT"),
      h("div", { style: { display: "flex", fontSize: 17, fontFamily: "JetBrains Mono", color: C.soft } }, "0x7336a6a0…278Fa3")
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 12 } },
      h("div", { style: { display: "flex", width: 8, height: 8, borderRadius: 4, backgroundColor: C.ok } }),
      h("div", { style: { display: "flex", fontSize: 19, fontFamily: "JetBrains Mono", color: C.gold } }, "agentmine.online")
    )
  )
);

// 2. Mechanism card 1200x675
const steps = [
  { n: "01", t: "TAX", d: "every trade, in BNB" },
  { n: "02", t: "VAULT", d: "one contract, no admin" },
  { n: "03", t: "HASHRATE", d: "your staked token" },
  { n: "04", t: "WALLET", d: "mine sends BNB" },
];

const mechanism = h(
  "div",
  {
    style: {
      width: 1200,
      height: 675,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
      backgroundColor: C.bg,
      boxSizing: "border-box",
      backgroundImage: SURFACE,
      padding: 64,
      fontFamily: "Space Grotesk",
    },
  },
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 12 } },
    h("div", { style: { display: "flex", fontSize: 10, letterSpacing: "0.3em", color: C.gold } }, "HOW THE MINE WORKS"),
    h("div", { style: { display: "flex", fontSize: 44, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" } }, "Tax in. Hashrate out.")
  ),
  h(
    "div",
    { style: { display: "flex", alignItems: "stretch", gap: 10, height: 196 } },
    ...steps.flatMap((s, i) => [
      h(
        "div",
        {
          key: s.n,
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 236,
            padding: 22,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.025)",
          },
        },
        h("div", { style: { display: "flex", fontSize: 11, fontFamily: "JetBrains Mono", color: C.faint } }, s.n),
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          h("div", { style: { display: "flex", fontSize: 22, fontWeight: 700, color: C.goldSoft, letterSpacing: "0.04em" } }, s.t),
          h("div", { style: { display: "flex", fontSize: 13, color: C.muted, lineHeight: 1.35 } }, s.d)
        )
      ),
      ...(i < steps.length - 1
        ? [h("div", { key: `a${i}`, style: { display: "flex", alignItems: "center", justifyContent: "center", width: 18 } },
            h("div", { style: { display: "flex", width: 8, height: 8, borderTop: "1.5px solid rgba(255,255,255,0.3)", borderRight: "1.5px solid rgba(255,255,255,0.3)", transform: "rotate(45deg)" } }))]
        : []),
    ])
  ),
  h(
    "div",
    { style: { display: "flex", justifyContent: "space-between", alignItems: "center", height: 26 } },
    h("div", { style: { display: "flex", fontSize: 15, fontFamily: "JetBrains Mono", color: C.soft } }, "hashrate = staked token · release 1/86400 per second"),
    h("div", { style: { display: "flex", fontSize: 15, fontFamily: "JetBrains Mono", color: C.gold } }, "agentmine.online")
  )
);

// 3. Quote card 1080x1080
const quote = h(
  "div",
  {
    style: {
      width: 1080,
      height: 1080,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
      backgroundColor: C.bg,
      boxSizing: "border-box",
      backgroundImage: SURFACE,
      padding: 72,
      fontFamily: "Space Grotesk",
    },
  },
  h("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, mark(48), wordmark(19)),
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 4 } },
    h("div", { style: { display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.05, color: C.ink, letterSpacing: "-0.035em" } }, "No owner."),
    h("div", { style: { display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.05, color: C.ink, letterSpacing: "-0.035em" } }, "No pause."),
    h("div", { style: { display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.05, color: C.gold, letterSpacing: "-0.035em" } }, "No withdraw."),
    h(
      "div",
      { style: { display: "flex", fontSize: 20, color: C.muted, marginTop: 26, lineHeight: 1.5 } },
      "Tax BNB has exactly one exit:",
      h("span", { style: { fontFamily: "JetBrains Mono", color: C.soft } }, " mine()"),
      "."
    )
  ),
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 10 } },
    h("div", { style: { display: "flex", fontSize: 10, letterSpacing: "0.28em", color: C.muted } }, "SOURCECODE VERIFIED"),
    h("div", { style: { display: "flex", fontSize: 18, fontFamily: "JetBrains Mono", color: C.soft } }, "0x7336a6a0E4C2161A740C024ff267667311278Fa3"),
    h("div", { style: { display: "flex", fontSize: 15, fontFamily: "JetBrains Mono", color: C.faint } }, "bscscan.com · agentmine.online")
  )
);

// 4. X header 1500x500
const banner = h(
  "div",
  {
    style: {
      width: 1500,
      height: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
      backgroundColor: C.bg,
      boxSizing: "border-box",
      backgroundImage: SURFACE,
      padding: "0 72px",
      fontFamily: "Space Grotesk",
    },
  },
  h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 20, height: 120 } },
    mark(76),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 10 } },
      wordmark(34),
      h("div", { style: { display: "flex", fontSize: 12, letterSpacing: "0.34em", color: C.muted } }, "BINANCE .AI AGENT ID ONLY")
    )
  ),
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, height: 96 } },
    h("div", { style: { display: "flex", fontSize: 26, color: C.soft } }, "An idle agent is an unused asset."),
    h("div", { style: { display: "flex", fontSize: 22, fontFamily: "JetBrains Mono", color: C.gold } }, "agentmine.online")
  )
);

await render("card-announcement", 1200, 675, announcement);
await render("card-mechanism", 1200, 675, mechanism);
await render("card-quote", 1080, 1080, quote);
await render("x-banner", 1500, 500, banner);
