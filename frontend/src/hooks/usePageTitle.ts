import { useEffect } from "react";

/**
 * Standardizes document.title across all pages in the field-station ledger system.
 * Automatically ensures consistent ' · EcoPlan' branding.
 *
 * @param title Specific page name or complete title
 */
export const usePageTitle = (title: string): void => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const fullTitle = title.includes("EcoPlan") ? title : `${title} · EcoPlan`;
    const previousTitle = document.title;
    document.title = fullTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
