import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import AuthProvider from "@/providers/AuthProvider";
import QueryProvider from "@/providers/QueryProvider";
import RouteProgressBar from "@/components/layout/RouteProgressBar";
import NavigationEffects from "@/components/layout/NavigationEffects";

import "./globals.css";

// Autohospedadas (next/font/local) en vez de next/font/google: la
// versión Google descarga los .woff2 desde fonts.gstatic.com durante
// el build, y si esa red no está disponible en la máquina de build
// (p. ej. Vercel en algún momento puntual) el build entero falla con
// "Module not found" en el CSS del font — justo lo que pasó en
// producción. Los ficheros (subset latin, mismo peso variable que ya
// servía Google) viven en src/fonts/ y no dependen de red en build.
//
// Una sola familia para todo (texto de cuerpo y titulares, utilidades
// font-sans y font-rounded) — cálida y geométrica, en la línea de la
// tipografía de Airbnb (Cereal, que no está disponible como Google
// Font). Antes se mezclaban Manrope + Fredoka; se unificó a esta.
const plusJakartaSans = localFont({
  src: "../fonts/PlusJakartaSans.woff2",
  variable: "--font-jakarta",
  weight: "400 800",
  style: "normal",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMono.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  style: "normal",
  display: "swap",
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CoFlow | Encuentra dónde encajar",
    description:
      "Descubre personas y comunidades compatibles para compartir vivienda.",
    type: "website",
    locale: "es_ES",
    siteName: "CoFlow",
    url: "/",
    images: [{ url: "/logo-coflow.png", width: 512, height: 512, alt: "CoFlow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoFlow | Encuentra dónde encajar",
    description:
      "Descubre personas y comunidades compatibles para compartir vivienda.",
    images: ["/logo-coflow.png"],
  },
};

// Datos estructurados (schema.org) para que Google pueda asociar el
// logo de CoFlow a los resultados de búsqueda — sin esto, un
// favicon/OG image por sí solos no son suficiente señal para el logo
// que Google muestra junto al nombre del sitio.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CoFlow",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  logo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/logo-coflow.png`,
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
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-brand-dark">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <QueryProvider>
          <AuthProvider>
            <RouteProgressBar />
            <NavigationEffects />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
