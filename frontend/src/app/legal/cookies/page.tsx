import type { Metadata } from "next";
import LegalLayout, { Section, Ul } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Política de cookies" };

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies" updated="15 de agosto de 2026">
      <Section title="1. Qué son las cookies">
        <p>
          Las cookies y tecnologías similares permiten almacenar o recuperar determinada información en el dispositivo
          desde el que se accede a una página web o servicio digital.
        </p>
      </Section>

      <Section title="2. Uso actual de CoFlow">
        <p>Actualmente CoFlow no utiliza cookies destinadas a publicidad comportamental ni herramientas externas de analítica como Google Analytics o Meta Pixel.</p>
        <p>CoFlow puede utilizar cookies o tecnologías similares estrictamente necesarias para:</p>
        <Ul
          items={[
            "Permitir la autenticación",
            "Mantener una sesión",
            "Proteger las cuentas",
            "Prevenir fraude",
            "Garantizar la seguridad",
            "Proporcionar funciones técnicas solicitadas por el usuario",
          ]}
        />
        <p>Las tecnologías estrictamente necesarias podrán utilizarse sin consentimiento cuando la legislación así lo permita.</p>
      </Section>

      <Section title="3. Tecnologías necesarias">
        <p>Las tecnologías necesarias permiten que CoFlow funcione correctamente.</p>
        <p>Pueden utilizarse, por ejemplo, para mantener una sesión iniciada o proteger determinadas peticiones.</p>
        <p>Estas tecnologías no se utilizan con fines publicitarios.</p>
      </Section>

      <Section title="4. Analítica">
        <p>Actualmente no utilizada.</p>
        <p>Si en el futuro CoFlow incorpora una herramienta de analítica que requiera consentimiento, esta permanecerá desactivada hasta que el usuario la acepte.</p>
      </Section>

      <Section title="5. Publicidad">
        <p>Actualmente no utilizada.</p>
        <p>CoFlow no utiliza actualmente tecnologías destinadas a crear perfiles publicitarios o realizar publicidad comportamental.</p>
      </Section>

      <Section title="6. Personalización">
        <p>CoFlow puede recordar determinadas preferencias cuando resulte necesario para proporcionar funcionalidades solicitadas.</p>
        <p>Si se incorporan tecnologías de personalización opcionales sujetas a consentimiento, permanecerán desactivadas mientras no hayan sido aceptadas.</p>
      </Section>

      <Section title="7. Consentimiento">
        <p>Cuando CoFlow utilice tecnologías que requieran consentimiento, se proporcionará un mecanismo que permita:</p>
        <Ul items={["Aceptar", "Rechazar", "Configurar"]} />
        <p>La opción de rechazo no se ocultará ni se hará deliberadamente más difícil que la aceptación.</p>
      </Section>

      <Section title="8. Modificar el consentimiento">
        <p>Cuando existan cookies opcionales, los usuarios podrán modificar posteriormente su elección mediante la opción: Gestionar cookies</p>
      </Section>

      <Section title="9. Actualizaciones">
        <p>Esta Política se actualizará cuando se incorporen, eliminen o modifiquen tecnologías de almacenamiento utilizadas por CoFlow.</p>
      </Section>

      <Section title="10. Contacto">
        <p>Para consultas relacionadas con privacidad: privacidad@coflowapp.es</p>
      </Section>
    </LegalLayout>
  );
}
