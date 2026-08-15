import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Normas de la comunidad" };

export default function NormasComunidadPage() {
  return (
    <LegalLayout title="Normas de la comunidad" updated="15 de agosto de 2026">
      <p>
        CoFlow está diseñado para ayudar a las personas a encontrar compañeros y viviendas de una manera segura y
        respetuosa. Estas normas se aplican a usuarios, perfiles, comunidades, propiedades y demás contenido publicado
        en la plataforma.
      </p>

      <Section title="Identidad">
        <p>No está permitido:</p>
        <Ul items={["Suplantar personas", "Crear identidades falsas para engañar", "Utilizar fotografías de terceros sin autorización", "Falsear deliberadamente información importante"]} />
      </Section>

      <Section title="Estafas">
        <p>No permitimos:</p>
        <Ul items={["Viviendas inexistentes", "Depósitos fraudulentos", "Solicitudes de dinero mediante engaño", "Phishing", "Enlaces maliciosos", "Cualquier intento de obtener dinero o información mediante fraude"]} />
      </Section>

      <Section title="Acoso">
        <p>No permitimos:</p>
        <Ul items={["Amenazas", "Intimidación", "Acoso", "Chantaje", "Persecución", "Publicación maliciosa de información privada"]} />
      </Section>

      <Section title="Discriminación">
        <p>CoFlow no permite anuncios o comportamientos que vulneren la legislación aplicable en materia de igualdad de trato y acceso a vivienda.</p>
      </Section>

      <Section title="Privacidad">
        <p>No publiques sin autorización información privada de otras personas, incluyendo:</p>
        <Ul items={["Documentos de identidad", "Datos bancarios", "Credenciales", "Conversaciones privadas", "Números de teléfono privados", "Direcciones de email privadas", "Otra información sensible"]} />
      </Section>

      <Section title="Propiedades reales">
        <p>Solo debes publicar una vivienda cuando tengas autorización o legitimidad suficiente.</p>
        <p>Las fotografías, precio y características deben representar razonablemente la oferta real.</p>
      </Section>

      <Section title="Spam y manipulación">
        <p>No se permite:</p>
        <Ul items={["Spam", "Publicidad masiva no solicitada", "Creación automatizada abusiva de cuentas", "Scraping no autorizado", "Manipulación artificial de recomendaciones o actividad"]} />
      </Section>

      <Section title="Seguridad">
        <p>No intentes comprometer las cuentas de otras personas ni la infraestructura de CoFlow.</p>
      </Section>

      <Section title="Consecuencias">
        <p>Dependiendo de las circunstancias, CoFlow podrá retirar contenido, emitir advertencias, restringir funcionalidades, suspender cuentas o cerrarlas.</p>
      </Section>

      <Section title="Reportar">
        <p>Los perfiles y propiedades podrán incluir la opción “⋯ → Reportar”.</p>
        <p>Motivos recomendados:</p>
        <Ul items={["Perfil falso", "Estafa", "Acoso", "Discriminación", "Inmueble falso", "Contenido ilegal", "Spam", "Privacidad", "Otro"]} />
        <p>
          El contenido potencialmente ilegal también puede notificarse mediante{" "}
          <Link href="/legal/reportar" className="font-semibold text-primary-dark underline underline-offset-4">
            coflowapp.es/legal/reportar
          </Link>
          .
        </p>
      </Section>

      <Section title="Contacto">
        <p>soporte@coflowapp.es</p>
      </Section>
    </LegalLayout>
  );
}
