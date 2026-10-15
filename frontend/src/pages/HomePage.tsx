import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Users,
  Clock,
  Wallet,
  Trash2,
  Utensils,
  Layers,
  Scale,
} from "lucide-react";
import { eventsApi } from "../api/events";
import { EventResponse } from "../types/events";
import { staggerEntrance } from "../utils/animations";

const WORKFLOW_STEPS = [
  { step: "01", label: "Event", desc: "Type, people, duration", icon: Calendar },
  { step: "02", label: "Budget", desc: "A hard ceiling in ₹", icon: Wallet },
  { step: "03", label: "Limits", desc: "Must-haves and avoid", icon: ShieldCheck },
  { step: "04", label: "Food", desc: "Meals and leftovers", icon: Utensils },
  { step: "05", label: "Waste", desc: "Reusable vs single-use", icon: Trash2 },
  { step: "06", label: "Plans", desc: "Three honest options", icon: Sparkles },
];

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    eventsApi
      .list(0, 10)
      .then((data) => setEvents(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));

    staggerEntrance(".stagger-card", {
      delay: 100,
      stagger: 80,
      translateY: 16,
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      <section className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-end">
        <div className="lg:col-span-7 space-y-6">
          <p className="label-kicker">A notebook for the event, not a score</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.08]">
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
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to="/events/new" className="btn-primary px-6 py-3.5 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Start planning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/events" className="btn-ghost px-6 py-3.5 text-sm">
              <Calendar className="w-4 h-4 text-moss-700" />
              <span>Browse events</span>
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="surface-sheet p-6 sm:p-8 space-y-5">
            <p className="label-kicker">What you will see</p>
            <ul className="space-y-4">
              <li className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <span className="text-sm text-ink-muted">Food waste</span>
                <span className="font-mono text-lg text-ink">kg</span>
              </li>
              <li className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <span className="text-sm text-ink-muted">Packaging</span>
                <span className="font-mono text-lg text-ink">items</span>
              </li>
              <li className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-ink-muted">Spend vs ceiling</span>
                <span className="font-mono text-lg text-clay-600">₹</span>
              </li>
            </ul>
            <p className="text-sm text-ink-muted leading-relaxed">
              Three alternatives: lean budget, balanced, or lower-waste. You
              pick. The engine does not hide a deficit.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="stagger-card card-hover surface-sheet p-6 sm:p-7 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-moss-100 text-moss-800 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl text-ink">Physical units</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Kilograms of leftovers, counts of cups and plates, rupees on the
            line. Nothing is flattened into a fake green score.
          </p>
        </article>

        <article className="stagger-card card-hover surface-sheet p-6 sm:p-7 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-clay-50 text-clay-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl text-ink">A hard ceiling</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            If a plan does not fit the budget, EcoPlan says so and waits for
            you — it does not quietly inflate the number.
          </p>
        </article>

        <article className="stagger-card card-hover surface-sheet p-6 sm:p-7 space-y-3 md:bg-moss-950 md:text-paper-raised md:border-moss-900">
          <div className="w-10 h-10 rounded-lg bg-moss-800 text-moss-100 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl text-ink md:text-paper-raised">
            Real trade-offs
          </h2>
          <p className="text-sm text-ink-muted md:text-moss-200 leading-relaxed">
            Spend a little more, throw away a little less. Compare budget,
            balanced, and sustainability-focused plans side by side.
          </p>
        </article>
      </section>

      <section className="surface-sheet p-6 sm:p-8 space-y-6">
        <div>
          <p className="label-kicker">Guided path</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink mt-1">
            One notebook, six pages
          </h2>
        </div>

        <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="rounded-xl border border-line bg-paper p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-moss-700">
                    {item.step}
                  </span>
                  <Icon className="w-4 h-4 text-moss-700" />
                </div>
                <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
                <p className="text-xs text-ink-muted leading-snug">{item.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <div className="flex justify-between items-end mb-5 gap-4">
          <div>
            <p className="label-kicker">On the desk</p>
            <h2 className="font-display text-2xl text-ink mt-1">
              Recent events
            </h2>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-moss-800 hover:text-moss-950"
          >
            View all ({events.length}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-ink-faint">
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-line-strong rounded-sheet text-ink-muted text-sm">
            Nothing here yet. Start planning to open the first notebook.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 6).map((ev) => (
              <article
                key={ev.id}
                className="surface-sheet p-5 flex flex-col justify-between card-hover"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-moss-100 text-moss-800">
                      {ev.event_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-ink-faint font-mono">
                      #{ev.id}
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-ink tracking-tight">
                    {ev.name}
                  </h3>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-ink-muted mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {ev.expected_attendees}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {ev.duration_days}d
                    </span>
                    {ev.budget?.total_budget && (
                      <span className="font-semibold text-ink">
                        ₹{Number(ev.budget.total_budget).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex justify-between items-center text-sm">
                  <Link
                    to={`/events/${ev.id}/plans`}
                    className="font-semibold text-moss-800 hover:text-moss-950 inline-flex items-center gap-1"
                  >
                    View plans
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/events/${ev.id}/budget`}
                    className="text-ink-faint hover:text-ink font-medium"
                  >
                    Configure
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-sm text-ink-faint max-w-2xl">
        Today: event, budget, constraints, food, waste, and comparable plans.
        Later: energy, travel, venue, and carbon.
      </p>
    </div>
  );
};
