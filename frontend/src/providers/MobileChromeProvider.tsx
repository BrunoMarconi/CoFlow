"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface MobileChromeContextValue {
  isChatActive: boolean;
  setChatActive: (active: boolean) => void;
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

  const setChatActive = useCallback((active: boolean) => {
    setIsChatActive(active);
  }, []);

  return (
    <MobileChromeContext.Provider value={{ isChatActive, setChatActive }}>
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
