import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle,
  Laptop,
  Music,
  Terminal,
  BookOpen,
  Presentation,
  Trophy,
  GraduationCap,
  Building2,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { eventsApi } from "../api/events";
import { EVENT_TYPE_OPTIONS, EventType } from "../types/events";

const EVENT_TYPE_TILES: {
  value: EventType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "TECH_FEST",
    label: "Tech Fest",
    desc: "Coding fairs & tech demos",
    icon: Laptop,
  },
  {
    value: "CULTURAL_FEST",
    label: "Cultural Fest",
    desc: "Performances, drama & arts",
    icon: Music,
  },
  {
    value: "HACKATHON",
    label: "Hackathon",
    desc: "Intensive 24-48h sprints",
    icon: Terminal,
  },
  {
    value: "WORKSHOP",
    label: "Workshop",
    desc: "Hands-on labs & seminars",
    icon: BookOpen,
  },
  {
    value: "CONFERENCE",
    label: "Conference",
    desc: "Keynotes & symposiums",
    icon: Presentation,
  },
  {
    value: "SPORTS_EVENT",
    label: "Sports Event",
    desc: "Tournaments & athletic meets",
    icon: Trophy,
  },
  {
    value: "FAREWELL",
    label: "Farewell",
    desc: "Graduation & batch send-offs",
    icon: GraduationCap,
  },
  {
    value: "DEPARTMENT_EVENT",
    label: "Department",
    desc: "Club meets & symposiums",
    icon: Building2,
  },
];

export const EventCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const { event, setEvent, loadEvent, budget, setBudget } = usePlanningWizard();

  const [name, setName] = useState(event?.name || "");
  const [eventType, setEventType] = useState<EventType | string>(
    event?.event_type || "TECH_FEST",
  );
  const [expectedAttendees, setExpectedAttendees] = useState<string>(
    event?.expected_attendees ? String(event.expected_attendees) : "150",
  );
  const [durationDays, setDurationDays] = useState<string>(
    event?.duration_days ? String(event.duration_days) : "1",
  );
  const [location, setLocation] = useState(
    event?.location || "College Campus Auditorium",
  );
  const [eventDate, setEventDate] = useState("");
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
          setLocation(ev.location || "");
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
      setError("Event Name is required.");
      return;
    }
    const attendeesNum = parseInt(expectedAttendees, 10);
    if (isNaN(attendeesNum) || attendeesNum <= 0) {
      setError("Expected Attendees must be a positive integer greater than 0.");
      return;
    }
    const durationNum = parseInt(durationDays, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError("Duration in days must be a positive integer greater than 0.");
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
                currency: budget.currency || "INR",
              }
            : undefined,
        });

        setEvent(createdEvent);
        if (createdEvent.budget?.total_budget) {
          setBudget({
            total_budget: String(createdEvent.budget.total_budget),
            currency: createdEvent.budget.currency || "INR",
          });
        }
        navigate(`/events/${createdEvent.id}/budget`);
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to create event. Please verify backend connection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={1} eventId={event?.id} />

      <div className="surface-sheet p-6 sm:p-10">
        <div className="border-b border-line pb-6 mb-8">
          <p className="label-kicker mb-2">Step 01 / Event details</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
            {eventId ? "Edit Event Details" : "Create Your Sustainable Event"}
          </h1>
          <p className="text-ink-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
            Provide the basic event footprint parameters. These form the
            foundation for domain food calculations, waste stream evaluations,
            and multi-objective planning alternatives.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-clay-50 border border-clay-300 text-clay-900 text-sm flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-clay-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Validation Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Event Name */}
          <div>
            <label
              htmlFor="event-name"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5"
            >
              Event Name <span className="text-clay-600">*</span>
            </label>
            <input
              type="text"
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual College Tech Fest 2026"
              className="w-full px-4 py-3 rounded-xl border border-line bg-paper text-ink text-sm font-medium focus:ring-2 focus:ring-moss-600 focus:border-moss-600 focus:bg-paper-raised transition-colors placeholder:text-ink-faint"
              required
            />
          </div>

          {/* Event Type as Illustrated Tiles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="event-type"
                className="block text-xs font-bold uppercase tracking-wider text-ink"
              >
                Event Type <span className="text-clay-600">*</span>
              </label>
              <span className="text-xs text-ink-muted">
                Select gathering format
              </span>
            </div>

            {/* Hidden native select keeps full accessibility and test compatibility */}
            <select
              id="event-type"
              aria-label="Event Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="sr-only"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Illustrated tile selection grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EVENT_TYPE_TILES.map((tile) => {
                const isSelected = eventType === tile.value;
                const TileIcon = tile.icon;
                return (
                  <button
                    key={tile.value}
                    type="button"
                    onClick={() => setEventType(tile.value)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-600/30 text-ink shadow-sm"
                        : "border-line bg-paper-inset/40 hover:bg-paper-inset hover:border-line-strong text-ink-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-moss-600 text-paper-raised"
                            : "bg-paper-raised text-ink-muted border border-line"
                        }`}
                      >
                        <TileIcon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-moss-600" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-ink block">
                        {tile.label}
                      </span>
                      <span className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                        {tile.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expected Attendees & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="expected-attendees"
                className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5"
              >
                Expected Attendees <span className="text-clay-600">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-paper text-ink text-sm font-medium focus:ring-2 focus:ring-moss-600 focus:border-moss-600 focus:bg-paper-raised transition-colors placeholder:text-ink-faint"
                  required
                />
              </div>
              <p className="text-xs text-ink-muted mt-1.5">
                Directly drives meal servings and packaging estimations.
              </p>
            </div>

            <div>
              <label
                htmlFor="duration-days"
                className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5"
              >
                Duration (Days) <span className="text-clay-600">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  id="duration-days"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-paper text-ink text-sm font-medium focus:ring-2 focus:ring-moss-600 focus:border-moss-600 focus:bg-paper-raised transition-colors placeholder:text-ink-faint"
                  required
                />
              </div>
              <p className="text-xs text-ink-muted mt-1.5">
                Multi-day schedules allow customized per-day meal planning.
              </p>
            </div>
          </div>

          {/* Location & Optional Event Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="event-location"
                className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5"
              >
                Location / Venue
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="event-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium, Block C"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-paper text-ink text-sm font-medium focus:ring-2 focus:ring-moss-600 focus:border-moss-600 focus:bg-paper-raised transition-colors placeholder:text-ink-faint"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="event-date"
                className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5"
              >
                Event Date{" "}
                <span className="text-xs font-normal text-ink-faint lowercase">
                  (optional)
                </span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  id="event-date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-paper text-ink text-sm font-medium focus:ring-2 focus:ring-moss-600 focus:border-moss-600 focus:bg-paper-raised transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t border-line flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-8 py-3.5 text-sm"
            >
              <span>
                {isSubmitting ? "Saving Event..." : "Continue to Budget Step"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
