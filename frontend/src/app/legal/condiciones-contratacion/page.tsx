import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Condiciones de contratación" };

export default function CondicionesContratacionPage() {
  return (
    <LegalLayout title="Condiciones de contratación" updated="20 de agosto de 2026">
      <p className="-mt-2 text-xs font-semibold text-muted">Lanzamiento en Málaga</p>

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
        <p>Durante la fase actual de lanzamiento, publicar y gestionar propiedades es <strong>gratuito</strong>.</p>
        <p>No se solicita un método de pago ni se activa una suscripción.</p>
      </Section>

      <Section title="4. Periodo gratuito">
        <p>La gratuidad se mantiene durante la fase de lanzamiento indicada por CoFlow. Cualquier cambio futuro se comunicará antes de que resulte aplicable.</p>
      </Section>

      <Section title="5. Renovación automática">
        <p>Las publicaciones creadas durante esta fase no generan cobros ni renovaciones automáticas.</p>
      </Section>

      <Section title="6. Método de pago">
        <p>No se requiere método de pago para publicar durante esta fase.</p>
      </Section>

      <Section title="7. Fecha del primer cargo">
        <p>No existe una fecha de primer cargo para las publicaciones gratuitas de esta fase.</p>
      </Section>

      <Section title="8. Duración">
        <p>La publicación puede permanecer activa mientras el propietario mantenga el anuncio y cumpla las condiciones aplicables.</p>
      </Section>

      <Section title="9. Cancelación">
        <p>El propietario puede pausar, marcar como alquilada o archivar cada propiedad desde su cuenta.</p>
      </Section>

      <Section title="10. Consecuencias del impago">
        <p>Al no existir cobro durante esta fase, no se producen consecuencias por impago.</p>
      </Section>

      <Section title="11. Derecho de desistimiento">
        <p>Cuando el propietario tenga la condición de consumidor a los efectos del Real Decreto Legislativo 1/2007, dispondrá de un plazo de <strong>14 días naturales</strong> desde la contratación para desistir del servicio sin necesidad de justificación, conforme a los artículos 102 y siguientes de dicha norma.</p>
        <p>El ejercicio del desistimiento durante la fase gratuita no genera coste alguno.</p>
        <p>No se aplican excepciones al derecho de desistimiento distintas de las previstas legalmente.</p>
      </Section>

      <Section title="12. Atención al cliente y reclamaciones">
        <p>Para cualquier consulta, incidencia o reclamación relacionada con este servicio, el propietario puede escribir a <Link href="mailto:info@coflowapp.es" className="font-bold text-primary-dark underline underline-offset-4">info@coflowapp.es</Link>. CoFlow confirmará la recepción de la reclamación y responderá en un plazo razonable.</p>
        <p>Si el propietario tiene la condición de consumidor, podrá acudir además a las hojas de reclamaciones oficiales o a las entidades de resolución alternativa de litigios de consumo que correspondan, así como a la plataforma europea de resolución de litigios en línea cuando resulte aplicable.</p>
      </Section>
    </LegalLayout>
  );
}
