import React from "react";
import {
  PlateIcon,
  CupIcon,
  ForkIcon,
  BottleIcon,
  BagIcon,
  TrayIcon,
  BinIcon,
} from "../../icons";

interface WasteItemRowProps {
  name: string;
  itemType: string;
  totalQuantity: number;
  reusableQuantity?: number;
  singleUseQuantity?: number;
  unit?: string;
  explanation?: string;
}

const getItemIcon = (type: string) => {
  const t = type.toUpperCase();
  if (t.includes("PLATE")) return <PlateIcon size={18} className="text-moss-800" />;
  if (t.includes("CUP") || t.includes("GLASS")) return <CupIcon size={18} className="text-moss-800" />;
  if (t.includes("FORK") || t.includes("SPOON") || t.includes("CUTLERY")) return <ForkIcon size={18} className="text-moss-800" />;
  if (t.includes("BOTTLE")) return <BottleIcon size={18} className="text-clay-800" />;
  if (t.includes("BAG") || t.includes("WRAPPER")) return <BagIcon size={18} className="text-clay-800" />;
  if (t.includes("CONTAINER") || t.includes("TRAY")) return <TrayIcon size={18} className="text-moss-800" />;
  return <BinIcon size={18} className="text-ink-muted" />;
};

export const WasteItemRow: React.FC<WasteItemRowProps> = ({
  name,
  itemType,
  totalQuantity,
  reusableQuantity = 0,
  singleUseQuantity = 0,
  unit = "items",
  explanation,
}) => {
  const isSplitItem = reusableQuantity > 0 || singleUseQuantity > 0;
  const reusablePercent =
    totalQuantity > 0 && isSplitItem
      ? Math.round((reusableQuantity / totalQuantity) * 100)
      : 0;

  return (
    <div className="py-3 border-b border-line/60 space-y-2 hover:bg-paper-inset/30 px-2 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="p-1.5 rounded-control bg-paper border border-line flex-shrink-0">
            {getItemIcon(itemType)}
          </span>
          <div>
            <span className="text-xs font-semibold text-ink block font-display">
              {name}
            </span>
            {explanation && (
              <span className="text-[10px] text-ink-muted block line-clamp-1 font-sans">
                {explanation}
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0 font-mono">
          <span className="font-bold text-sm text-ink tabular-nums">
            {totalQuantity}
          </span>
          <span className="text-xs text-ink-muted ml-1">{unit}</span>
        </div>
      </div>

      {/* Reusable vs Single-Use Split Bar */}
      {isSplitItem && (
        <div className="space-y-1 pt-1 font-mono text-[10px]">
          <div className="h-1.5 w-full bg-paper-inset border border-line-strong flex overflow-hidden">
            <div
              className="h-full bg-moss-700 transition-all duration-300"
              style={{ width: `${reusablePercent}%` }}
              title={`${reusableQuantity} reusable (${reusablePercent}%)`}
            />
            <div
              className="h-full bg-clay-700 transition-all duration-300"
              style={{ width: `${100 - reusablePercent}%` }}
              title={`${singleUseQuantity} single-use`}
            />
          </div>
          <div className="flex justify-between text-ink-muted">
            <span className="text-moss-800 font-semibold">{reusableQuantity} reusable ({reusablePercent}%)</span>
            <span className="text-clay-800 font-semibold">{singleUseQuantity} single-use</span>
          </div>
        </div>
      )}
    </div>
  );
};
