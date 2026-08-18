"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { hasSeenCookieNotice, markCookieNoticeSeen } from "@/lib/cookieNotice";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenCookieNotice()) setVisible(true);
  }, []);

  function dismiss() {
    markCookieNoticeSeen();
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          className="fixed inset-x-0 bottom-0 z-(--z-modal) px-4 pb-[calc(1rem+var(--safe-bottom))] sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-88 sm:px-0"
        >
          <div className="relative overflow-hidden rounded-24 border border-border bg-surface p-5 shadow-2xl">
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />

            <div className="relative flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-16 bg-primary/10 text-primary-dark">
                <CookieIcon />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-brand-dark">Solo lo necesario</p>
                <p className="mt-1 text-xs leading-5 text-secondary">
                  Usamos únicamente cookies necesarias para el funcionamiento de la web, como mantener tu sesión iniciada. Nada de analítica ni publicidad.
                </p>
              </div>
            </div>

            <div className="relative mt-4 flex items-center justify-between gap-3">
              <Link
                href="/legal/cookies"
                className="text-xs font-bold text-primary-dark underline underline-offset-4"
              >
                Más información
              </Link>

              <button
                type="button"
                onClick={dismiss}
                className="rounded-12 bg-primary px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Entendido
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CookieIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 9.5 13.2c-.4.1-.8.1-1.2.1a4 4 0 0 1-4-4c0-.3 0-.6.1-.9a3.5 3.5 0 0 1-4.4-4.4c-.3.1-.6.1-.9.1a4 4 0 0 1-4-4c0-.3 0-.7.1-1A10 10 0 0 0 12 2Z" />
      <circle cx="8.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
