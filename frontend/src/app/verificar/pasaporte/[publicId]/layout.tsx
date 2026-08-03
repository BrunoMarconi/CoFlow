import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar Pasaporte de Solvencia",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function VerificarPasaporteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
