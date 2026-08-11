"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./shared";
import { CloseIcon, MenuIcon } from "./icons";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#comunidades", label: "Comunidades" },
  { href: "#personas", label: "Personas" },
  { href: "#preguntas", label: "Preguntas" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky inset-x-0 top-0 z-50 px-4 pt-3 sm:px-8 sm:pt-4">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-4 shadow-[0_12px_40px_rgba(22,59,46,0.08)] backdrop-blur-xl sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="CoFlow, página principal"
        >
          <Logo />
          <span className="text-xl font-black tracking-tight text-brand-dark">
            CoFlow
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
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
            href="/login"
            className="hidden h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-brand-dark transition hover:bg-brand/10 sm:inline-flex"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            className="hidden h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark sm:inline-flex sm:px-5"
          >
            Crear cuenta
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark transition hover:bg-brand/10 md:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_12px_40px_rgba(22,59,46,0.08)] backdrop-blur-xl md:hidden">
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
