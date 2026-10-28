import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Users,
  Clock,
} from "lucide-react";
import { eventsApi } from "../api/events";
import { EventResponse } from "../types/events";
import { usePageTitle } from "../hooks/usePageTitle";
import { Reveal } from "../components/common/Reveal";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { SkeletonLines } from "../components/common/SkeletonLines";
import { HomeWorkedExample } from "../components/home/HomeWorkedExample";
import { HomeWorkflowRoute } from "../components/home/HomeWorkflowRoute";

export const HomePage: React.FC = () => {
  usePageTitle("Sustainable Event Planning · EcoPlan");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadEvents = () => {
    setIsLoading(true);
    setFetchError(null);
    eventsApi
      .list(0, 8)
      .then((data) => setEvents(data))
      .catch((err) => {
        setFetchError(
          "Unable to retrieve saved events ledger. Server connection may be interrupted.",
        );
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      {/* Asymmetric Hero Section */}
      <Reveal>
        <section className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-moss-700 bg-moss-50 px-3 py-1 rounded-control border border-moss-200">
              <span>Working ledger & field notebook</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.08] tracking-tight">
              Plan the gathering.
              <br />
              Count the waste.
              <br />
              <span className="text-moss-700">Keep the budget honest.</span>
            </h1>

            <p className="text-ink-muted text-base sm:text-lg leading-relaxed max-w-xl">
              EcoPlan estimates kilograms of food waste, packaging counts, and
              rupees — then shows what you gain if you spend a little more. No
              invented 87/100 sustainability scores.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/events/new" className="btn-primary px-7 py-3.5 text-sm sm:text-base shadow-sm font-semibold tracking-tight">
                <span>Start planning</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/events" className="inline-flex items-center justify-center gap-2 rounded-control border border-line bg-paper-raised/40 px-5 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink hover:border-line-strong hover:bg-paper-raised">
                <Calendar className="w-4 h-4 text-moss-700" />
                <span>Browse events</span>
              </Link>
            </div>

            {/* Core Ledger Principles */}
            <div className="pt-6 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-moss-800 tracking-wider uppercase block">
                  01 / Physical Units
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Kg surplus, disposable counts, and rupee spends. Never flattened
                  into composite grades.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-moss-800 tracking-wider uppercase block">
                  02 / Strict Ceilings
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  If a plan exceeds your ceiling, the ledger stamps it. No
                  hidden budget creep.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-moss-800 tracking-wider uppercase block">
                  03 / Clear Trade-Offs
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Know exactly what ₹1,000 extra buys you in reduced single-use
                  trash.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Glass Worked Example */}
          <aside className="lg:col-span-5 w-full">
            <HomeWorkedExample />
          </aside>
        </section>
      </Reveal>

      {/* Guided Path: Waypoint Route */}
      <Reveal delay={60}>
        <HomeWorkflowRoute />
      </Reveal>

      {/* Recent Events Section */}
      <Reveal delay={120}>
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-line pb-3">
            <div>
              <span className="label-kicker">On The Desk</span>
              <h2 className="font-display text-2xl text-ink mt-0.5">
                Recent Event Ledgers
              </h2>
            </div>
            <Link
              to="/events"
              className="text-sm font-mono font-semibold text-moss-800 hover:text-moss-950 inline-flex items-center gap-1.5"
            >
              <span>All event files ({events.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="surface-sheet p-6 space-y-4 min-h-[220px]">
              <SkeletonLines lines={4} />
            </div>
          ) : fetchError ? (
            <ErrorState
              title="Unable to retrieve saved events ledger"
              message={fetchError}
              onRetry={loadEvents}
            />
          ) : events.length === 0 ? (
            <EmptyState
              title="The ledger desk is clear"
              description="No saved event plans found yet. Begin a new event ledger to compute food surplus, packaging items, and budget ceilings."
              action={
                <Link to="/events/new" className="btn-primary text-xs px-4 py-2">
                  <span>Create First Event Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
          ) : (
            <div className="surface-sheet overflow-hidden border border-line divide-y divide-line/60">
              {events.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-inset/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5 mb-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-moss-700 text-moss-800 bg-moss-50">
                        {ev.event_type.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs text-ink-muted">
                        #{ev.id}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-ink truncate">
                      {ev.name}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-muted mt-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {ev.expected_attendees} attendees
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {ev.duration_days}d
                      </span>
                      {ev.budget?.total_budget && (
                        <span className="font-bold text-ink">
                          ₹{Number(ev.budget.total_budget).toLocaleString()} ceiling
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2 sm:pt-0 self-end sm:self-center">
                    <Link
                      to={`/events/${ev.id}/budget`}
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      Budget
                    </Link>
                    <Link
                      to={`/events/${ev.id}/plans`}
                      className="btn-primary text-xs px-3.5 py-1.5"
                    >
                      <span>View plans</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
};
