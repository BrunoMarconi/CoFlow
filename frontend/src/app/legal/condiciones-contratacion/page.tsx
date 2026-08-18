import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Condiciones de contratación" };

export default function CondicionesContratacionPage() {
  return (
    <LegalLayout title="Condiciones de contratación" updated="18 de agosto de 2026">
      <p className="-mt-2 text-xs font-semibold text-muted">Versión: 1.0</p>

      <Section title="1. Identidad del prestador">
        <Ul
          items={[
            <>Titular: Daniel Segado Vizcaíno</>,
            <>Nombre comercial: CoFlow</>,
            <>NIF: 77663200C</>,
            <>Domicilio profesional: Calle Julio Rodriguez Jorgue número 9, 29139</>,
            <>Correo electrónico de contacto: info@coflowapp.es</>,
            <>Sitio web: coflowapp.es</>,
          ]}
        />
      </Section>

      <Section title="2. Descripción del servicio">
        <p>El servicio objeto de esta contratación es la publicación de un inmueble por parte de un propietario en la plataforma CoFlow, incluyendo su visibilidad ante otros usuarios durante el tiempo en que la publicación permanezca activa.</p>
      </Section>

      <Section title="3. Precio">
        <p>El precio del servicio es de <strong>23,99 € al mes, impuestos incluidos, por cada propiedad publicada</strong>. El precio se aplica de forma independiente a cada propiedad: publicar varios inmuebles supone una cuota separada por cada uno de ellos.</p>
      </Section>

      <Section title="4. Periodo gratuito">
        <p>Cada propiedad dispone de un periodo gratuito inicial de <strong>30 días naturales</strong> desde su publicación, durante el cual no se realiza ningún cargo.</p>
      </Section>

      <Section title="5. Renovación automática">
        <p>Finalizado el periodo gratuito, si la publicación continúa activa y no se ha cancelado su renovación, el servicio se renovará automáticamente cada mes al precio indicado, mediante el método de pago autorizado por el propietario.</p>
      </Section>

      <Section title="6. Método de pago">
        <p>El pago se gestiona a través de Stripe, proveedor de servicios de pago. CoFlow no almacena el número completo de la tarjeta ni el código de seguridad (CVC).</p>
      </Section>

      <Section title="7. Fecha del primer cargo">
        <p>La fecha del primer cargo corresponde al día en que finaliza el periodo gratuito de 30 días de esa propiedad concreta, y se muestra de forma explícita al propietario antes de confirmar la publicación.</p>
      </Section>

      <Section title="8. Duración">
        <p>El contrato tiene duración indefinida y se prolonga mientras la publicación permanezca activa y no se cancele su renovación, sin perjuicio del derecho de desistimiento indicado más abajo.</p>
      </Section>

      <Section title="9. Cancelación">
        <p>El propietario puede cancelar la renovación de cada propiedad en cualquier momento desde su cuenta. La cancelación impide futuras renovaciones; la publicación puede permanecer activa hasta el final del periodo ya cubierto (gratuito o de pago) y después se desactiva.</p>
      </Section>

      <Section title="10. Consecuencias del impago">
        <p>Si no es posible efectuar el cobro correspondiente, CoFlow lo notificará al propietario y solicitará la actualización del método de pago. Si la situación no se resuelve en un plazo razonable, CoFlow podrá suspender la publicación del inmueble afectado.</p>
      </Section>

      <Section title="11. Derecho de desistimiento">
        <p>Cuando el propietario tenga la condición de consumidor a los efectos del Real Decreto Legislativo 1/2007, dispondrá de un plazo de <strong>14 días naturales</strong> desde la contratación para desistir del servicio sin necesidad de justificación, conforme a los artículos 102 y siguientes de dicha norma.</p>
        <p>Dado que el servicio no comporta ningún cargo durante los primeros 30 días, el ejercicio del desistimiento dentro de ese plazo no genera coste alguno. Si el propietario solicita expresamente el inicio inmediato de la prestación del servicio y reconoce conocer que, una vez ejecutado por completo, pierde su derecho de desistimiento, este se extinguirá en ese momento conforme al artículo 103.a) del citado Real Decreto Legislativo.</p>
        <p>No se aplican excepciones al derecho de desistimiento distintas de las previstas legalmente.</p>
      </Section>

      <Section title="12. Atención al cliente y reclamaciones">
        <p>Para cualquier consulta, incidencia o reclamación relacionada con este servicio, el propietario puede escribir a <Link href="mailto:info@coflowapp.es" className="font-bold text-primary-dark underline underline-offset-4">info@coflowapp.es</Link>. CoFlow confirmará la recepción de la reclamación y responderá en un plazo razonable.</p>
        <p>Si el propietario tiene la condición de consumidor, podrá acudir además a las hojas de reclamaciones oficiales o a las entidades de resolución alternativa de litigios de consumo que correspondan, así como a la plataforma europea de resolución de litigios en línea cuando resulte aplicable.</p>
      </Section>
    </LegalLayout>
  );
}
