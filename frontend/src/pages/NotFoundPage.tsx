import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <p className="font-display text-5xl text-moss-700 mb-3">404</p>
      <h1 className="text-2xl text-ink">Page not found</h1>
      <p className="text-ink-muted text-sm mt-2 mb-8">
        That planning step or event page does not exist.
      </p>
      <Link to="/" className="btn-primary">
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
