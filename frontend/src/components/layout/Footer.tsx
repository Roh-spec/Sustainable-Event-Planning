import React from 'react';
import { ShieldCheck, Leaf } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">AI-Based Sustainable Event Planning Assistant</span>
            <span>— Practical Eco Planning</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Measurable Sustainability Indicators (No Arbitrary Scores)</span>
            </div>
            <span>v0.1.0 (Phase 3B)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
