import { useMemo } from "react";
import { EventResponse } from "../types/events";
import {
  WastePlanResponse,
  PackagingItemInput,
  PlasticItemInput,
  OtherWasteItemInput,
} from "../types/waste";

interface UseWasteLiveEstimatesProps {
  event: EventResponse | null;
  includeFoodWaste: boolean;
  packagingItems: PackagingItemInput[];
  plasticItems: PlasticItemInput[];
  otherWasteItems: OtherWasteItemInput[];
  wastePlanResponse: WastePlanResponse | null;
  budgetCeiling?: string;
}

export function useWasteLiveEstimates({
  event,
  includeFoodWaste,
  packagingItems,
  plasticItems,
  otherWasteItems,
  wastePlanResponse,
}: UseWasteLiveEstimatesProps) {
  return useMemo(() => {
    const attendees = event?.expected_attendees || 100;

    // If backend calculation response exists, use verified figures
    if (wastePlanResponse) {
      const packagingTotal = Number(wastePlanResponse.packaging_waste.total_items) || 0;
      const singleUsePackaging = Number(wastePlanResponse.packaging_waste.total_single_use_items) || 0;
      const reusablePackaging = Number(wastePlanResponse.packaging_waste.total_reusable_items) || 0;

      const plasticTotal = Number(wastePlanResponse.plastic_waste.total_planning_items) || 0;
      const totalItems = packagingTotal + plasticTotal;
      const totalSingleUse = singleUsePackaging + plasticTotal;
      const totalReusable = reusablePackaging;

      const reusablePercent = totalItems > 0 ? Math.round((totalReusable / totalItems) * 100) : 0;
      const foodWasteKg = Number(wastePlanResponse.food_waste?.estimated_kg) || 0;

      return {
        totalItems,
        totalSingleUse,
        totalReusable,
        reusablePercent,
        foodWasteKg,
        isCalculated: true,
      };
    }

    // Heuristic live estimation as checkboxes/items toggle:
    // Plates & cups typically default to 75% reusable on campus
    const packagingCount = packagingItems.length * attendees;
    const plasticCount = plasticItems.length * attendees;
    const totalItems = packagingCount + plasticCount;

    const estimatedReusable = Math.round(packagingCount * 0.75);
    const estimatedSingleUse = totalItems - estimatedReusable;
    const reusablePercent = totalItems > 0 ? Math.round((estimatedReusable / totalItems) * 100) : 0;
    const foodWasteKg = includeFoodWaste ? Number((attendees * 0.06).toFixed(1)) : 0;

    return {
      totalItems,
      totalSingleUse: estimatedSingleUse,
      totalReusable: estimatedReusable,
      reusablePercent,
      foodWasteKg,
      isCalculated: false,
    };
  }, [
    event?.expected_attendees,
    includeFoodWaste,
    packagingItems.length,
    plasticItems.length,
    otherWasteItems.length,
    wastePlanResponse,
  ]);
}
