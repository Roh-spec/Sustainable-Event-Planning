import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, MOTION } from "../../utils/motion";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerIndex?: number;
  threshold?: number;
  as?: React.ElementType;
}

/**
 * Reveal Component:
 * - Run-once scroll reveal via IntersectionObserver (threshold 0.15).
 * - Fade up 20px with blur 6px to 0 in 550ms (outExpo).
 * - Optional stagger delay (60ms * staggerIndex).
 * - Fully bypassed under prefers-reduced-motion or print.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  className = "",
  delay = 0,
  staggerIndex,
  threshold = MOTION.threshold.reveal,
  as: Component = "div",
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [hasRevealed, setHasRevealed] = useState(() => prefersReducedMotion());

  const effectiveDelay =
    staggerIndex !== undefined
      ? delay + staggerIndex * MOTION.staggerDelayMs
      : delay;

  useEffect(() => {
    if (hasRevealed || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setHasRevealed(true);
      return;
    }

    if (prefersReducedMotion()) {
      setHasRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setHasRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, hasRevealed]);

  if (hasRevealed && prefersReducedMotion()) {
    return <Component className={className}>{children}</Component>;
  }

  const style: React.CSSProperties = {
    opacity: hasRevealed ? 1 : 0,
    transform: hasRevealed ? "translate3d(0, 0, 0)" : "translate3d(0, 20px, 0)",
    filter: hasRevealed ? "blur(0px)" : "blur(6px)",
    transition: hasRevealed
      ? `opacity 550ms ${MOTION.easing.outExpo} ${effectiveDelay}ms, transform 550ms ${MOTION.easing.outExpo} ${effectiveDelay}ms, filter 550ms ${MOTION.easing.outExpo} ${effectiveDelay}ms`
      : "none",
    willChange: hasRevealed ? "auto" : "opacity, transform, filter",
  };

  return (
    <Component
      ref={ref}
      style={style}
      className={`reveal-layer ${className}`}
    >
      {children}
    </Component>
  );
};
