import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollY: number;
  scrollProgress: number;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollY: 0,
  scrollProgress: 0,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    setLenisInstance(lenis);

    lenis.on("scroll", (e: { scroll: number; progress: number }) => {
      setScrollY(e.scroll);
      setScrollProgress(e.progress);
    });

    const raf = (time: number) => {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    };

    rafIdRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      lenis.destroy();
      setLenisInstance(null);
    };
  }, []);

  return (
    <SmoothScrollContext.Provider
      value={{ lenis: lenisInstance, scrollY, scrollProgress }}
    >
      {/* Top 2.5px ambient gradient reading beam */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: scrollProgress > 0.01 ? 1 : 0,
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 shadow-sm shadow-emerald-400/50"
          style={{
            width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {children}
    </SmoothScrollContext.Provider>
  );
};
