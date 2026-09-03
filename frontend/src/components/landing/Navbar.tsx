"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./shared";
import { CloseIcon, MenuIcon } from "./icons";

const NAV_LINKS = [
  { href: "/para-propietarios", label: "Propietarios" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-black/5 bg-white/75 px-4 backdrop-blur-2xl sm:px-8">
      <nav className="mx-auto flex h-14 max-w-xl items-center justify-between px-1">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="CoFlow, página principal"
        >
          <Logo />
          <span className="text-base font-bold tracking-[-0.025em] text-brand-dark sm:text-lg">
            CoFlow
          </span>
        </Link>

        <div className="hidden items-center gap-5 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted transition hover:text-brand-dark"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="inline-flex h-8 items-center justify-center rounded-full bg-brand px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Entrar
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-brand-dark transition hover:bg-brand/10"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mx-auto mb-3 mt-1 max-w-6xl rounded-[1.5rem] border border-black/5 bg-white/95 p-4 shadow-[0_18px_50px_rgba(22,59,46,0.1)] backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Crear cuenta gratis
            </Link>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-line text-sm font-bold text-brand-dark"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
