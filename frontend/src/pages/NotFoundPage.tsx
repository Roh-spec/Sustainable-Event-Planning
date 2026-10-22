import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import { Stamp } from "../components/common/Stamp";

/**
 * NotFoundPage:
 * Handcrafted 404 field-station page with open field notebook illustration,
 * dotgrid background, and clay uncharted stamp.
 */
export const NotFoundPage: React.FC = () => {
  usePageTitle("Page Not Found · EcoPlan");
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto text-center py-20 px-4 sm:px-6">
      <div className="surface-sheet dotgrid p-8 sm:p-12 border border-line relative overflow-hidden">
        {/* Notebook top edge primary accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-moss-700 pointer-events-none" />

        {/* Hand-drawn open field notebook illustration */}
        <div className="mx-auto w-24 h-24 mb-5 flex items-center justify-center">
          <svg
            viewBox="0 0 96 96"
            className="w-full h-full text-moss-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Open notebook covers */}
            <path
              d="M16 22 C 32 18, 44 20, 48 24 C 52 20, 64 18, 80 22 L 80 76 C 64 72, 52 74, 48 78 C 44 74, 32 72, 16 76 Z"
              className="fill-paper-raised stroke-moss-700"
            />
            {/* Center bound spine */}
            <line
              x1="48"
              y1="24"
              x2="48"
              y2="78"
              className="stroke-clay-700"
              strokeWidth="2"
            />
            {/* Ruled lines on left page */}
            <line x1="22" y1="34" x2="42" y2="34" className="stroke-line" strokeWidth="1.2" />
            <line x1="22" y1="44" x2="42" y2="44" className="stroke-line" strokeWidth="1.2" />
            <line x1="22" y1="54" x2="42" y2="54" className="stroke-line" strokeWidth="1.2" />
            <line x1="22" y1="64" x2="38" y2="64" className="stroke-line" strokeWidth="1.2" />
            {/* Ruled lines on right page */}
            <line x1="54" y1="34" x2="74" y2="34" className="stroke-line" strokeWidth="1.2" />
            <line x1="54" y1="44" x2="74" y2="44" className="stroke-line" strokeWidth="1.2" />
            <line x1="54" y1="54" x2="70" y2="54" className="stroke-line" strokeWidth="1.2" />
            {/* Sprout bookmark marker */}
            <path
              d="M48 24 Q 44 14, 40 16 Q 44 20, 48 24"
              className="stroke-moss-700 fill-moss-200"
              strokeWidth="1.5"
            />
            <path
              d="M48 24 Q 52 12, 56 15 Q 52 20, 48 24"
              className="stroke-moss-700 fill-moss-300"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="mb-4">
          <Stamp variant="clay">404 UNCHARTED</Stamp>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-2">
          Page Not Found in Ledger
        </h1>

        <p className="text-ink-muted text-xs sm:text-sm mt-3 mb-8 max-w-sm mx-auto leading-relaxed">
          This entry appears to have slipped between the ruled leaves of our field notebook. The URL may be mistyped or the record archived.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost text-xs py-2 px-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Turn Back One Page</span>
          </button>
          <Link to="/" className="btn-primary text-xs py-2 px-5">
            <Home className="w-4 h-4" />
            <span>Return to Cover</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
