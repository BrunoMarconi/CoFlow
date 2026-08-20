import type { Metadata } from "next";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Condiciones para propietarios" };

export default function CondicionesPropietariosPage() {
  return (
    <LegalLayout title="Condiciones para propietarios" updated="20 de agosto de 2026">
      <p className="-mt-2 text-xs font-semibold text-muted">Versión: 1.1 · Lanzamiento en Málaga</p>

      <Section title="Precio">
        <p>Durante esta fase de lanzamiento, publicar y gestionar propiedades en CoFlow es <strong>gratuito</strong>.</p>
        <p>No se requiere tarjeta, no se realiza ningún cobro y no se activa ninguna renovación automática.</p>
      </Section>

      <Section title="Duración de la publicación">
        <p>La propiedad puede permanecer publicada mientras el propietario mantenga el anuncio activo y cumpla estas condiciones.</p>
        <p>El propietario puede pausarla, editarla, marcarla como alquilada o archivarla desde su panel.</p>
      </Section>

      <Section title="Requisitos para publicar">
        <p>El propietario confirma que dispone de autorización o legitimidad suficiente para ofrecer la vivienda o habitación.</p>
        <p>La información, el precio, las fotografías y la disponibilidad deben ser reales y mantenerse actualizados.</p>
      </Section>

      <Section title="Contenido no permitido">
        <Ul
          items={[
            "Anuncios falsos, duplicados o engañosos",
            "Propiedades que no se esté legitimado para ofrecer",
            "Condiciones ilegales o discriminatorias",
            "Fotografías o datos de terceros sin autorización",
          ]}
        />
      </Section>

      <Section title="Cambios futuros">
        <p>Si CoFlow incorpora servicios de pago en el futuro, se comunicarán previamente el precio y las condiciones aplicables. No se realizará ningún cobro sin una aceptación expresa.</p>
      </Section>
    </LegalLayout>
  );
}
