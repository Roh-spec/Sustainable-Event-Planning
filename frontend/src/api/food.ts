import { apiClient } from "./client";
import { FoodPlanRequest, FoodPlanResponse } from "../types/food";

export const foodApi = {
  planFood: (request: FoodPlanRequest): Promise<FoodPlanResponse> => {
    return apiClient.post<FoodPlanResponse>("/planning/food", request);
  },
};
