import { BudgetCreate, BudgetResponse } from "./budget";

export type EventType =
  | "TECH_FEST"
  | "CULTURAL_FEST"
  | "HACKATHON"
  | "WORKSHOP"
  | "CONFERENCE"
  | "SPORTS_EVENT"
  | "FAREWELL"
  | "DEPARTMENT_EVENT"
  | "OTHER";

export const EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
  description: string;
}[] = [
  {
    value: "TECH_FEST",
    label: "Tech Fest",
    description: "Technical exhibitions, hackathons, and keynote tracks",
  },
  {
    value: "CULTURAL_FEST",
    label: "Cultural Fest",
    description: "Music, drama, arts, and multi-day celebrations",
  },
  {
    value: "HACKATHON",
    label: "Hackathon",
    description: "Intensive coding sessions with round-the-clock catering",
  },
  {
    value: "WORKSHOP",
    label: "Workshop",
    description: "Hands-on practical training with targeted participant count",
  },
  {
    value: "CONFERENCE",
    label: "Conference",
    description: "Academic or professional lectures with scheduled meals",
  },
  {
    value: "SPORTS_EVENT",
    label: "Sports Event",
    description: "Athletic competitions with high hydration and snack demands",
  },
  {
    value: "FAREWELL",
    label: "College Farewell",
    description: "Department or college-wide graduation social gathering",
  },
  {
    value: "DEPARTMENT_EVENT",
    label: "Department Event",
    description: "Branch-specific seminars, guest talks, and alumni meets",
  },
  {
    value: "OTHER",
    label: "Other Event",
    description: "Custom college or community gathering",
  },
];

export interface EventBase {
  name: string;
  event_type: EventType | string;
  expected_attendees: number;
  duration_days: number;
  location?: string | null;
}

export interface EventCreate extends EventBase {
  budget?: BudgetCreate | null;
}

export interface EventResponse extends EventBase {
  id: number;
  budget?: BudgetResponse | null;
}
