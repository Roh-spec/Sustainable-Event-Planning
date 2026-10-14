import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Leaf,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Users,
  Clock,
  Wallet,
  Trash2,
  Utensils,
  Layers,
} from "lucide-react";
import { eventsApi } from "../api/events";
import { EventResponse } from "../types/events";
import { EcoParticleCanvas } from "../components/effects/EcoParticleCanvas";
import { staggerEntrance } from "../utils/animations";

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

    // Stagger in cards on page mount with Anime.js
    staggerEntrance(".stagger-card", {
      delay: 100,
      stagger: 80,
      translateY: 16,
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-8 sm:p-14 shadow-xl border border-emerald-900/50">
        {/* Ambient Eco-Particle Canvas (Casberry Inspired) */}
        <EcoParticleCanvas
          density={40}
          speedMultiplier={0.45}
          theme="dark"
          interactive={true}
        />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide uppercase border border-emerald-500/40">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Objective Planning Engine (Phase 3B)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Plan Events that{" "}
            <span className="text-emerald-400">
              Reduce Environmental Impact
            </span>{" "}
            While Respecting Budget & Constraints.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Not a generic event planner with a green label. EcoPlan combines
            rigorous Food & Waste domain engines to estimate physical food
            waste, packaging items, and plastic footprints with total
            explainability.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <Link
              to="/events/new"
              className="inline-flex items-center space-x-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 transition-all focus:outline-none"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Guided Event Planning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/events"
              className="inline-flex items-center space-x-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-colors"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>View Existing Events</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Product Pillars / Measurable Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stagger-card card-hover bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Zero Arbitrary Scores
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We never invent fake scores like "87/100" or arbitrary weights.
            Every indicator represents physical units: kilograms of food waste,
            single-use items count, and exact currency amounts.
          </p>
        </div>

        <div className="stagger-card card-hover bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Zero Silent Inflation
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our planning engine strictly evaluates feasibility against your
            stated budget ceiling. If a budget is insufficient, it reports the
            deficit and asks for explicit organizer confirmation before
            adjusting.
          </p>
        </div>

        <div className="stagger-card card-hover bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Multi-Objective Trade-Offs
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate and compare up to three distinct alternatives:{" "}
            <strong>Budget-Focused</strong>, <strong>Balanced</strong>, and{" "}
            <strong>Sustainability-Focused</strong>, answering "What do I gain
            if I spend more?"
          </p>
        </div>
      </div>

      {/* Guided Workflow Steps Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Guided Workflow
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            One Continuous Planning Experience
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {[
            {
              step: "1. Event",
              desc: "Type, attendees, duration",
              icon: Calendar,
            },
            { step: "2. Budget", desc: "Explicit ceiling in ₹", icon: Wallet },
            {
              step: "3. Constraints",
              desc: "Required & Not Allowed",
              icon: ShieldCheck,
            },
            { step: "4. Food", desc: "Meal schedules & waste", icon: Utensils },
            { step: "5. Waste", desc: "Reusable vs. Single-use", icon: Trash2 },
            {
              step: "6. Plans",
              desc: "Alternative comparison",
              icon: Sparkles,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  {item.step}
                </h4>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Events List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Recent Events in System</span>
          </h2>
          <Link
            to="/events"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            View All ({events.length}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading events from backend...
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
            No events found. Click "Start Guided Event Planning" above to create
            your first sustainable event!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 6).map((ev) => (
              <div
                key={ev.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ev.event_type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-400">#{ev.id}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {ev.name}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.expected_attendees}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.duration_days}d</span>
                    </span>
                    {ev.budget?.total_budget && (
                      <span className="font-semibold text-slate-700">
                        ₹{Number(ev.budget.total_budget).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <Link
                    to={`/events/${ev.id}/plans`}
                    className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center space-x-1"
                  >
                    <span>View Plans</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to={`/events/${ev.id}/budget`}
                    className="text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module Scope Notice */}
      <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
        <h4 className="font-bold text-slate-800">
          Current Scope & Future Modules
        </h4>
        <p>
          <strong>Implemented in Phase 3B:</strong> Event Management, Budget
          Ceilings, Constraints Engine, Food & Catering Module, Waste &
          Packaging Module, Multi-Objective Candidate Optimization, Comparative
          Trade-Off Table.
        </p>
        <p className="text-slate-500">
          <strong>Future Phases:</strong> Energy Consumption, Participant
          Transportation, Venue Selection, Carbon Accounting, Vendor
          Marketplace, Machine Learning Forecasting.
        </p>
      </div>
    </div>
  );
};
