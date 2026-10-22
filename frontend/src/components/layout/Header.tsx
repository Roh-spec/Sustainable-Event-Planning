import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Calendar } from "lucide-react";
import { SproutIcon } from "../icons";
import { useSmoothScroll } from "../common/SmoothScrollProvider";

export const Header: React.FC = () => {
  const location = useLocation();
  const { scrollY } = useSmoothScroll();
  const isScrolled = scrollY > 15;

  const isPlanActive = location.pathname.startsWith("/events/new");
  const isEventsActive = location.pathname === "/events";

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 border-b ${
        isScrolled
          ? "bg-paper/95 backdrop-blur-md border-line shadow-subtle"
          : "bg-paper border-line/60"
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
          <nav className="flex items-center space-x-4 sm:space-x-6">
            <Link
              to="/events/new"
              className={`inline-flex items-center space-x-1.5 py-1 text-sm font-medium transition-colors border-b-2 ${
                isPlanActive
                  ? "border-moss-700 text-ink font-semibold"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-line-strong"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
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
    </header>
  );
};

