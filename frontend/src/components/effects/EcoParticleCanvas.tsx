import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface EcoParticleCanvasProps {
  className?: string;
  density?: number; // Approximate particle count scale factor (default: 45)
  speedMultiplier?: number;
  maxLinkDistance?: number;
  interactive?: boolean;
  theme?: "dark" | "light";
}

const THEME_COLORS = {
  dark: [
    "rgba(52, 211, 153, ", // emerald-400
    "rgba(45, 212, 191, ", // teal-400
    "rgba(110, 231, 183, ", // emerald-300
    "rgba(251, 191, 36, ", // amber-400 (warm accent)
  ],
  light: [
    "rgba(16, 185, 129, ", // emerald-600
    "rgba(13, 148, 136, ", // teal-600
    "rgba(5, 150, 105, ", // emerald-700
    "rgba(217, 119, 6, ", // amber-600
  ],
};

export const EcoParticleCanvas: React.FC<EcoParticleCanvasProps> = ({
  className = "",
  density = 40,
  speedMultiplier = 0.5,
  maxLinkDistance = 110,
  interactive = true,
  theme = "dark",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{
    x: number | null;
    y: number | null;
    radius: number;
  }>({
    x: null,
    y: null,
    radius: 130,
  });
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const colors = THEME_COLORS[theme];

    // Resize handling with devicePixelRatio for Retina crispness
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      if (width <= 0 || height <= 0) return;
      // Scale count appropriately based on screen area
      const count = Math.min(
        65,
        Math.max(20, Math.floor((width * height) / 18000) + density / 2),
      );
      const particles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 2.2 + 1.2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speedMultiplier,
          vy: (Math.random() - 0.5) * speedMultiplier,
          radius,
          baseRadius: radius,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.45 + 0.25,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      particlesRef.current = particles;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse movement listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    if (interactive && canvas) {
      canvas.parentElement?.addEventListener("mousemove", handleMouseMove);
      canvas.parentElement?.addEventListener("mouseleave", handleMouseLeave);
    }

    // Visibility observer to pause RAF when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 },
    );

    if (canvas) {
      observer.observe(canvas);
    }

    // Animation Loop
    const render = () => {
      if (isVisibleRef.current && ctx) {
        ctx.clearRect(0, 0, width, height);

        const particles = particlesRef.current;
        const mouse = mouseRef.current;

        // 1. Update and draw particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Movement
          p.x += p.vx;
          p.y += p.vy;

          // Boundary bouncing with soft wrap
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;

          // Pulse breathing effect
          p.pulsePhase += p.pulseSpeed;
          const currentAlpha = p.alpha + Math.sin(p.pulsePhase) * 0.12;

          // Interactive cursor reaction (smooth repel aura)
          if (interactive && mouse.x !== null && mouse.y !== null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 0) {
              const force = (1 - dist / mouse.radius) * 1.8;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.max(0.1, Math.min(0.9, currentAlpha))})`;
          ctx.fill();

          // 2. Draw Constellation Proximity Links
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxLinkDistance) {
              const linkAlpha = (1 - dist / maxLinkDistance) * 0.22;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle =
                theme === "dark"
                  ? `rgba(52, 211, 153, ${linkAlpha})`
                  : `rgba(16, 185, 129, ${linkAlpha * 0.8})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();
            }
          }

          // 3. Connect to mouse cursor when close
          if (interactive && mouse.x !== null && mouse.y !== null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius) {
              const mouseLinkAlpha = (1 - dist / mouse.radius) * 0.35;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle =
                theme === "dark"
                  ? `rgba(110, 231, 183, ${mouseLinkAlpha})`
                  : `rgba(5, 150, 105, ${mouseLinkAlpha * 0.8})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        observer.unobserve(canvas);
      }
      if (interactive && canvas?.parentElement) {
        canvas.parentElement.removeEventListener("mousemove", handleMouseMove);
        canvas.parentElement.removeEventListener(
          "mouseleave",
          handleMouseLeave,
        );
      }
    };
  }, [density, speedMultiplier, maxLinkDistance, interactive, theme]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
