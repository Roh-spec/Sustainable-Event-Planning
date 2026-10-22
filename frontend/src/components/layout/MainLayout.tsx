import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SmoothScrollProvider } from "../common/SmoothScrollProvider";

export const MainLayout: React.FC = () => {
  return (
    <SmoothScrollProvider>
      <div className="flex flex-col min-h-screen bg-paper text-ink">
        <Header />
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
};
