import { animate, stagger } from "animejs";

/**
 * Checks if the user has requested reduced motion at OS or browser level.
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Animate a numeric property on an object and update DOM on each tick.
 */
export const animateNumber = (
  fromVal: number,
  toVal: number,
  onUpdate: (current: number) => void,
  options: { duration?: number; easing?: string } = {},
) => {
  if (prefersReducedMotion()) {
    onUpdate(toVal);
    return null;
  }

  const obj = { val: fromVal };
  return animate(obj, {
    val: toVal,
    duration: options.duration || 850,
    ease: options.easing || "outExpo",
    onUpdate: () => {
      onUpdate(Math.round(obj.val));
    },
  });
};

/**
 * Staggers entrance reveals for lists of elements (cards, table rows, badges).
 */
export const staggerEntrance = (
  targets: string | HTMLElement | HTMLElement[] | NodeListOf<Element>,
  options: {
    delay?: number;
    stagger?: number;
    translateY?: number;
    duration?: number;
  } = {},
) => {
  if (prefersReducedMotion()) {
    return null;
  }

  return animate(targets, {
    opacity: [0, 1],
    translateY: [options.translateY !== undefined ? options.translateY : 16, 0],
    duration: options.duration || 550,
    delay: stagger(options.stagger || 60, { start: options.delay || 40 }),
    ease: "outCubic",
  });
};

/**
 * Smooth entrance animation for full pages or wizard steps.
 */
export const animatePageEnter = (
  target: string | HTMLElement,
  options: { duration?: number; translateY?: number; delay?: number } = {},
) => {
  if (prefersReducedMotion()) {
    return null;
  }

  return animate(target, {
    opacity: [0, 1],
    translateY: [options.translateY !== undefined ? options.translateY : 12, 0],
    duration: options.duration || 400,
    delay: options.delay || 0,
    ease: "outCubic",
  });
};

/**
 * Spring pulse when an active wizard step is selected.
 */
export const pulseActiveStep = (target: string | HTMLElement) => {
  if (prefersReducedMotion()) {
    return null;
  }

  return animate(target, {
    scale: [0.94, 1.08, 1],
    duration: 420,
    ease: "outBack(2)",
  });
};

/**
 * Satisfying pulse when an organizer confirms or selects a sustainable plan alternative.
 */
export const pulseSelectedPlan = (target: string | HTMLElement) => {
  if (prefersReducedMotion()) {
    return null;
  }

  return animate(target, {
    scale: [1, 1.025, 0.99, 1],
    duration: 460,
    ease: "outBack(1.8)",
  });
};

/**
 * Satisfying spring pulse when an estimate or action succeeds.
 */
export const pulseSuccess = (target: string | HTMLElement) => {
  if (prefersReducedMotion()) {
    return null;
  }

  return animate(target, {
    scale: [1, 1.05, 0.98, 1],
    duration: 500,
    ease: "outElastic(1, 0.5)",
  });
};
