import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PlanningWizardProvider } from './context/PlanningWizardContext';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PlanningWizardProvider>
        <AppRoutes />
      </PlanningWizardProvider>
    </BrowserRouter>
  );
};

export default App;
