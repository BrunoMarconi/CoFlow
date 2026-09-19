"use client";

// TEMPORAL: banco de pruebas de animaciones sin sesión. Se borra al
// terminar la verificación.
import { useState } from "react";
import { NavigationPromisesContext, PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Sidebar from "@/components/layout/Sidebar";
import OwnerModeProvider from "@/providers/OwnerModeProvider";
import MobileChromeProvider from "@/providers/MobileChromeProvider";

const PATHS = ["/explorar", "/mi-comunidad", "/mensajes", "/perfil", "/ajustes"];

export default function MotionLab() {
  const [path, setPath] = useState("/explorar");

  return (
    <NavigationPromisesContext.Provider value={null}>
    <PathnameContext.Provider value={path}>
      <OwnerModeProvider>
        <MobileChromeProvider>
          <div className="min-h-dvh p-6 md:pl-72">
            <div className="flex flex-wrap gap-2">
              {PATHS.map((p) => (
                <button key={p} data-path={p} onClick={() => setPath(p)} className="rounded-12 border border-border px-3 py-2 text-sm">
                  {p}
                </button>
              ))}
            </div>
            <p id="lab-path" className="mt-3 text-sm">{path}</p>
            <button className="mt-4 rounded-12 bg-primary px-5 py-3 font-semibold text-white">Botón de prueba</button>
            <div role="button" tabIndex={0} className="mt-4 w-[340px] rounded-18 border border-border p-5">Tarjeta de prueba</div>
          </div>
          <Sidebar />
          <BottomNavigation />
        </MobileChromeProvider>
      </OwnerModeProvider>
    </PathnameContext.Provider>
    </NavigationPromisesContext.Provider>
  );
}
