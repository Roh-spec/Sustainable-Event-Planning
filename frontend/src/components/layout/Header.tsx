import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Leaf, Calendar, Sparkles } from "lucide-react";
import { useSmoothScroll } from "../common/SmoothScrollProvider";

export const Header: React.FC = () => {
  const location = useLocation();
  const { scrollY } = useSmoothScroll();
  const isScrolled = scrollY > 20;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-paper-raised/85 backdrop-blur-md border-b border-line shadow-notebook"
          : "bg-paper/80 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[4.25rem]">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-moss-700 flex items-center justify-center text-paper-raised shadow-notebook group-hover:bg-moss-600 transition-colors">
              <Leaf className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-display text-xl text-ink tracking-tight">
                  EcoPlan
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.14em] text-moss-700">
                  Field notes
                </span>
              </div>
              <p className="text-xs text-ink-muted hidden sm:block">
                Budget-aware, low-waste events
              </p>
            </div>
          </Link>

          <nav className="flex items-center space-x-1.5 sm:space-x-2">
            <Link
              to="/events/new"
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname.startsWith("/events/new")
                  ? "bg-moss-700 text-paper-raised"
                  : "text-ink-muted hover:text-ink hover:bg-paper-inset"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan Event</span>
            </Link>

            <Link
              to="/events"
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/events"
                  ? "bg-paper-inset text-ink"
                  : "text-ink-muted hover:text-ink hover:bg-paper-inset"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
