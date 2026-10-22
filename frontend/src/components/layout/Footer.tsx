import React from "react";
import { SproutIcon } from "../icons";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line mt-auto py-8 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-ink-muted">
          <div className="flex items-center space-x-2">
            <SproutIcon size={16} className="text-moss-700" />
            <span className="font-display font-semibold text-ink">EcoPlan</span>
            <span className="text-ink-muted">·</span>
            <span className="font-sans text-xs sm:text-sm">Kilograms, rupees, and item counts — not fake scores.</span>
          </div>
          <div className="font-mono text-[11px] text-ink-muted uppercase tracking-wider">
            Field notebook & working ledger
          </div>
        </div>
      </div>
    </footer>
  );
};
