import { apiClient } from "./client";
import { WastePlanRequest, WastePlanResponse } from "../types/waste";

export const wasteApi = {
  planWaste: (request: WastePlanRequest): Promise<WastePlanResponse> => {
    return apiClient.post<WastePlanResponse>("/planning/waste", request);
  },
};
