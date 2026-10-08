import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { HomePage } from '../pages/HomePage';
import { EventsListPage } from '../pages/EventsListPage';
import { EventCreationPage } from '../pages/EventCreationPage';
import { BudgetPage } from '../pages/BudgetPage';
import { ConstraintsPage } from '../pages/ConstraintsPage';
import { FoodPlanningPage } from '../pages/FoodPlanningPage';
import { WastePlanningPage } from '../pages/WastePlanningPage';
import { PlansPage } from '../pages/PlansPage';
import { PlanComparisonPage } from '../pages/PlanComparisonPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Landing / Dashboard */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsListPage />} />

        {/* Guided Wizard Routes */}
        <Route path="/events/new" element={<EventCreationPage />} />
        <Route path="/events/:eventId/edit" element={<EventCreationPage />} />
        <Route path="/events/:eventId/budget" element={<BudgetPage />} />
        <Route path="/events/:eventId/constraints" element={<ConstraintsPage />} />
        <Route path="/events/:eventId/food" element={<FoodPlanningPage />} />
        <Route path="/events/:eventId/waste" element={<WastePlanningPage />} />
        <Route path="/events/:eventId/plans" element={<PlansPage />} />
        <Route path="/events/:eventId/compare" element={<PlanComparisonPage />} />

        {/* Fallback */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};
