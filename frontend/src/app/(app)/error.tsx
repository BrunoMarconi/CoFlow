"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ui/ErrorState";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return <div className="mx-auto flex min-h-[55vh] w-full max-w-2xl items-center justify-center"><ErrorState className="w-full" title="No se pudo cargar" description="Ha ocurrido un error al cargar este contenido." onRetry={reset} /></div>;
}
