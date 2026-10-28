import React, { useEffect, useState } from "react";
import { useSmoothScroll } from "../common/SmoothScrollProvider";

/**
 * Backdrop component: "living landscape" foundation.
 * - 3 organic inline SVG paths with slow transform-only drift (40-70s).
 * - Original nested wavy topographic contour paths at 1px stroke (6-8% opacity).
 * - Fixed position at token z-index (--z-backdrop, -1).
 * - Viewports < 768px: 2 blobs, static blur, no scroll parallax.
 * - Strictly frozen under prefers-reduced-motion; hidden in print.
 */
export const Backdrop: React.FC = () => {
  const { scrollY } = useSmoothScroll();
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport, { passive: true });
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("resize", checkViewport);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Parallax offsets (translate-only; disabled on mobile or reduced motion)
  const canParallax = !isMobile && !reducedMotion;
  const contourOffset = canParallax ? Math.round(scrollY * -0.15) : 0;
  const blobOffset = canParallax ? Math.round(scrollY * -0.08) : 0;

  return (
    <div
      className="backdrop-layer fixed inset-0 overflow-hidden pointer-events-none select-none print:hidden"
      style={{ zIndex: "var(--z-backdrop, -1)" }}
      aria-hidden="true"
    >
      {/* Organic Blobs Layer */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          transform: canParallax ? `translate3d(0, ${blobOffset}px, 0)` : "none",
          transition: "transform 0.1s linear",
          willChange: canParallax ? "transform" : "auto",
        }}
      >
        {/* Blob 1: Primary tone, upper-right */}
        <div
          className={`absolute -top-24 -right-24 w-[580px] h-[520px] transition-transform ${
            isMobile || reducedMotion ? "" : "blob-drift-1"
          }`}
          style={{
            filter: isMobile ? "blur(24px)" : "blur(36px)",
            opacity: 0.16,
            willChange: isMobile ? "auto" : "transform",
          }}
        >
          <svg viewBox="0 0 580 520" className="w-full h-full">
            <path
              d="M 280,45 C 410,25 530,115 565,225 C 605,345 545,465 440,500 C 330,535 185,505 105,420 C 25,335 15,215 75,115 C 130,25 195,55 280,45 Z"
              fill="rgb(var(--c-primary))"
            />
          </svg>
        </div>

        {/* Blob 2: Accent tone, mid/lower-left */}
        <div
          className={`absolute top-[35%] -left-28 w-[540px] h-[500px] transition-transform ${
            isMobile || reducedMotion ? "" : "blob-drift-2"
          }`}
          style={{
            filter: isMobile ? "blur(24px)" : "blur(36px)",
            opacity: 0.12,
            willChange: isMobile ? "auto" : "transform",
          }}
        >
          <svg viewBox="0 0 540 500" className="w-full h-full">
            <path
              d="M 235,55 C 355,25 450,85 505,190 C 560,295 515,420 415,465 C 310,515 165,480 90,395 C 15,300 25,165 95,85 C 145,25 180,65 235,55 Z"
              fill="rgb(var(--c-accent))"
            />
          </svg>
        </div>

        {/* Blob 3: Canvas-2 / Highlight tone, bottom-center (Desktop only) */}
        {!isMobile && (
          <div
            className={`absolute -bottom-32 left-[30%] w-[500px] h-[460px] transition-transform ${
              reducedMotion ? "" : "blob-drift-3"
            }`}
            style={{
              filter: "blur(28px)",
              opacity: 0.15,
              willChange: "transform",
            }}
          >
            <svg viewBox="0 0 500 460" className="w-full h-full">
              <path
                d="M 215,50 C 320,30 410,105 445,210 C 485,325 425,415 340,435 C 235,465 120,425 60,330 C 5,235 25,125 90,70 C 135,20 165,60 215,50 Z"
                fill="rgb(var(--c-canvas-2))"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Topographic Contours Layer: 1px strokes at 7% opacity */}
      <div
        className="absolute inset-0 w-full h-[120%] pointer-events-none"
        style={{
          transform: canParallax ? `translate3d(0, ${contourOffset}px, 0)` : "none",
          transition: "transform 0.1s linear",
          willChange: canParallax ? "transform" : "auto",
        }}
      >
        <svg
          viewBox="0 0 1440 1080"
          className="w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          stroke="rgb(var(--c-ink))"
          strokeWidth="1"
          strokeOpacity="0.07"
        >
          {/* Elevation 100m */}
          <path d="M -50 180 C 220 130 380 290 620 220 C 860 150 1080 310 1300 240 C 1420 200 1500 230 1550 250" />
          {/* Elevation 120m */}
          <path d="M -50 260 C 200 210 390 380 650 300 C 910 220 1120 400 1320 330 C 1440 290 1510 310 1550 330" />
          {/* Elevation 140m with mono index label */}
          <path d="M -50 350 C 180 290 410 470 680 390 C 950 310 1150 490 1350 420 C 1460 380 1520 400 1550 410" />
          {/* Elevation 160m */}
          <path d="M -50 450 C 170 380 430 560 710 480 C 990 400 1180 580 1370 510 C 1470 470 1530 485 1550 495" />
          {/* Elevation 180m */}
          <path d="M -50 560 C 150 480 450 660 740 570 C 1030 480 1210 680 1400 600 C 1480 565 1535 575 1550 580" />
          {/* Elevation 200m */}
          <path d="M -50 680 C 140 590 470 770 770 670 C 1070 570 1240 790 1420 700 C 1490 660 1540 670 1550 675" />
          {/* Elevation 220m */}
          <path d="M -50 810 C 130 710 490 890 800 780 C 1110 670 1270 910 1450 810 C 1510 770 1545 780 1550 785" />
          {/* Elevation 240m */}
          <path d="M -50 940 C 120 830 510 1010 830 890 C 1150 770 1300 1030 1470 920 C 1520 880 1548 890 1550 895" />

          {/* Micro Elevation Contour Markers (Tabular mono text at 7% opacity) */}
          <text
            x="630"
            y="215"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            fill="rgb(var(--c-ink))"
            fillOpacity="0.07"
            stroke="none"
          >
            100m
          </text>
          <text
            x="690"
            y="385"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            fill="rgb(var(--c-ink))"
            fillOpacity="0.07"
            stroke="none"
          >
            140m
          </text>
          <text
            x="750"
            y="565"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            fill="rgb(var(--c-ink))"
            fillOpacity="0.07"
            stroke="none"
          >
            180m
          </text>
          <text
            x="810"
            y="775"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            fill="rgb(var(--c-ink))"
            fillOpacity="0.07"
            stroke="none"
          >
            220m
          </text>
        </svg>
      </div>
    </div>
  );
};
