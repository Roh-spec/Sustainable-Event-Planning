import React, { useEffect, useState } from "react";

export const DevPaletteSwitcher: React.FC = () => {
  // Active only in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const [activePalette, setActivePalette] = useState<string>(() => {
    if (typeof window === "undefined") return "a";
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("palette");
    if (fromUrl && ["a", "b", "c"].includes(fromUrl.toLowerCase())) {
      return fromUrl.toLowerCase();
    }
    const fromStorage = localStorage.getItem("dev_palette");
    if (fromStorage && ["a", "b", "c"].includes(fromStorage)) {
      return fromStorage;
    }
    return "a";
  });

  const applyPalette = (pal: string) => {
    setActivePalette(pal);
    document.documentElement.setAttribute("data-palette", pal);
    localStorage.setItem("dev_palette", pal);

    // Update query param without reloading
    const url = new URL(window.location.href);
    url.searchParams.set("palette", pal);
    window.history.replaceState({}, "", url.toString());
  };

  useEffect(() => {
    applyPalette(activePalette);
  }, []);

  return (
    <aside
      aria-label="Development palette switcher"
      className="fixed bottom-3 right-3 z-50 bg-paper-raised/95 backdrop-blur-md border border-line rounded-control p-1.5 shadow-subtle flex items-center space-x-1 text-xs font-mono print:hidden"
    >
      <span className="text-ink-muted px-2 uppercase tracking-wider font-semibold text-[11px]">
        Palette:
      </span>
      <button
        type="button"
        onClick={() => applyPalette("a")}
        className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-control transition-colors flex items-center justify-center ${
          activePalette === "a"
            ? "bg-moss-700 text-paper-raised font-bold"
            : "text-ink hover:bg-paper-inset"
        }`}
        title="Palette A: Sage Dawn (Default Light)"
      >
        A (Sage)
      </button>
      <button
        type="button"
        onClick={() => applyPalette("b")}
        className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-control transition-colors flex items-center justify-center ${
          activePalette === "b"
            ? "bg-moss-700 text-paper-raised font-bold"
            : "text-ink hover:bg-paper-inset"
        }`}
        title="Palette B: Tidepool Night (Dark Glass)"
      >
        B (Tidepool)
      </button>
      <button
        type="button"
        onClick={() => applyPalette("c")}
        className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-control transition-colors flex items-center justify-center ${
          activePalette === "c"
            ? "bg-moss-700 text-paper-raised font-bold"
            : "text-ink hover:bg-paper-inset"
        }`}
        title="Palette C: Kiln & Lagoon (Light)"
      >
        C (Kiln)
      </button>
    </aside>
  );
};
