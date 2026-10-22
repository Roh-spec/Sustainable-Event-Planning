import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Backdrop } from "./Backdrop";
import { SmoothScrollProvider } from "../common/SmoothScrollProvider";
import { DevPaletteSwitcher } from "../common/DevPaletteSwitcher";

export const MainLayout: React.FC = () => {
  return (
    <SmoothScrollProvider>
      <div className="relative flex flex-col min-h-screen text-ink">
        <Backdrop />
        <Header />
        <main className="flex-1 pb-16 relative z-0">
          <Outlet />
        </main>
        <Footer />
        <DevPaletteSwitcher />
      </div>
    </SmoothScrollProvider>
  );
};
