import React from "react";
import { Link } from "react-router-dom";
import { Users, Clock, MapPin, Wallet, Edit2 } from "lucide-react";
import { EventResponse } from "../../types";

interface EventSummaryBannerProps {
  event: EventResponse | null;
  budget?: { total_budget: string; currency: string };
}

export const EventSummaryBanner: React.FC<EventSummaryBannerProps> = ({
  event,
  budget,
}) => {
  if (!event) return null;

  const formattedBudget = budget?.total_budget
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: budget.currency || "INR",
        maximumFractionDigits: 0,
      }).format(Number(budget.total_budget))
    : null;

  return (
    <div className="mb-8 rounded-sheet bg-moss-950 text-paper-raised p-5 sm:p-6 border border-moss-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[11px] uppercase font-semibold tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-moss-800 text-moss-100 font-mono">
              {event.event_type?.replace("_", " ") || "EVENT"}
            </span>
            <span className="text-xs text-moss-300 font-mono">
              #{event.id}
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight text-paper-raised mt-2">
            {event.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-sm text-moss-100">
          <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-control border border-white/10 font-mono text-xs tabular-nums">
            <Users className="w-4 h-4 text-moss-300" />
            <span>
              <strong className="text-paper-raised font-semibold">
                {event.expected_attendees}
              </strong>{" "}
              Attendees
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-control border border-white/10 font-mono text-xs tabular-nums">
            <Clock className="w-4 h-4 text-moss-300" />
            <span>
              <strong className="text-paper-raised font-semibold">
                {event.duration_days}
              </strong>{" "}
              {event.duration_days === 1 ? "Day" : "Days"}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-control border border-white/10 text-xs">
              <MapPin className="w-4 h-4 text-moss-300" />
              <span className="max-w-[140px] truncate">{event.location}</span>
            </div>
          )}

          {formattedBudget && (
            <div className="flex items-center space-x-1.5 bg-clay-500/20 px-3 py-1.5 rounded-control border border-clay-400/30 text-clay-100 font-semibold font-mono text-xs tabular-nums">
              <Wallet className="w-4 h-4 text-clay-200" />
              <span>Budget: {formattedBudget}</span>
            </div>
          )}

          <Link
            to={`/events/${event.id}/edit`}
            className="inline-flex items-center space-x-1 text-xs text-moss-200 hover:text-paper-raised underline underline-offset-2 py-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
