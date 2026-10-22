/**
 * EcoPlan Motion System
 *
 * Rules:
 * - Only transform and opacity animated (plus one-off filter: blur on reveal)
 * - All transitions are run-once, 400-700ms, outExpo / outCubic
 * - No pinning, no scroll-jacking
 * - Strictly respects prefers-reduced-motion at OS / browser level
 */

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const MOTION = {
  duration: {
    stamp: 280,
    fast: 300,
    standard: 500,
    gentle: 650,
    reveal: 600,
  },
  easing: {
    outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
    outCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
    stampSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  threshold: {
    reveal: 0.15,
  },
  staggerDelayMs: 60,
} as const;

/**
 * Triggers the signature "stamp thump" on plan selection
 * Scale 1.15 to 1, rotate -2deg, 280ms
 */
export const triggerStampThump = (element: HTMLElement | null) => {
  if (!element || prefersReducedMotion()) return;

  element.style.transition = `transform ${MOTION.duration.stamp}ms ${MOTION.easing.stampSpring}`;
  element.style.transform = "scale(1.15) rotate(-3deg)";

  requestAnimationFrame(() => {
    setTimeout(() => {
      element.style.transform = "scale(1) rotate(-2deg)";
    }, 40);
  });
};
