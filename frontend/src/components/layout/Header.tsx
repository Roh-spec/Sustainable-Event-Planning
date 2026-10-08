import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Calendar, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">EcoPlan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SUSTAINABLE
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">AI-Based Sustainable Event Planning Assistant</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/events/new"
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/events/new')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Plan Event</span>
            </Link>

            <Link
              to="/events"
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/events'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
