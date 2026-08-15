import type { Metadata } from "next";
import LegalLayout, { Section, Ul, H3 } from "@/components/legal/LegalLayout";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de privacidad" updated="15 de agosto de 2026">
      <Section title="1. Responsable del tratamiento">
        <p>El responsable del tratamiento de los datos personales tratados mediante CoFlow es:</p>
        <Ul
          items={[
            <>Responsable: Daniel Segado Vizcaíno</>,
            <>Condición: Empresario individual / trabajador autónomo</>,
            <>Nombre comercial: CoFlow</>,
            <>NIF: 77663200C</>,
            <>Domicilio profesional: Calle Julio Rodriguez Jorgue número 9, 29139</>,
            <>Sitio web: coflowapp.es</>,
            <>Correo de privacidad: privacidad@coflowapp.es</>,
          ]}
        />
      </Section>

      <Section title="2. Usuarios menores de edad">
        <p>CoFlow permite la creación de cuentas a personas de 14 años o más.</p>
        <p>
          Los usuarios menores de 18 años podrán utilizar funcionalidades como crear su perfil, completar sus
          preferencias de convivencia, descubrir otros usuarios, formar comunidades y explorar viviendas.
        </p>
        <p>
          Determinadas funcionalidades que impliquen contratación, pagos, compromisos económicos, verificación de
          solvencia u otras consecuencias jurídicas podrán estar reservadas a mayores de edad o requerir la
          intervención de padres, tutores o representantes legales cuando la legislación así lo exija.
        </p>
        <p>CoFlow no permite actualmente crear cuentas a menores de 14 años.</p>
      </Section>

      <Section title="3. Datos que podemos tratar">
        <p>Dependiendo de las funcionalidades utilizadas, CoFlow puede tratar los siguientes datos.</p>
        <div className="space-y-4">
          <div>
            <H3>Datos de cuenta</H3>
            <p className="mt-1">
              Nombre, dirección de correo electrónico, fecha de nacimiento, identificador de usuario, credenciales
              protegidas e información necesaria para verificar y proteger la cuenta.
            </p>
          </div>
          <div>
            <H3>Datos de perfil</H3>
            <p className="mt-1">Fotografía, descripción, ciudad, información de presentación y demás información que el usuario decida incorporar.</p>
          </div>
          <div>
            <H3>Preferencias de vivienda y convivencia</H3>
            <p className="mt-1">
              Presupuesto, ubicación, horarios, limpieza, mascotas, tabaco, ruido, visitas, teletrabajo, rutinas,
              preferencias de convivencia, características buscadas en una vivienda y respuestas proporcionadas
              durante el onboarding.
            </p>
          </div>
          <div>
            <H3>Comunidades</H3>
            <p className="mt-1">Comunidades creadas, comunidades a las que pertenece el usuario, miembros, invitaciones, solicitudes y actividad relacionada.</p>
          </div>
          <div>
            <H3>Interacciones</H3>
            <p className="mt-1">Solicitudes, matches, favoritos, bloqueos, reportes y otras acciones realizadas dentro de CoFlow.</p>
          </div>
          <div>
            <H3>Propiedades</H3>
            <p className="mt-1">Fotografías, ubicación, características, precio, equipamiento, disponibilidad y otra información facilitada por propietarios o anunciantes.</p>
          </div>
          <div>
            <H3>Datos técnicos y de seguridad</H3>
            <p className="mt-1">Dirección IP, navegador, dispositivo, registros de acceso, información de sesión, fechas y horas de actividad y eventos técnicos o de seguridad.</p>
          </div>
          <div>
            <H3>Comunicaciones</H3>
            <p className="mt-1">Consultas, emails, solicitudes de soporte, reclamaciones, denuncias y comunicaciones relacionadas con la cuenta.</p>
          </div>
        </div>
      </Section>

      <Section title="4. Finalidades del tratamiento">
        <div className="space-y-4">
          <div>
            <H3>Crear y gestionar una cuenta</H3>
            <p className="mt-1">Utilizamos los datos necesarios para registrar, verificar, autenticar y gestionar las cuentas.</p>
            <p className="mt-1 italic">Base jurídica: ejecución del servicio solicitado y aplicación de medidas precontractuales.</p>
          </div>
          <div>
            <H3>Prestar CoFlow</H3>
            <p className="mt-1">Utilizamos la información necesaria para proporcionar perfiles, comunidades, recomendaciones, búsqueda de viviendas, solicitudes y demás funcionalidades.</p>
            <p className="mt-1 italic">Base jurídica: ejecución del servicio.</p>
          </div>
          <div>
            <H3>Matching y recomendaciones</H3>
            <p className="mt-1">CoFlow utiliza determinadas preferencias proporcionadas por los usuarios para calcular compatibilidad y recomendar personas, comunidades e inmuebles.</p>
            <p className="mt-1 italic">Base jurídica: ejecución del servicio solicitado.</p>
          </div>
          <div>
            <H3>Seguridad y prevención del fraude</H3>
            <p className="mt-1">Podremos analizar información técnica y actividad para detectar accesos no autorizados, cuentas fraudulentas, estafas, abuso y otras amenazas.</p>
            <p className="mt-1 italic">Base jurídica: interés legítimo en proteger CoFlow y a sus usuarios y, cuando corresponda, cumplimiento de obligaciones legales.</p>
          </div>
          <div>
            <H3>Moderación</H3>
            <p className="mt-1">Podremos tratar perfiles, propiedades, publicaciones, reportes y otras interacciones para aplicar nuestras normas y cumplir nuestras obligaciones legales.</p>
            <p className="mt-1 italic">Base jurídica: prestación del servicio, interés legítimo y cumplimiento de obligaciones legales cuando corresponda.</p>
          </div>
          <div>
            <H3>Atención al usuario</H3>
            <p className="mt-1">Utilizaremos la información que nos proporciones para atender solicitudes, incidencias y reclamaciones.</p>
            <p className="mt-1 italic">Base jurídica: ejecución del servicio e interés legítimo.</p>
          </div>
          <div>
            <H3>Comunicaciones comerciales</H3>
            <p className="mt-1">Cuando corresponda y contemos con la base jurídica necesaria, podremos enviar comunicaciones comerciales de CoFlow.</p>
            <p className="mt-1">Cuando estas comunicaciones dependan del consentimiento, este podrá retirarse en cualquier momento.</p>
          </div>
        </div>
      </Section>

      <Section title="5. Matching">
        <p>CoFlow utiliza determinadas respuestas y preferencias para estimar la compatibilidad entre usuarios.</p>
        <p>Por ejemplo:</p>
        <Ul items={["Ubicación", "Presupuesto", "Horarios", "Limpieza", "Mascotas", "Tabaco", "Ruido", "Visitas", "Teletrabajo", "Otras preferencias relacionadas con la convivencia"]} />
        <p>Una puntuación o recomendación de compatibilidad constituye únicamente una estimación y no garantiza una convivencia satisfactoria.</p>
        <p>El sistema ordinario de matching de CoFlow no está diseñado para tomar por sí mismo decisiones que produzcan efectos jurídicos sobre los usuarios.</p>
      </Section>

      <Section title="6. Información especialmente protegida">
        <p>CoFlow no necesita para realizar su matching información relativa a cuestiones como:</p>
        <Ul
          items={[
            "Origen racial o étnico",
            "Opiniones políticas",
            "Religión",
            "Afiliación sindical",
            "Información genética",
            "Datos biométricos utilizados para identificación",
            "Salud",
            "Vida u orientación sexual",
          ]}
        />
        <p>Los usuarios no deben incluir innecesariamente esta información en campos de texto libre.</p>
      </Section>

      <Section title="7. Información visible para otros usuarios">
        <p>Determinados datos del perfil podrán mostrarse a otros usuarios cuando sea necesario para proporcionar las funciones sociales y de matching de CoFlow.</p>
        <p>CoFlow diferenciará, cuando resulte necesario, entre información privada e información visible para otros usuarios.</p>
        <p>Las contraseñas, credenciales e información de seguridad no se mostrarán públicamente.</p>
      </Section>

      <Section title="8. Proveedores tecnológicos">
        <p>CoFlow utiliza proveedores externos necesarios para prestar el servicio.</p>
        <div className="space-y-4">
          <div><H3>Vercel</H3><p className="mt-1">Alojamiento y distribución del frontend.</p></div>
          <div><H3>Render</H3><p className="mt-1">Alojamiento del backend y API.</p></div>
          <div><H3>Neon</H3><p className="mt-1">Alojamiento de la base de datos PostgreSQL.</p></div>
          <div><H3>Resend</H3><p className="mt-1">Envío de emails transaccionales, incluyendo verificación de cuentas y recuperación del acceso.</p></div>
          <div><H3>Cloudflare R2</H3><p className="mt-1">Almacenamiento y distribución de imágenes, incluyendo fotografías asociadas a perfiles y propiedades.</p></div>
        </div>
        <p>Estos proveedores podrán tratar determinada información únicamente en la medida necesaria para proporcionar sus servicios.</p>
      </Section>

      <Section title="9. Autenticación">
        <p>CoFlow utiliza un sistema propio de autenticación.</p>
        <p>Las contraseñas no deberán almacenarse en texto plano y se utilizarán medidas técnicas destinadas a proteger las credenciales de los usuarios.</p>
        <p>CoFlow podrá utilizar tokens de autenticación para identificar sesiones y autorizar peticiones a la API.</p>
      </Section>

      <Section title="10. Pagos">
        <p>Actualmente CoFlow no ofrece servicios o suscripciones de pago.</p>
        <p>Antes de incorporar Stripe u otro proveedor de pagos se actualizará esta Política de Privacidad y se proporcionará la información correspondiente.</p>
      </Section>

      <Section title="11. Analítica">
        <p>Actualmente CoFlow no utiliza herramientas externas de analítica o publicidad destinadas a realizar seguimiento del comportamiento del usuario.</p>
        <p>Si se incorporan posteriormente, esta Política será actualizada y se solicitará consentimiento cuando resulte necesario.</p>
      </Section>

      <Section title="12. Open Banking y solvencia">
        <p>Actualmente CoFlow no accede a cuentas bancarias ni ofrece funcionalidades de Open Banking o pasaporte de solvencia.</p>
        <p>Antes de activar estas funciones se realizará el análisis correspondiente y se informará a los usuarios de qué información se procesa, para qué se utiliza, durante cuánto tiempo y con qué proveedores.</p>
      </Section>

      <Section title="13. Transferencias internacionales">
        <p>Algunos proveedores utilizados por CoFlow pueden implicar tratamientos o accesos desde países situados fuera del Espacio Económico Europeo.</p>
        <p>Cuando resulte necesario, CoFlow aplicará los mecanismos y garantías establecidos por la legislación de protección de datos.</p>
      </Section>

      <Section title="14. Conservación">
        <p>Los datos relacionados con la cuenta y el perfil se conservarán mientras la cuenta permanezca activa.</p>
        <p>
          Tras solicitar la eliminación, los datos dejarán de utilizarse para las finalidades ordinarias y serán
          eliminados, anonimizados o, cuando corresponda, bloqueados durante el periodo necesario para cumplir
          obligaciones legales o atender responsabilidades.
        </p>
        <p>Los registros técnicos y de seguridad se conservarán únicamente durante los períodos razonablemente necesarios.</p>
      </Section>

      <Section title="15. Derechos del usuario">
        <p>Los usuarios podrán ejercer, cuando proceda, sus derechos de:</p>
        <Ul items={["Acceso", "Rectificación", "Supresión", "Oposición", "Limitación", "Portabilidad"]} />
        <p>También podrán retirar los consentimientos otorgados.</p>
        <p>Las solicitudes podrán enviarse a: privacidad@coflowapp.es</p>
        <p>Podremos solicitar información adicional cuando resulte necesaria para verificar la identidad de la persona solicitante.</p>
        <p>El usuario también tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.</p>
      </Section>

      <Section title="16. Eliminación de cuenta">
        <p>CoFlow ofrecerá un mecanismo para solicitar o ejecutar la eliminación de la cuenta.</p>
        <p>Determinada información podrá conservarse bloqueada cuando resulte necesario para cumplir obligaciones legales, resolver reclamaciones, combatir fraude o atender posibles responsabilidades.</p>
      </Section>

      <Section title="17. Seguridad">
        <p>CoFlow aplicará medidas técnicas y organizativas destinadas a proteger la información personal frente a pérdida, acceso no autorizado, modificación o divulgación indebida.</p>
      </Section>

      <Section title="18. Modificaciones">
        <p>Esta Política podrá actualizarse cuando cambien las funcionalidades, proveedores, tratamientos o legislación aplicable.</p>
        <p>Los cambios relevantes serán comunicados cuando corresponda.</p>
      </Section>
    </LegalLayout>
  );
}
