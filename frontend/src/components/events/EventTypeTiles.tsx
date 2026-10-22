import React from "react";
import { EVENT_TYPE_OPTIONS, EventType } from "../../types/events";
import {
  HackathonMark,
  WorkshopMark,
  CulturalMark,
  SportsMark,
  ConferenceMark,
  SocialMark,
} from "../icons";

export interface EventTypeTileItem {
  value: EventType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const EVENT_TYPE_TILES: EventTypeTileItem[] = [
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

export interface EventTypeTilesProps {
  value: EventType | string;
  onChange: (value: EventType) => void;
  className?: string;
}

/**
 * EventTypeTiles Component:
 * Field notebook selection grid of event formats with custom line-art marks.
 * Includes a synced native select element for complete accessibility and screen readers.
 */
export const EventTypeTiles: React.FC<EventTypeTilesProps> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
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

      {/* Synchronized accessible select input */}
      <select
        id="event-type"
        aria-label="Event Type"
        value={value}
        onChange={(e) => onChange(e.target.value as EventType)}
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
          const isSelected = value === tile.value;
          const TileIcon = tile.icon;
          return (
            <button
              key={tile.value}
              type="button"
              onClick={() => onChange(tile.value)}
              className={`p-3 rounded-control border text-left transition-colors flex flex-col justify-between min-h-[92px] ${
                isSelected
                  ? "border-moss-800 border-b-4 bg-moss-50/80 text-ink"
                  : "border-line bg-paper-inset/30 hover:bg-paper-inset/70 hover:border-line-strong text-ink-muted"
              }`}
              aria-pressed={isSelected}
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
  );
};
