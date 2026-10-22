import React from "react";
import { Utensils, Package, Trash2, Layers, Check, Loader2 } from "lucide-react";
import { BinIcon } from "../../icons";

export interface WasteCategorySelectorProps {
  isFoodSelected: boolean;
  isDisposableSelected: boolean;
  isPlasticSelected: boolean;
  isOtherSelected: boolean;
  onToggleFood: () => void;
  onToggleDisposable: () => void;
  onTogglePlastic: () => void;
  onToggleOther: () => void;
  hasScheduledMeals: boolean;
  isEstimating: boolean;
  onEstimateWaste: () => void;
}

export const WasteCategorySelector: React.FC<WasteCategorySelectorProps> = ({
  isFoodSelected,
  isDisposableSelected,
  isPlasticSelected,
  isOtherSelected,
  onToggleFood,
  onToggleDisposable,
  onTogglePlastic,
  onToggleOther,
  hasScheduledMeals,
  isEstimating,
  onEstimateWaste,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Select Waste Categories
          </h2>
          <span className="text-xs text-ink-muted font-medium">
            Choose what applies to your event
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category 1: Food waste */}
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isFoodSelected}
            onClick={onToggleFood}
            onKeyDown={(e) =>
              (e.key === " " || e.key === "Enter") && onToggleFood()
            }
            className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
              isFoodSelected
                ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                  isFoodSelected
                    ? "bg-moss-700 text-paper-raised"
                    : "bg-paper-inset/60 text-ink-muted border border-line"
                }`}
              >
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink text-sm sm:text-base">
                  Food waste
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Leftover food after meals.
                </p>
                {hasScheduledMeals && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-moss-100 text-moss-800 text-[11px] font-semibold border border-moss-200">
                    Connected to scheduled meals
                  </span>
                )}
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                isFoodSelected
                  ? "bg-moss-700 border-moss-700 text-paper-raised"
                  : "border-line bg-paper-raised"
              }`}
            >
              {isFoodSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Category 2: Disposable items */}
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isDisposableSelected}
            onClick={onToggleDisposable}
            onKeyDown={(e) =>
              (e.key === " " || e.key === "Enter") && onToggleDisposable()
            }
            className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
              isDisposableSelected
                ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                  isDisposableSelected
                    ? "bg-moss-700 text-paper-raised"
                    : "bg-paper-inset/60 text-ink-muted border border-line"
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink text-sm sm:text-base">
                  Disposable items
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Plates, cups, spoons and forks.
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                isDisposableSelected
                  ? "bg-moss-700 border-moss-700 text-paper-raised"
                  : "border-line bg-paper-raised"
              }`}
            >
              {isDisposableSelected && (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </div>
          </div>

          {/* Category 3: Plastic waste */}
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isPlasticSelected}
            onClick={onTogglePlastic}
            onKeyDown={(e) =>
              (e.key === " " || e.key === "Enter") && onTogglePlastic()
            }
            className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
              isPlasticSelected
                ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                  isPlasticSelected
                    ? "bg-moss-700 text-paper-raised"
                    : "bg-paper-inset/60 text-ink-muted border border-line"
                }`}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink text-sm sm:text-base">
                  Plastic waste
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Bottles, bags and wrappers.
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                isPlasticSelected
                  ? "bg-moss-700 border-moss-700 text-paper-raised"
                  : "border-line bg-paper-raised"
              }`}
            >
              {isPlasticSelected && (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </div>
          </div>

          {/* Category 4: Other waste */}
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isOtherSelected}
            onClick={onToggleOther}
            onKeyDown={(e) =>
              (e.key === " " || e.key === "Enter") && onToggleOther()
            }
            className={`p-5 rounded-sheet border transition-all cursor-pointer select-none flex items-start justify-between ${
              isOtherSelected
                ? "border-moss-600 bg-moss-50/70 ring-2 ring-moss-500/20"
                : "border-line bg-paper-raised hover:border-line-strong hover:bg-paper-inset/30"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-control flex items-center justify-center transition-colors flex-shrink-0 ${
                  isOtherSelected
                    ? "bg-moss-700 text-paper-raised"
                    : "bg-paper-inset/60 text-ink-muted border border-line"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink text-sm sm:text-base">
                  Other waste
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Decorations and containers.
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-control border flex items-center justify-center mt-1 transition-colors flex-shrink-0 ${
                isOtherSelected
                  ? "bg-moss-700 border-moss-700 text-paper-raised"
                  : "border-line bg-paper-raised"
              }`}
            >
              {isOtherSelected && (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button: "Estimate my waste" */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onEstimateWaste}
          disabled={isEstimating}
          className="btn-primary w-full sm:w-auto px-8 py-3.5 font-bold text-sm"
        >
          {isEstimating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-paper-raised" />
              <span>Estimating my waste...</span>
            </>
          ) : (
            <>
              <BinIcon className="w-4 h-4 text-paper-raised" />
              <span>Estimate my waste</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
