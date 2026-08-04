import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar correo",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function VerificarEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
