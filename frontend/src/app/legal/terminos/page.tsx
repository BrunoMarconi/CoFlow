import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { Section, Ul, H3 } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos y condiciones de uso" updated="15 de agosto de 2026">
      <p className="-mt-2 text-xs font-semibold text-muted">Versión: 1.0</p>

      <Section title="1. Titular">
        <p>CoFlow es operado por:</p>
        <Ul
          items={[
            <>Daniel Segado Vizcaíno</>,
            <>Empresario individual / trabajador autónomo</>,
            <>NIF: 77663200C</>,
            <>Domicilio profesional: Calle Julio Rodriguez Jorgue número 9, 29139</>,
            <>Email: legal@coflowapp.es</>,
          ]}
        />
      </Section>

      <Section title="2. Aceptación">
        <p>Al crear una cuenta en CoFlow, el usuario declara haber leído y aceptado estos Términos y Condiciones.</p>
        <p>El tratamiento de los datos personales se explica separadamente en nuestra Política de Privacidad.</p>
      </Section>

      <Section title="3. Edad y usuarios menores">
        <p>Para crear una cuenta en CoFlow es necesario tener 14 años o más.</p>
        <p>Los usuarios menores de 18 años pueden utilizar funcionalidades como:</p>
        <Ul
          items={[
            "Crear su perfil",
            "Completar preferencias",
            "Descubrir posibles compañeros",
            "Crear o unirse a comunidades",
            "Explorar viviendas",
            "Preparar su futura búsqueda de alojamiento",
          ]}
        />
        <p>La utilización de CoFlow por una persona menor de edad no significa que pueda celebrar por sí sola cualquier contrato relacionado con una vivienda.</p>
        <p>
          Determinadas funcionalidades relacionadas con contratos, pagos, compromisos económicos, verificación de
          solvencia u otras obligaciones jurídicas podrán requerir la mayoría de edad o la participación de padres,
          tutores o representantes legales cuando así lo exija la legislación.
        </p>
      </Section>

      <Section title="4. Qué es CoFlow">
        <p>CoFlow permite, entre otras cosas:</p>
        <Ul
          items={[
            "Crear perfiles",
            "Indicar preferencias de convivencia",
            "Encontrar posibles compañeros de vivienda",
            "Recibir recomendaciones",
            "Crear comunidades",
            "Incorporarse a comunidades",
            "Descubrir propiedades",
            "Interactuar con propietarios",
            "Realizar solicitudes",
          ]}
        />
      </Section>

      <Section title="5. Qué no es CoFlow">
        <p>Salvo que se indique expresamente otra cosa, CoFlow:</p>
        <Ul
          items={[
            "No es propietario de los inmuebles publicados por terceros",
            "No es arrendador ni arrendatario",
            "No se convierte en parte de los contratos celebrados entre usuarios",
            "No garantiza que una propiedad continúe disponible",
            "No garantiza una convivencia satisfactoria",
            "No garantiza la identidad, situación económica o solvencia de un usuario salvo que indique expresamente que una comprobación concreta ha sido realizada",
          ]}
        />
      </Section>

      <Section title="6. Cuenta">
        <p>Los usuarios deberán proporcionar información razonablemente veraz y mantener actualizados los datos relevantes.</p>
        <p>Cada usuario es responsable de proteger sus credenciales.</p>
        <p>No está permitido:</p>
        <Ul items={["Vender cuentas", "Acceder a cuentas ajenas", "Suplantar personas", "Crear identidades falsas para cometer fraude", "Eludir deliberadamente sistemas de seguridad"]} />
      </Section>

      <Section title="7. Matching">
        <p>CoFlow puede utilizar preferencias y respuestas proporcionadas por los usuarios para calcular compatibilidad y recomendar perfiles, comunidades o propiedades.</p>
        <p>Una puntuación de compatibilidad es únicamente una estimación.</p>
        <p>CoFlow no garantiza que dos personas recomendadas sean compatibles en la vida real.</p>
      </Section>

      <Section title="8. Comunidades">
        <p>Los usuarios pueden crear y formar parte de comunidades.</p>
        <p>Cada usuario es responsable de sus propias acciones y decisiones.</p>
        <p>CoFlow podrá intervenir cuando una comunidad sea utilizada para incumplir estos Términos, las Normas de la Comunidad o la legislación.</p>
      </Section>

      <Section title="9. Propiedades">
        <p>La persona que publique un inmueble declara tener legitimidad suficiente para anunciarlo y proporcionar información razonablemente veraz.</p>
        <p>No está permitido publicar:</p>
        <Ul
          items={[
            "Viviendas inexistentes",
            "Fotografías utilizadas sin permiso",
            "Información deliberadamente falsa",
            "Precios engañosos",
            "Propiedades que no se esté legitimado para ofrecer",
            "Ofertas fraudulentas",
            "Condiciones ilegales",
            "Anuncios discriminatorios",
          ]}
        />

        <H3>Publicación de propiedades y tarifas</H3>
        <p>La publicación de cada inmueble está asociada a su propio plan. Cada propiedad dispone de 30 días gratuitos desde su publicación.</p>
        <p>Tras finalizar el periodo gratuito, la publicación tendrá un coste de <strong>23,99 € al mes por propiedad</strong>. La suscripción se renovará automáticamente de forma mensual mientras permanezca activa. El propietario podrá cancelar la renovación de cada propiedad desde su cuenta.</p>
        <p>Cada propiedad tiene su propio ciclo de facturación. Por tanto, si un propietario mantiene varias propiedades activas, se cobrará la tarifa correspondiente por cada una. Ejemplo: 3 propiedades activas sujetas a facturación = 3 × 23,99 € = 71,97 €/mes.</p>
        <p>Antes de publicar se mostrará al propietario: el precio, la duración del periodo gratuito, la fecha del primer cobro, la periodicidad, la renovación automática y las instrucciones de cancelación. No se realizará ningún cargo durante los primeros 30 días.</p>

        <H3>Renovación automática</H3>
        <p>Una vez finalizados los 30 días gratuitos, CoFlow cobrará automáticamente 23,99 € cada mes utilizando el método de pago autorizado por el propietario, salvo que este haya cancelado previamente la renovación.</p>

        <H3>Cancelación</H3>
        <p>La cancelación impedirá futuras renovaciones. La propiedad podrá permanecer publicada hasta el final del periodo gratuito o del periodo mensual ya abonado. Después se desactivará salvo que se reactive una suscripción válida.</p>
        <p>
          Más detalle en las{" "}
          <Link href="/legal/condiciones-propietarios" className="font-bold text-primary-dark underline underline-offset-4">
            Condiciones para propietarios
          </Link>
          .
        </p>
      </Section>

      <Section title="10. Igualdad y no discriminación">
        <p>CoFlow no permite utilizar la plataforma para realizar discriminaciones contrarias a la legislación aplicable.</p>
        <p>Las normas de igualdad se aplican especialmente a anuncios, condiciones y decisiones relacionadas con acceso a vivienda.</p>
        <p>CoFlow podrá retirar contenidos o limitar cuentas cuando detecte incumplimientos.</p>
        <p>
          En España, la Ley 15/2022 obliga expresamente a respetar el derecho a la igualdad de trato también en venta,
          alquiler, intermediación inmobiliaria y portales de anuncios.
        </p>
      </Section>

      <Section title="11. Contenido de los usuarios">
        <p>Los usuarios conservan los derechos que les correspondan sobre los textos, fotografías y demás materiales que publiquen.</p>
        <p>Al publicar contenido en CoFlow, conceden a CoFlow una licencia no exclusiva y limitada para:</p>
        <Ul items={["Almacenarlo", "Alojarlo", "Reproducirlo técnicamente", "Adaptarlo técnicamente", "Mostrarlo dentro de CoFlow"]} />
        <p>en la medida necesaria para proporcionar el servicio.</p>
      </Section>

      <Section title="12. Conductas prohibidas">
        <p>No está permitido utilizar CoFlow para:</p>
        <Ul
          items={[
            "Estafar",
            "Cometer fraude",
            "Amenazar",
            "Acosar",
            "Discriminar ilegalmente",
            "Suplantar personas",
            "Publicar información privada de terceros",
            "Distribuir spam",
            "Distribuir malware",
            "Vulnerar derechos de terceros",
            "Atacar la infraestructura",
            "Realizar scraping abusivo o no autorizado",
            "Manipular artificialmente el sistema",
            "Publicar contenido ilegal",
          ]}
        />
      </Section>

      <Section title="13. Moderación">
        <p>Cuando exista una causa justificada, CoFlow podrá:</p>
        <Ul items={["Emitir advertencias", "Retirar contenidos", "Limitar su visibilidad", "Restringir funcionalidades", "Suspender temporalmente cuentas", "Cerrar cuentas en casos graves o reiterados"]} />
      </Section>

      <Section title="14. Denuncias">
        <p>Los usuarios podrán denunciar perfiles, propiedades y otros contenidos mediante las herramientas disponibles en CoFlow.</p>
        <p>El contenido potencialmente ilegal también podrá notificarse mediante: coflowapp.es/legal/reportar</p>
      </Section>

      <Section title="15. Revisión de decisiones">
        <p>Si un usuario considera que una decisión de moderación ha sido incorrecta podrá contactar con: soporte@coflowapp.es</p>
        <p>CoFlow revisará la situación cuando corresponda.</p>
      </Section>

      <Section title="16. Seguridad">
        <p>No está permitido:</p>
        <Ul items={["Acceder a sistemas sin autorización", "Atacar CoFlow", "Introducir malware", "Explotar vulnerabilidades con intención maliciosa", "Intentar evadir controles de seguridad"]} />
      </Section>

      <Section title="17. Eliminación de cuenta">
        <p>Los usuarios podrán solicitar o ejecutar el cierre de sus cuentas mediante los mecanismos disponibles en CoFlow.</p>
        <p>Determinada información podrá conservarse temporalmente cuando sea necesario para cumplir obligaciones legales o atender responsabilidades.</p>
      </Section>

      <Section title="18. Disponibilidad">
        <p>CoFlow podrá introducir, modificar o retirar funcionalidades cuando resulte necesario por motivos técnicos, de producto, seguridad o cumplimiento normativo.</p>
      </Section>

      <Section title="19. Pagos">
        <p>Actualmente CoFlow no ofrece funcionalidades de pago.</p>
        <p>Cuando se incorporen servicios Premium, suscripciones u otros pagos, se publicarán las correspondientes Condiciones de Contratación antes de su activación.</p>
      </Section>

      <Section title="20. Modificaciones de estos Términos">
        <p>CoFlow podrá actualizar estos Términos.</p>
        <p>Los cambios relevantes serán comunicados adecuadamente cuando corresponda.</p>
      </Section>

      <Section title="21. Legislación">
        <p>Estos Términos se rigen por la legislación española y europea aplicable.</p>
        <p>Los usuarios consumidores mantendrán los derechos que les reconozca obligatoriamente la legislación aplicable.</p>
      </Section>

      <Section title="22. Contacto">
        <p>legal@coflowapp.es</p>
      </Section>
    </LegalLayout>
  );
}
