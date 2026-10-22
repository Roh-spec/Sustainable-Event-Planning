import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Clock, MapPin, ArrowRight, Search } from "lucide-react";
import { eventsApi } from "../api/events";
import { EventResponse } from "../types/events";
import { usePageTitle } from "../hooks/usePageTitle";
import { Reveal } from "../components/common/Reveal";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { SkeletonLines } from "../components/common/SkeletonLines";

export const EventsListPage: React.FC = () => {
  usePageTitle("Events Directory · EcoPlan");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = () => {
    setIsLoading(true);
    setError(null);
    eventsApi
      .list(0, 100)
      .then((data) => setEvents(data))
      .catch((err) =>
        setError(err.message || "Failed to fetch events from database."),
      )
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location &&
        e.location.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-6">
          <div>
            <span className="label-kicker text-[11px] block mb-1">
              Event Registry
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Event Management Directory
            </h1>
            <p className="text-ink-muted text-xs sm:text-sm mt-1">
              Browse all events recorded in the sustainable planning ledger.
            </p>
          </div>

          <Link to="/events/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>New Sustainable Event</span>
          </Link>
        </div>
      </Reveal>

      {/* Search Filter */}
      <Reveal delay={40}>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by event name, type, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-control border border-line text-xs font-mono bg-paper-raised text-ink focus:outline-none focus:border-moss-700"
          />
        </div>
      </Reveal>

      {/* Ledger Directory Rows */}
      <Reveal delay={80}>
        {isLoading ? (
          <div className="surface-sheet p-6 space-y-3">
            <SkeletonLines lines={5} />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Event Directory"
            message={error}
            onRetry={fetchEvents}
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No events matching search"
            description={
              searchTerm
                ? `No event records match "${searchTerm}". Clear search query or record a new event.`
                : "No events recorded in the registry ledger yet. Click below to begin."
            }
            action={
              <Link to="/events/new" className="btn-primary text-xs px-4 py-2">
                <Plus className="w-3.5 h-3.5" />
                <span>New Sustainable Event</span>
              </Link>
            }
          />
        ) : (
          <div className="surface-sheet overflow-hidden border border-line divide-y divide-line/60">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-paper-inset/30 transition-colors"
              >
                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 mb-1.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-line text-moss-800 bg-paper-inset">
                      {ev.event_type.replace("_", " ")}
                    </span>
                    <span className="font-mono text-xs text-ink-muted tabular-nums">
                      #{ev.id}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-ink truncate">
                    {ev.name}
                  </h3>

                  <div className="flex items-center flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-ink-muted mt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                      <span className="tabular-nums">
                        {ev.expected_attendees} attendees
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                      <span className="tabular-nums">
                        {ev.duration_days}{" "}
                        {ev.duration_days === 1 ? "day" : "days"}
                      </span>
                    </span>

                    {ev.location && (
                      <span className="inline-flex items-center gap-1.5 max-w-[200px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </span>
                    )}

                    {ev.budget?.total_budget && (
                      <span className="font-semibold text-moss-800 tabular-nums">
                        ₹{Number(ev.budget.total_budget).toLocaleString()} ceiling
                      </span>
                    )}
                  </div>
                </div>

                {/* Ledger Actions */}
                <div className="flex items-center space-x-3 pt-2 md:pt-0 self-end md:self-center flex-shrink-0">
                  <Link
                    to={`/events/${ev.id}/budget`}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Edit Config
                  </Link>
                  <Link
                    to={`/events/${ev.id}/plans`}
                    className="btn-primary text-xs px-3.5 py-1.5"
                  >
                    <span>View Plans</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
};
