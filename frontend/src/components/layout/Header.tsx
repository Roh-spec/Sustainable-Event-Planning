import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar } from "lucide-react";
import { SproutIcon, WaypointIcon } from "../icons";
import { useSmoothScroll } from "../common/SmoothScrollProvider";

export const Header: React.FC = () => {
  const location = useLocation();
  const { scrollY, scrollProgress } = useSmoothScroll();
  const isScrolled = scrollY > 20;

  const isPlanActive = location.pathname.startsWith("/events/new");
  const isEventsActive = location.pathname === "/events";

  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 transition-all duration-200 border-b relative ${
        isScrolled
          ? "glass-strong border-line shadow-subtle"
          : "bg-paper/85 backdrop-blur-sm border-line/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Typographic wordmark */}
          <Link to="/" className="flex items-center space-x-2 group focus:outline-none">
            <span className="text-moss-700 transition-transform group-hover:-translate-y-0.5">
              <SproutIcon size={22} className="stroke-[1.75]" />
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-display text-2xl font-bold tracking-tight text-ink">
                EcoPlan
              </span>
              <span className="hidden sm:inline font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss-800 border-l border-line-strong pl-2">
                Field notes
              </span>
            </div>
          </Link>

          {/* Navigation with underline rule active states */}
          <nav className="flex items-center space-x-4 sm:space-x-6" aria-label="Main Navigation">
            <Link
              to="/events/new"
              className={`inline-flex items-center space-x-1.5 py-1 text-sm font-medium transition-colors border-b-2 ${
                isPlanActive
                  ? "border-moss-700 text-ink font-semibold"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-line-strong"
              }`}
            >
              <WaypointIcon className="w-3.5 h-3.5" />
              <span>Plan Event</span>
            </Link>

            <Link
              to="/events"
              className={`inline-flex items-center space-x-1.5 py-1 text-sm font-medium transition-colors border-b-2 ${
                isEventsActive
                  ? "border-moss-700 text-ink font-semibold"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-line-strong"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* 2px Solid Primary Progress Line on Bottom Edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none transition-opacity duration-200 print:hidden overflow-hidden"
        style={{ opacity: scrollProgress > 0.01 ? 1 : 0 }}
        aria-hidden="true"
      >
        <div
          className="h-full bg-moss-700"
          style={{
            width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
            transition: "width 0.08s linear",
          }}
        />
      </div>
    </header>
  );
};


