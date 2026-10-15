import React from "react";
import { Leaf } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-ink-muted">
          <div className="flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-moss-600" strokeWidth={1.75} />
            <span className="font-display text-ink">EcoPlan</span>
            <span className="text-ink-faint">·</span>
            <span>Kilograms, rupees, and item counts — not fake scores.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
