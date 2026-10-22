import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { SkeletonLines } from "../components/common/SkeletonLines";

// Route-level code splitting via React.lazy
const HomePage = React.lazy(() =>
  import("../pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const EventsListPage = React.lazy(() =>
  import("../pages/EventsListPage").then((m) => ({ default: m.EventsListPage })),
);
const EventCreationPage = React.lazy(() =>
  import("../pages/EventCreationPage").then((m) => ({
    default: m.EventCreationPage,
  })),
);
const BudgetPage = React.lazy(() =>
  import("../pages/BudgetPage").then((m) => ({ default: m.BudgetPage })),
);
const ConstraintsPage = React.lazy(() =>
  import("../pages/ConstraintsPage").then((m) => ({
    default: m.ConstraintsPage,
  })),
);
const FoodPlanningPage = React.lazy(() =>
  import("../pages/FoodPlanningPage").then((m) => ({
    default: m.FoodPlanningPage,
  })),
);
const WastePlanningPage = React.lazy(() =>
  import("../pages/WastePlanningPage").then((m) => ({
    default: m.WastePlanningPage,
  })),
);
const PlansPage = React.lazy(() =>
  import("../pages/PlansPage").then((m) => ({ default: m.PlansPage })),
);
const PlanComparisonPage = React.lazy(() =>
  import("../pages/PlanComparisonPage").then((m) => ({
    default: m.PlanComparisonPage,
  })),
);
const CompletePlanPage = React.lazy(() =>
  import("../pages/CompletePlanPage").then((m) => ({
    default: m.CompletePlanPage,
  })),
);
const NotFoundPage = React.lazy(() =>
  import("../pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

const RouteFallback: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    role="status"
    aria-label="Loading page content"
  >
    <div className="surface-sheet p-8 sm:p-12 border border-line bg-paper-raised">
      <SkeletonLines variant="card" lines={4} />
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Landing / Dashboard */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsListPage />} />

          {/* Guided Wizard Routes */}
          <Route path="/events/new" element={<EventCreationPage />} />
          <Route path="/events/:eventId/edit" element={<EventCreationPage />} />
          <Route path="/events/:eventId/budget" element={<BudgetPage />} />
          <Route
            path="/events/:eventId/constraints"
            element={<ConstraintsPage />}
          />
          <Route path="/events/:eventId/food" element={<FoodPlanningPage />} />
          <Route path="/events/:eventId/waste" element={<WastePlanningPage />} />
          <Route path="/events/:eventId/plans" element={<PlansPage />} />
          <Route
            path="/events/:eventId/compare"
            element={<PlanComparisonPage />}
          />
          <Route
            path="/events/:eventId/complete-plan"
            element={<CompletePlanPage />}
          />

          {/* Fallback */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
