import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Clock, MapPin, ArrowRight, Search } from 'lucide-react';
import { eventsApi } from '../api/events';
import { EventResponse } from '../types/events';

export const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    eventsApi
      .list(0, 100)
      .then((data) => setEvents(data))
      .catch((err) => setError(err.message || 'Failed to fetch events from backend.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredEvents = events.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Management Directory
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Browse all events managed in the sustainable planning database.
          </p>
        </div>

        <Link
          to="/events/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>New Sustainable Event</span>
        </Link>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by event name, type, or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Events Table / Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
          No events matching search. Click "New Sustainable Event" above to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {ev.event_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">#{ev.id}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{ev.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.expected_attendees} Expected Attendees</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.duration_days} {ev.duration_days === 1 ? 'Day' : 'Days'} Duration</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                  {ev.budget?.total_budget && (
                    <div className="pt-2 text-xs font-semibold text-emerald-800">
                      Budget: ₹{Number(ev.budget.total_budget).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <Link
                  to={`/events/${ev.id}/plans`}
                  className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center space-x-1"
                >
                  <span>Generate / View Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/events/${ev.id}/budget`}
                  className="text-slate-400 hover:text-slate-600 font-medium"
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
