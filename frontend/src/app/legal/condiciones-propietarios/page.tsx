import type { Metadata } from "next";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Condiciones para propietarios" };

export default function CondicionesPropietariosPage() {
  return (
    <LegalLayout title="Condiciones para propietarios" updated="18 de agosto de 2026">
      <p className="-mt-2 text-xs font-semibold text-muted">Versión: 1.0</p>

      <Section title="Precio">
        <p>Cada propiedad publicada en CoFlow dispone de <strong>30 días gratis</strong> desde el momento de su publicación.</p>
        <p>Después: <strong>23,99 €/mes por cada propiedad</strong>.</p>
      </Section>

      <Section title="Renovación">
        <p>La suscripción de cada propiedad se renueva automáticamente cada mes, utilizando el método de pago que hayas autorizado, mientras la publicación permanezca activa y no hayas cancelado su renovación.</p>
      </Section>

      <Section title="Cancelación">
        <p>La cancelación de la renovación es individual, por cada propiedad. Cancelar la renovación de un piso no afecta a las suscripciones de tus otros pisos.</p>
        <p>Si cancelas durante los 30 días gratuitos, no se te cobrará nada. Si cancelas después de haber pagado un mes, no se realizarán más renovaciones, pero el anuncio permanece activo hasta el final del periodo mensual ya abonado. Después se desactivará.</p>
        <p>No se realizan reembolsos automáticos prorrateados salvo que CoFlow defina posteriormente esa política.</p>
      </Section>

      <Section title="Varias propiedades">
        <p>Cada propiedad constituye un plan independiente, con su propio periodo gratuito y su propio ciclo de facturación, contado desde la fecha en que esa propiedad concreta se publicó.</p>
        <p>Ejemplo, tras finalizar los respectivos periodos gratuitos:</p>
        <Ul
          items={[
            "1 piso = 23,99 €/mes",
            "2 pisos = 47,98 €/mes",
            "3 pisos = 71,97 €/mes",
          ]}
        />
      </Section>

      <Section title="Métodos de pago">
        <p>Stripe procesa el método de pago. CoFlow no almacena el número completo de tarjeta ni el código CVC.</p>
      </Section>

      <Section title="Fallos de pago">
        <p>Si no podemos cobrar la tarifa correspondiente a una propiedad, te lo notificaremos y te pediremos que actualices tu método de pago desde tu panel. CoFlow podrá suspender la publicación de esa propiedad si el problema no se resuelve tras un periodo razonable de aviso.</p>
      </Section>
    </LegalLayout>
  );
}
