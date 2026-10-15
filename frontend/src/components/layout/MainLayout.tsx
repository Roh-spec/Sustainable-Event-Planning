import React, { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SmoothScrollProvider } from "../common/SmoothScrollProvider";
import { animatePageEnter } from "../../utils/animations";

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pageRef.current) {
      animatePageEnter(pageRef.current, { duration: 380, translateY: 10 });
    }
  }, [location.pathname]);

  return (
    <SmoothScrollProvider>
      <div className="flex flex-col min-h-screen bg-paper text-ink">
        <Header />
        <main className="flex-1 pb-16">
          <div ref={pageRef} key={location.pathname} className="min-h-full">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
};
