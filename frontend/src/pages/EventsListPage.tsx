import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Clock, MapPin, ArrowRight, Search } from "lucide-react";
import { eventsApi } from "../api/events";
import { EventResponse } from "../types/events";

export const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Events Directory · EcoPlan";
    setIsLoading(true);
    eventsApi
      .list(0, 100)
      .then((data) => setEvents(data))
      .catch((err) =>
        setError(err.message || "Failed to fetch events from database."),
      )
      .finally(() => setIsLoading(false));
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-6">
        <div>
          <span className="label-kicker text-[11px] block mb-1">
            Event Registry
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Event Management Directory
          </h1>
          <p className="text-ink-muted text-xs sm:text-sm mt-1">
            Browse all events managed in the sustainable planning ledger.
          </p>
        </div>

        <Link
          to="/events/new"
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Sustainable Event</span>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-control bg-clay-50 border border-clay-300 text-clay-900 text-sm"
        >
          {error}
        </div>
      )}

      {/* Search Filter */}
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

      {/* Events Table / Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-ink-muted font-mono">
          Loading events ledger...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-line rounded-sheet bg-paper-inset/20 text-ink-muted text-xs">
          No events matching search. Click "New Sustainable Event" above to
          record one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="surface-sheet p-5 transition-all flex flex-col justify-between card-hover"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-paper-inset text-moss-800 border border-line font-mono">
                    {ev.event_type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-ink-muted font-mono tabular-nums">
                    #{ev.id}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink tracking-tight">
                  {ev.name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-ink-muted">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="font-mono tabular-nums">{ev.expected_attendees} Expected Attendees</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="font-mono tabular-nums">
                      {ev.duration_days}{" "}
                      {ev.duration_days === 1 ? "Day" : "Days"} Duration
                    </span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                  {ev.budget?.total_budget && (
                    <div className="pt-2 text-xs font-semibold text-moss-800 font-mono tabular-nums">
                      Budget: ₹{Number(ev.budget.total_budget).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line flex justify-between items-center text-xs">
                <Link
                  to={`/events/${ev.id}/plans`}
                  className="font-bold text-moss-700 hover:text-moss-900 inline-flex items-center space-x-1"
                >
                  <span>Generate / View Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/events/${ev.id}/budget`}
                  className="text-ink-muted hover:text-ink font-medium"
                >
                  Edit Config
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
