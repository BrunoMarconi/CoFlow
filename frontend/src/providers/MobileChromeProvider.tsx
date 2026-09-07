"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface MobileChromeContextValue {
  isChatActive: boolean;
  setChatActive: (active: boolean) => void;
  /** Título grande de la pantalla actual, para que la barra superior
   * pueda adoptarlo cuando el título de la página sale de pantalla. */
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
  /** El título grande ya se ha desplazado fuera de vista. */
  isTitleCollapsed: boolean;
  setTitleCollapsed: (collapsed: boolean) => void;
}

const MobileChromeContext = createContext<MobileChromeContextValue | undefined>(
  undefined
);

export default function MobileChromeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isChatActive, setIsChatActive] = useState(false);
  const [pageTitle, setPageTitleState] = useState<string | null>(null);
  const [isTitleCollapsed, setIsTitleCollapsed] = useState(false);

  const setChatActive = useCallback((active: boolean) => {
    setIsChatActive(active);
  }, []);

  const setPageTitle = useCallback((title: string | null) => {
    setPageTitleState(title);
    // Un título nuevo siempre entra desplegado: si se conservara el
    // estado del anterior, al cambiar de pestaña la barra arrancaría
    // mostrando el título inline sobre una página ya en el tope.
    setIsTitleCollapsed(false);
  }, []);

  const setTitleCollapsed = useCallback((collapsed: boolean) => {
    setIsTitleCollapsed(collapsed);
  }, []);

  const value = useMemo(
    () => ({
      isChatActive,
      setChatActive,
      pageTitle,
      setPageTitle,
      isTitleCollapsed,
      setTitleCollapsed,
    }),
    [
      isChatActive,
      setChatActive,
      pageTitle,
      setPageTitle,
      isTitleCollapsed,
      setTitleCollapsed,
    ]
  );

  return (
    <MobileChromeContext.Provider value={value}>
      {children}
    </MobileChromeContext.Provider>
  );
}

export function useMobileChrome() {
  const context = useContext(MobileChromeContext);

  if (!context) {
    throw new Error(
      "useMobileChrome debe usarse dentro de <MobileChromeProvider>"
    );
  }

  return context;
}
