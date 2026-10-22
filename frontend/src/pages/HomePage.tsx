import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Users,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { eventsApi } from "../api/events";
import { EventResponse } from "../types/events";
import { MarginNote } from "../components/common/MarginNote";
import {
  SproutIcon,
  ScaleIcon,
  PlateIcon,
  BinIcon,
  LedgerIcon,
  HackathonMark,
} from "../components/icons";
import { AnimatedCounter } from "../components/common/AnimatedCounter";

const WORKFLOW_STEPS = [
  { step: "01", label: "Event", desc: "Type, count & duration", icon: HackathonMark },
  { step: "02", label: "Budget", desc: "Hard ceiling in ₹", icon: ScaleIcon },
  { step: "03", label: "Limits", desc: "Must-haves & dietary", icon: SproutIcon },
  { step: "04", label: "Food", desc: "Meal quantities & surplus", icon: PlateIcon },
  { step: "05", label: "Waste", desc: "Disposables vs reusable", icon: BinIcon },
  { step: "06", label: "Plans", desc: "Side-by-side ledger", icon: LedgerIcon },
];

export const HomePage: React.FC = () => {
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
        setFetchError("Unable to retrieve saved events ledger. Server may be warming up.");
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      {/* Hero Section */}
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
            <Link to="/events/new" className="btn-primary px-6 py-3 text-sm">
              <span>Start planning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/events" className="btn-ghost px-6 py-3 text-sm">
              <Calendar className="w-4 h-4 text-moss-700" />
              <span>Browse events</span>
            </Link>
          </div>

          {/* Core ledger guarantees */}
          <div className="pt-6 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="font-mono text-xs uppercase font-bold text-ink block mb-0.5">Physical Units</span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Kg surplus, disposable counts, rupee spends. Never flattened into composite grades.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs uppercase font-bold text-ink block mb-0.5">Strict Ceilings</span>
              <p className="text-xs text-ink-muted leading-relaxed">
                If a plan exceeds your ceiling, the ledger stamps it. No hidden budget creep.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs uppercase font-bold text-ink block mb-0.5">Clear Trade-Offs</span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Know exactly what ₹1,000 extra buys you in reduced single-use trash.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Real worked 150-person Hackathon example ledger */}
        <aside className="lg:col-span-5">
          <div className="surface-sheet p-6 bg-paper-raised border border-line relative overflow-hidden">
            <div className="flex items-start justify-between border-b border-line pb-3 mb-4">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-moss-700">
                  Worked Case Study
                </span>
                <h3 className="font-display text-xl font-semibold text-ink">
                  150-Person Hackathon
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-line-strong rounded-control bg-paper-inset text-ink-muted">
                Example, not your data
              </span>
            </div>

            {/* Big visual anchor number */}
            <div className="bg-paper p-4 rounded-control border border-line/70 mb-4">
              <div className="flex items-baseline space-x-1.5">
                <span className="font-display text-display-xl text-moss-700 font-bold tabular-nums">
                  −<AnimatedCounter value={26} duration={900} />
                </span>
                <span className="font-display text-2xl text-ink font-semibold">kg</span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                Food surplus averted with portion adjustments
              </p>
            </div>

            {/* Before vs After Ledger */}
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between pb-1.5 text-ink-muted font-bold uppercase border-b border-line text-[10px] tracking-wider">
                <span>Metric</span>
                <div className="flex space-x-6 text-right">
                  <span className="w-16">Lean Plan</span>
                  <span className="w-20 text-moss-800">Low-Waste</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline py-1.5 border-b border-line/40">
                <span className="text-ink">Food Surplus</span>
                <div className="flex space-x-6 text-right tabular-nums">
                  <span className="w-16 text-ink-muted">34 kg</span>
                  <span className="w-20 font-bold text-moss-800">8 kg (-26)</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline py-1.5 border-b border-line/40">
                <span className="text-ink">Single-Use Disposables</span>
                <div className="flex space-x-6 text-right tabular-nums">
                  <span className="w-16 text-ink-muted">620 items</span>
                  <span className="w-20 font-bold text-moss-800">90 items</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline py-2 double-rule-top double-rule-bottom font-semibold">
                <span className="text-ink">Total Spend</span>
                <div className="flex space-x-6 text-right tabular-nums">
                  <span className="w-16 text-ink">₹42,500</span>
                  <span className="w-20 text-ink font-bold">₹46,800</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1.5 text-[11px] text-ink-muted">
                <span>Budget Ceiling</span>
                <span className="font-bold text-ink tabular-nums">₹50,000 (Within limit)</span>
              </div>
            </div>

            <MarginNote type="note" label="Organizer Note" className="mt-4">
              With ₹4,300 allocated toward washable thalis and compostable bin liners, this hackathon eliminated 530 disposables without breaking the ceiling.
            </MarginNote>
          </div>
        </aside>
      </section>

      {/* Guided Path: Single Horizontal Ruled Timeline */}
      <section className="surface-sheet p-6 sm:p-8 space-y-6">
        <div className="border-b border-line pb-4">
          <span className="label-kicker">Field Guide</span>
          <h2 className="font-display text-2xl sm:text-3xl text-ink mt-0.5">
            The Six Ledger Steps
          </h2>
          <p className="text-xs text-ink-muted font-sans mt-1">
            A sequential planning flow designed around real physical constraints.
          </p>
        </div>

        {/* Timeline: horizontal on desktop, vertical on mobile */}
        <div className="relative pt-2">
          {/* Desktop horizontal rule */}
          <div className="hidden lg:block absolute top-[28px] left-6 right-6 h-[1px] bg-line-strong z-0" />

          {/* Mobile vertical rule */}
          <div className="lg:hidden absolute top-4 bottom-4 left-[23px] w-[1px] bg-line-strong z-0" />

          <ol className="grid grid-cols-1 lg:grid-cols-6 gap-6 lg:gap-4 relative z-10">
            {WORKFLOW_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className="flex lg:flex-col items-start lg:items-start space-x-4 lg:space-x-0 group"
                >
                  {/* Step marker node */}
                  <div className="w-12 h-12 rounded-full border border-line-strong bg-paper-raised flex items-center justify-center flex-shrink-0 text-moss-700 shadow-subtle group-hover:border-moss-700 transition-colors">
                    <Icon size={20} className="stroke-[1.75]" />
                  </div>

                  <div className="lg:mt-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold text-moss-700">
                        {item.step}
                      </span>
                      <h3 className="font-display text-base font-semibold text-ink">
                        {item.label}
                      </h3>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Recent Events Section */}
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
          <div className="surface-sheet p-8 text-center space-y-3">
            <div className="ruled h-16 w-full opacity-60 rounded-control" />
            <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Loading recent events ledger…
            </p>
          </div>
        ) : fetchError ? (
          <div className="surface-sheet p-6 border-clay-700/60 bg-clay-50/40 space-y-3">
            <div className="flex items-center space-x-2 text-clay-800 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={loadEvents}
              className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry loading ledger</span>
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="surface-sheet dotgrid p-10 text-center space-y-3 border-dashed">
            <h3 className="font-display text-lg text-ink font-semibold">
              The ledger desk is clear
            </h3>
            <p className="text-sm text-ink-muted max-w-md mx-auto">
              No saved event plans found yet. Begin a new event ledger to compute food surplus, packaging items, and budget ceilings.
            </p>
            <div className="pt-2">
              <Link to="/events/new" className="btn-primary text-xs px-4 py-2">
                Create First Event Ledger →
              </Link>
            </div>
          </div>
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
    </div>
  );
};

