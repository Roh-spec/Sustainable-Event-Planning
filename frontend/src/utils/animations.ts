import { animate, stagger } from "animejs";

/**
 * Animate a numeric property on an object and update DOM on each tick.
 */
export const animateNumber = (
  fromVal: number,
  toVal: number,
  onUpdate: (current: number) => void,
  options: { duration?: number; easing?: string } = {},
) => {
  const obj = { val: fromVal };
  return animate(obj, {
    val: toVal,
    duration: options.duration || 900,
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
  return animate(targets, {
    opacity: [0, 1],
    translateY: [options.translateY !== undefined ? options.translateY : 20, 0],
    duration: options.duration || 650,
    delay: stagger(options.stagger || 70, { start: options.delay || 50 }),
    ease: "outCubic",
  });
};

/**
 * Satisfying spring pulse when an estimate or action succeeds.
 */
export const pulseSuccess = (target: string | HTMLElement) => {
  return animate(target, {
    scale: [1, 1.05, 0.98, 1],
    duration: 500,
    ease: "outElastic(1, 0.5)",
  });
};
