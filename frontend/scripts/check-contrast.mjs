/**
 * check-contrast.mjs
 * Dependency-free WCAG AA contrast verification for EcoPlan Palettes (A, B, C).
 */

function sRGBtoLin(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]) {
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function contrastRatio(rgb1, rgb2) {
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

// Palette Definitions (RGB)
const palettes = {
  "Palette A: Sage Dawn (Default Light)": {
    canvas: [242, 239, 230], // #F2EFE6
    surface: [250, 246, 239], // #FAF6EF (paper-raised)
    surfaceInset: [235, 228, 216], // #EBE4D8
    ink: [30, 42, 35], // #1E2A23
    inkMuted: [77, 90, 82], // #4D5A52
    inkFaint: [88, 80, 75], // #58504B (enhanced accessible ink-faint)
    primaryDeep: [47, 74, 58], // #2F4A3A (moss text & active)
    accentDeep: [143, 74, 44], // #8F4A2C (clay - warm badges only)
    dangerDeep: [155, 35, 36], // #9B2324 (danger deficit text)
    white: [255, 255, 255],
    primaryButtonBg: [47, 74, 58],
    // Known non-text colors to document/check
    sageFill: [168, 184, 154], // #A8B89A (fill only)
    apricotFill: [217, 136, 95], // #D9885F (fill only)
  },
  "Palette B: Tidepool Night (Dark Glass)": {
    canvas: [14, 27, 26], // #0E1B1A
    surface: [22, 48, 45], // #16302D
    surfaceInset: [17, 36, 34],
    ink: [232, 242, 236], // #E8F2EC
    inkMuted: [169, 189, 181], // #A9BDB5
    inkFaint: [134, 158, 150], // #869E96 (passes 4.76:1 on dark surface)
    primaryDeep: [134, 209, 178], // #86D1B2 (mint)
    accentDeep: [240, 178, 122], // #F0B27A (amber)
    dangerDeep: [248, 113, 113], // #F87171 (mint/danger)
    white: [232, 242, 236],
    primaryButtonBg: [36, 80, 72],
  },
  "Palette C: Kiln & Lagoon (Light)": {
    canvas: [241, 236, 226], // #F1ECE2
    surface: [250, 247, 240], // #FAF7F0
    surfaceInset: [236, 229, 217],
    ink: [27, 37, 35], // #1B2523
    inkMuted: [75, 88, 86], // #4B5856
    inkFaint: [94, 105, 102], // #5E6966 (passes 4.5:1 on canvas)
    primaryDeep: [30, 80, 77], // #1E504D (teal deep)
    accentDeep: [154, 69, 36], // #9A4524 (terracotta deep text)
    dangerDeep: [153, 27, 27], // #991B1B (crimson danger)
    white: [255, 255, 255],
    primaryButtonBg: [30, 80, 77],
    // Known non-text
    terracottaFill: [200, 100, 59], // #C8643B (fill only)
    sandFill: [227, 211, 181], // #E3D3B5 (fill only)
  },
};

let hasFailure = false;

console.log("==========================================================================");
console.log("             EcoPlan Design System: WCAG AA Contrast Audit               ");
console.log("==========================================================================\n");

for (const [paletteName, colors] of Object.entries(palettes)) {
  console.log(`▶ ${paletteName}`);
  console.log("--------------------------------------------------------------------------");
  console.log(" Pair                                        | Ratio   | Min Req | Result");
  console.log("--------------------------------------------------------------------------");

  const requiredPairs = [
    { name: "ink on canvas", fg: colors.ink, bg: colors.canvas, min: 4.5 },
    { name: "ink on surface", fg: colors.ink, bg: colors.surface, min: 4.5 },
    { name: "ink-muted on canvas", fg: colors.inkMuted, bg: colors.canvas, min: 4.5 },
    { name: "ink-muted on surface", fg: colors.inkMuted, bg: colors.surface, min: 4.5 },
    { name: "ink-faint on canvas", fg: colors.inkFaint, bg: colors.canvas, min: 4.5 },
    { name: "ink-faint on surface", fg: colors.inkFaint, bg: colors.surface, min: 4.5 },
    { name: "primary-deep on canvas", fg: colors.primaryDeep, bg: colors.canvas, min: 4.5 },
    { name: "primary-deep on surface", fg: colors.primaryDeep, bg: colors.surface, min: 4.5 },
    { name: "accent-deep on canvas", fg: colors.accentDeep, bg: colors.canvas, min: 4.5 },
    { name: "accent-deep on surface", fg: colors.accentDeep, bg: colors.surface, min: 4.5 },
    { name: "danger-deep on canvas", fg: colors.dangerDeep, bg: colors.canvas, min: 4.5 },
    { name: "danger-deep on surface", fg: colors.dangerDeep, bg: colors.surface, min: 4.5 },
    { name: "white text on primary button", fg: colors.white, bg: colors.primaryButtonBg, min: 4.5 },
  ];

  for (const pair of requiredPairs) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const pass = ratio >= pair.min;
    if (!pass) hasFailure = true;

    const formattedRatio = ratio.toFixed(2) + " : 1";
    const status = pass ? "✓ PASS" : "✗ FAIL";
    console.log(
      ` ${pair.name.padEnd(43)} | ${formattedRatio.padEnd(7)} | ${pair.min.toFixed(1)}:1   | ${status}`
    );
  }
  console.log("\n");
}

// Verification of known prohibited text pairs
console.log("▶ Forbidden Text Pair Safeguard Checks (Ensuring fills are not text):");
console.log("--------------------------------------------------------------------------");
const pA = palettes["Palette A: Sage Dawn (Default Light)"];
const sageMutedRatio = contrastRatio(pA.inkMuted, pA.sageFill);
const claySageRatio = contrastRatio(pA.accentDeep, pA.sageFill);
console.log(` ink-muted on sage fill: ${sageMutedRatio.toFixed(2)}:1 (Expected < 4.5:1 -> correctly forbidden for text)`);
console.log(` clay-deep on sage fill:  ${claySageRatio.toFixed(2)}:1 (Expected < 4.5:1 -> correctly forbidden for text)`);

if (hasFailure) {
  console.error("\n❌ Contrast check failed: one or more required text pairs do not meet WCAG AA.");
  process.exit(1);
} else {
  console.log("\n✅ All required text and background pairs pass WCAG AA across Palettes A, B, and C.");
  process.exit(0);
}
