import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope } from "next/font/google";

import AuthProvider from "@/providers/AuthProvider";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CoFlow | Encuentra personas compatibles para compartir hogar",
    template: "%s | CoFlow",
  },
  description:
    "Encuentra personas y comunidades compatibles para compartir vivienda según vuestros hábitos y preferencias de convivencia.",
  keywords: [
    "compartir piso",
    "compañeros de piso",
    "buscar habitación",
    "comunidades",
    "convivencia",
    "roommates",
    "CoFlow",
  ],
  authors: [
    {
      
      name: "CoFlow",
    },
  ],
  creator: "CoFlow",
  applicationName: "CoFlow",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "CoFlow | Encuentra dónde encajar",
    description:
      "Descubre personas y comunidades compatibles para compartir vivienda.",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoFlow | Encuentra dónde encajar",
    description:
      "Descubre personas y comunidades compatibles para compartir vivienda.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#102d22" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-brand-dark">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}