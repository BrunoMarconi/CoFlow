import type { Metadata } from "next";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Aviso legal" };

export default function AvisoLegalPage() {
  return (
    <LegalLayout title="Aviso legal" updated="15 de agosto de 2026">
      <Section title="1. Identificación del titular">
        <p>
          En cumplimiento de la normativa aplicable a los servicios de la sociedad de la información, se informa de los
          siguientes datos:
        </p>
        <Ul
          items={[
            <>Titular: Daniel Segado Vizcaíno</>,
            <>Condición: Empresario individual / trabajador autónomo</>,
            <>Nombre comercial: CoFlow</>,
            <>NIF: 77663200C</>,
            <>Domicilio profesional: Calle Julio Rodriguez Jorgue número 9, 29139</>,
            <>Correo electrónico: legal@coflowapp.es</>,
            <>Sitio web: coflowapp.es</>,
          ]}
        />
      </Section>

      <Section title="2. Qué es CoFlow">
        <p>
          CoFlow es una plataforma tecnológica destinada a facilitar la búsqueda de compañeros de vivienda, la creación de
          comunidades de convivencia, el descubrimiento de inmuebles y la interacción entre usuarios, comunidades y
          propietarios.
        </p>
        <p>
          Salvo que se indique expresamente lo contrario respecto de una funcionalidad concreta, CoFlow actúa como
          plataforma tecnológica y no es propietario de los inmuebles publicados por terceros ni forma parte de los
          contratos de arrendamiento que puedan celebrarse entre usuarios, propietarios u otras partes.
        </p>
      </Section>

      <Section title="3. Uso de CoFlow">
        <p>
          Los usuarios deberán utilizar CoFlow de manera lícita, responsable y conforme a los Términos y Condiciones de
          Uso y las Normas de la Comunidad.
        </p>
        <p>
          No está permitido utilizar CoFlow para actividades fraudulentas, ilegales, abusivas, discriminatorias o que
          vulneren derechos de terceros.
        </p>
      </Section>

      <Section title="4. Propiedad intelectual e industrial">
        <p>
          La marca CoFlow, su identidad visual, software, diseño, interfaces, textos, logotipos y demás contenidos propios
          están protegidos por la legislación aplicable en materia de propiedad intelectual e industrial.
        </p>
        <p>Los usuarios conservan los derechos que les correspondan sobre las fotografías, textos y demás contenido que incorporen a la plataforma.</p>
      </Section>

      <Section title="5. Contenido de terceros">
        <p>CoFlow puede mostrar información facilitada por usuarios, propietarios u otros terceros.</p>
        <p>
          La presencia de un perfil, propiedad, fotografía, descripción u otro contenido en CoFlow no implica por sí
          misma una garantía de su exactitud, legalidad, disponibilidad o veracidad.
        </p>
        <p>CoFlow podrá revisar, limitar o retirar contenidos que infrinjan la legislación, los Términos y Condiciones o las Normas de la Comunidad.</p>
      </Section>

      <Section title="6. Disponibilidad">
        <p>CoFlow trabaja para mantener la plataforma disponible y segura, pero no puede garantizar un funcionamiento ininterrumpido.</p>
        <p>Podrán producirse interrupciones relacionadas con mantenimiento, actualizaciones, incidencias técnicas, seguridad o circunstancias fuera del control razonable de CoFlow.</p>
      </Section>

      <Section title="7. Servicios de terceros">
        <p>CoFlow utiliza proveedores tecnológicos externos para determinadas funciones.</p>
        <p>Estos servicios pueden estar sometidos a sus propios términos y políticas.</p>
      </Section>

      <Section title="8. Contacto">
        <Ul
          items={[
            <>Soporte: soporte@coflowapp.es</>,
            <>Privacidad: privacidad@coflowapp.es</>,
            <>Asuntos legales: legal@coflowapp.es</>,
          ]}
        />
      </Section>

      <Section title="9. Legislación aplicable">
        <p>CoFlow se rige por la legislación española y de la Unión Europea aplicable.</p>
        <p>Cuando el usuario tenga la condición de consumidor, se respetarán los derechos que le reconozca obligatoriamente la legislación de protección de consumidores.</p>
      </Section>
    </LegalLayout>
  );
}
