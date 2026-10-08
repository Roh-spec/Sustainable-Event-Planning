import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Calendar, Users, Clock, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { WizardProgress } from '../components/wizard/WizardProgress';
import { eventsApi } from '../api/events';
import { EVENT_TYPE_OPTIONS, EventType } from '../types/events';

export const EventCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const { event, setEvent, loadEvent, budget, setBudget } = usePlanningWizard();

  const [name, setName] = useState(event?.name || '');
  const [eventType, setEventType] = useState<EventType | string>(event?.event_type || 'TECH_FEST');
  const [expectedAttendees, setExpectedAttendees] = useState<string>(
    event?.expected_attendees ? String(event.expected_attendees) : '150'
  );
  const [durationDays, setDurationDays] = useState<string>(
    event?.duration_days ? String(event.duration_days) : '1'
  );
  const [location, setLocation] = useState(event?.location || 'College Campus Auditorium');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If editing an existing event ID from route
  useEffect(() => {
    if (eventId) {
      loadEvent(Number(eventId))
        .then((ev) => {
          setName(ev.name);
          setEventType(ev.event_type);
          setExpectedAttendees(String(ev.expected_attendees));
          setDurationDays(String(ev.duration_days));
          setLocation(ev.location || '');
        })
        .catch((err) => {
          setError(`Failed to load event: ${err.message}`);
        });
    }
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validation
    if (!name.trim()) {
      setError('Event Name is required.');
      return;
    }
    const attendeesNum = parseInt(expectedAttendees, 10);
    if (isNaN(attendeesNum) || attendeesNum <= 0) {
      setError('Expected Attendees must be a positive integer greater than 0.');
      return;
    }
    const durationNum = parseInt(durationDays, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Duration in days must be a positive integer greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (event?.id && eventId) {
        // Event already exists, update context and advance
        setEvent({
          ...event,
          name,
          event_type: eventType,
          expected_attendees: attendeesNum,
          duration_days: durationNum,
          location: location.trim() || null,
        });
        navigate(`/events/${event.id}/budget`);
      } else {
        // Create new event in backend
        const createdEvent = await eventsApi.create({
          name: name.trim(),
          event_type: eventType,
          expected_attendees: attendeesNum,
          duration_days: durationNum,
          location: location.trim() || null,
          budget: budget.total_budget
            ? {
                total_budget: budget.total_budget,
                currency: budget.currency || 'INR',
              }
            : undefined,
        });

        setEvent(createdEvent);
        if (createdEvent.budget?.total_budget) {
          setBudget({
            total_budget: String(createdEvent.budget.total_budget),
            currency: createdEvent.budget.currency || 'INR',
          });
        }
        navigate(`/events/${createdEvent.id}/budget`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event. Please verify backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={1} eventId={event?.id} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 1 of 6 • Event Details</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {eventId ? 'Edit Event Details' : 'Create Your Sustainable Event'}
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Provide the basic event footprint parameters. These will form the foundation for domain food calculations,
            waste stream evaluations, and multi-objective planning alternatives.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Validation Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="event-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Event Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual College Tech Fest 2026"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
              required
            />
          </div>

          {/* Event Type & Expected Attendees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="event-type" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Event Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.description}
              </p>
            </div>

            <div>
              <label htmlFor="expected-attendees" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Expected Attendees <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  id="expected-attendees"
                  min="1"
                  step="1"
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Directly drives meal servings and packaging estimations.</p>
            </div>
          </div>

          {/* Duration & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="duration-days" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Duration (Days) <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  id="duration-days"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="event-location" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Location / Venue
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="event-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium, Block C"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Event Date (Optional) */}
          <div>
            <label htmlFor="event-date" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Event Date <span className="text-xs font-normal text-slate-400 lowercase">(optional)</span>
            </label>
            <div className="relative rounded-xl max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                id="event-date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all focus:outline-none"
            >
              <span>{isSubmitting ? 'Saving Event...' : 'Continue to Budget Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
