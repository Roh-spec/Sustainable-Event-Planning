import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, MapPin, Wallet, Edit2 } from 'lucide-react';
import { EventResponse } from '../../types';

interface EventSummaryBannerProps {
  event: EventResponse | null;
  budget?: { total_budget: string; currency: string };
}

export const EventSummaryBanner: React.FC<EventSummaryBannerProps> = ({ event, budget }) => {
  if (!event) return null;

  const formattedBudget = budget?.total_budget
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: budget.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(Number(budget.total_budget))
    : null;

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-8 shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {event.event_type?.replace('_', ' ') || 'EVENT'}
            </span>
            <span className="text-xs text-slate-400">Event ID #{event.id}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">{event.name}</h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm text-slate-200">
          <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>
              <strong className="text-white">{event.expected_attendees}</strong> Attendees
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>
              <strong className="text-white">{event.duration_days}</strong> {event.duration_days === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="max-w-[140px] truncate">{event.location}</span>
            </div>
          )}

          {formattedBudget && (
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-200 font-semibold">
              <Wallet className="w-4 h-4 text-emerald-300" />
              <span>Budget: {formattedBudget}</span>
            </div>
          )}

          <Link
            to={`/events/${event.id}/edit`}
            className="inline-flex items-center space-x-1 text-xs text-slate-300 hover:text-white underline underline-offset-2 py-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
