import { apiClient } from "./client";
import { EventCreate, EventResponse } from "../types/events";

export const eventsApi = {
  create: (eventData: EventCreate): Promise<EventResponse> => {
    return apiClient.post<EventResponse>("/events", eventData);
  },

  getById: (eventId: number): Promise<EventResponse> => {
    return apiClient.get<EventResponse>(`/events/${eventId}`);
  },

  list: (skip: number = 0, limit: number = 100): Promise<EventResponse[]> => {
    return apiClient.get<EventResponse[]>(
      `/events?skip=${skip}&limit=${limit}`,
    );
  },
};
