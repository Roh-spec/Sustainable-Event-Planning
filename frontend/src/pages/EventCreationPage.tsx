import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { usePlanningWizard } from "../context/PlanningWizardContext";
import { WizardProgress } from "../components/wizard/WizardProgress";
import { eventsApi } from "../api/events";
import { EVENT_TYPE_OPTIONS, EventType } from "../types/events";
import {
  HackathonMark,
  WorkshopMark,
  CulturalMark,
  SportsMark,
  ConferenceMark,
  SocialMark,
} from "../components/icons";
import { usePageTitle } from "../hooks/usePageTitle";

const EVENT_TYPE_TILES: {
  value: EventType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}[] = [
  {
    value: "TECH_FEST",
    label: "Tech Fest",
    desc: "Coding fairs & tech demos",
    icon: HackathonMark,
  },
  {
    value: "CULTURAL_FEST",
    label: "Cultural Fest",
    desc: "Performances, drama & arts",
    icon: CulturalMark,
  },
  {
    value: "HACKATHON",
    label: "Hackathon",
    desc: "Intensive 24-48h sprints",
    icon: HackathonMark,
  },
  {
    value: "WORKSHOP",
    label: "Workshop",
    desc: "Hands-on labs & seminars",
    icon: WorkshopMark,
  },
  {
    value: "CONFERENCE",
    label: "Conference",
    desc: "Keynotes & symposiums",
    icon: ConferenceMark,
  },
  {
    value: "SPORTS_EVENT",
    label: "Sports Event",
    desc: "Tournaments & athletic meets",
    icon: SportsMark,
  },
  {
    value: "FAREWELL",
    label: "Farewell",
    desc: "Graduation & batch send-offs",
    icon: SocialMark,
  },
  {
    value: "DEPARTMENT_EVENT",
    label: "Department",
    desc: "Club meets & symposiums",
    icon: WorkshopMark,
  },
];

export const EventCreationPage: React.FC = () => {
  usePageTitle("New Event · EcoPlan");
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
          <span className="label-kicker mb-1 block">Step 01 · Registry</span>
          <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight font-semibold">
            {eventId ? "Edit Event Details" : "Create Your Sustainable Event"}
          </h1>
          <p className="text-ink-muted text-sm mt-1 max-w-2xl leading-relaxed">
            Record the basic physical parameters: head count, duration, and format. These govern food portion algorithms and waste projections.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-8 p-4 rounded-control bg-clay-50 border-l-2 border-clay-700 text-clay-900 text-xs font-mono flex items-start space-x-3"
          >
            <AlertCircle className="w-4 h-4 text-clay-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider">Validation Error: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Section 1: Identification & Gathering Format */}
          <section className="border-b border-line pb-8 space-y-6">
            <span className="label-kicker">Section A · Identity & Format</span>

            {/* Event Name */}
            <div>
              <label
                htmlFor="event-name"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5"
              >
                Event Name <span className="text-clay-700">*</span>
              </label>
              <input
                type="text"
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Annual College Tech Fest 2026"
                className="w-full px-3.5 py-2.5 rounded-control border border-line bg-paper text-ink text-sm font-medium focus:border-moss-700 focus:outline-none placeholder:text-ink-muted/50"
                required
              />
            </div>

            {/* Event Type as Line Illustration Tiles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="event-type"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink"
                >
                  Event Type <span className="text-clay-700">*</span>
                </label>
                <span className="text-[11px] font-mono text-ink-muted">
                  format template
                </span>
              </div>

              {/* Accessible native select */}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {EVENT_TYPE_TILES.map((tile) => {
                  const isSelected = eventType === tile.value;
                  const TileIcon = tile.icon;
                  return (
                    <button
                      key={tile.value}
                      type="button"
                      onClick={() => setEventType(tile.value)}
                      className={`p-3 rounded-control border text-left transition-colors flex flex-col justify-between min-h-[92px] ${
                        isSelected
                          ? "border-moss-800 border-b-4 bg-moss-50/80 text-ink"
                          : "border-line bg-paper-inset/30 hover:bg-paper-inset/70 hover:border-line-strong text-ink-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className={isSelected ? "text-moss-800" : "text-ink-muted"}>
                          <TileIcon size={22} />
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-moss-800" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-ink block font-display">
                          {tile.label}
                        </span>
                        <span className="text-[10px] text-ink-muted line-clamp-1 mt-0.5 font-sans">
                          {tile.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 2: Scale & Duration */}
          <section className="border-b border-line pb-8 space-y-6">
            <span className="label-kicker">Section B · Scale & Attendance</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="expected-attendees"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5"
                >
                  Expected Attendees <span className="text-clay-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
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
                    className="w-full pl-9 pr-14 py-2.5 rounded-control border border-line bg-paper text-ink font-mono text-sm font-semibold focus:border-moss-700 focus:outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono text-ink-muted">
                    people
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 font-sans">
                  Directly sets meal count and single-use packaging multiplier.
                </p>
              </div>

              <div>
                <label
                  htmlFor="duration-days"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5"
                >
                  Duration (Days) <span className="text-clay-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    id="duration-days"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full pl-9 pr-14 py-2.5 rounded-control border border-line bg-paper text-ink font-mono text-sm font-semibold focus:border-moss-700 focus:outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono text-ink-muted">
                    days
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 font-sans">
                  Multi-day schedules allow customized per-day meal planning.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Venue & Optional Date */}
          <section className="space-y-6">
            <span className="label-kicker">Section C · Venue & Logistics</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="event-location"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5"
                >
                  Location / Venue
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="event-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Main Auditorium, Block C"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-control border border-line bg-paper text-ink text-sm font-medium focus:border-moss-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-date"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5"
                >
                  Event Date{" "}
                  <span className="text-[10px] font-normal text-ink-muted lowercase">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="event-date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-control border border-line bg-paper text-ink text-sm font-medium focus:border-moss-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Action Row */}
          <div className="pt-6 border-t border-line flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-7 py-3 text-sm"
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
