# CoFlow — Especificación de diseño final del MVP

> Documento maestro para implementar el frontend de CoFlow. Las decisiones textuales de este archivo prevalecen sobre cualquier captura o mockup.

## 1. Alcance y fuente de verdad

CoFlow es una **web responsive, web-first y mobile-first**, desarrollada para comportarse con rapidez y naturalidad en móvil sin imitar una aplicación iOS/Android nativa. El MVP ayuda a personas compatibles a encontrarse, formar una comunidad y organizarse para compartir vivienda. No es un portal inmobiliario ni un dashboard de actividad.

### Jerarquía de autoridad

Si dos fuentes se contradicen, aplicar este orden:

1. Decisiones y cambios textuales obligatorios de este documento.
2. Reglas funcionales del MVP (`MVP_RULES.md`, cuando exista).
3. Comportamiento ya operativo que deba conservarse y contratos existentes del producto.
4. Imágenes de `docs/design/references/`.

Las imágenes son referencias de composición, jerarquía, densidad, estilo y ritmo visual. **La presencia de un elemento en una imagen no autoriza su implementación.** Si una imagen contiene Pasaporte de solvencia, Conexiones, campos descartados, pagos, soporte humano, azules ajenos a la marca o cualquier función excluida aquí, debe ignorarse o sustituirse según esta especificación.

### Alcance técnico

- Implementar como web responsive; no crear vistas, gestos ni navegación nativos de iOS/Android.
- Reutilizar lógica, componentes y contratos existentes cuando sean compatibles.
- No alterar backend ni API únicamente para alcanzar fidelidad visual.
- No inventar estados, métricas ni funciones no descritas.
- Mensajes se conserva en su forma actual, salvo pulido de microinteracciones y coherencia visual.

## 2. Referencias visuales

Directorio esperado: `docs/design/references/`.

| Área | Archivo | Nota |
|---|---|---|
| Onboarding | `onboarding.png` | Referencia final de estructura |
| Explorar | `explorar.png` | Eliminar Pasaporte |
| Crear comunidad, paso 1 | `crear-comunidad-1.png` | Nombre y ciudad obligatorios |
| Crear comunidad, paso 2 | `crear-comunidad-2.png` | Aplicar campos finales |
| Crear comunidad, paso 3 | Sin imagen | Seguir exclusivamente el texto |
| Crear comunidad, paso 4 | `crear-comunidad-4.png` | No mostrar un piso inexistente |
| Invitaciones | `invitaciones.png` | Incluye recibidas y enviadas |
| Guardados | `guardados.png` | Personas y comunidades |
| Perfil | `perfil.png` | Sin Pasaporte ni Conexiones |
| Editar perfil | `editar-perfil.png` | Hub de secciones |
| Fotos | `fotos-perfil.png` | Sustituir todo azul por verde CoFlow |
| Hábitos | `habitos.png` | Selectores rápidos |
| Preferencias | `preferencias-vivienda.png` | La estructura sirve; los campos de la imagen no mandan |
| Datos personales | `datos-personales.png` | Ciudad actual, no ciudad destino |
| Cuenta y seguridad | `cuenta-seguridad.png` | Sin Pasaporte |
| Privacidad | `privacidad.png` | Ajustes sobrios |
| Auth desktop | `auth-desktop.png` | Una imagen combinada para login y registro |
| Login móvil | `login-mobile.png` | Adaptación web móvil |
| Registro móvil | `registro-mobile.png` | Flujo por pasos |
| Notificaciones | `notificaciones.png` | Solo eventos reales del MVP |
| Ayuda | `ayuda.png` | Autoservicio; sin soporte humano ni pagos |
| Estados | `estados.png` | Vacíos, error y loading |

No deben buscarse `login-desktop.png` y `registro-desktop.png`: la referencia desktop combinada se denomina `auth-desktop.png`. La ausencia de `crear-comunidad-3.png` es intencionada.

## 3. Sistema visual global

### Principios

- Blanco predominante y mucho aire.
- Verde oscuro como color de identidad y texto/acento estructural.
- Verde vivo o mint para CTA, selección y estados positivos; usarlo con moderación.
- Neutros cálidos o suaves para fondos secundarios, bordes y skeletons.
- Fotografías humanas auténticas e ilustraciones propias de CoFlow.
- Bordes suaves y radios consistentes; sombras mínimas, difusas y nunca pesadas.
- Cards visuales para descubrimiento, identidad y contenido rico. Filas simples para configuración.
- Una acción primaria clara por pantalla o bloque. La jerarquía no debe depender solo del color.
- Copy breve, humano, directo y tranquilizador. Evitar lenguaje inmobiliario, financiero o corporativo.

### Componentes compartidos

- App shell responsive con navegación global coherente.
- SearchBar protagonista, tabs/segmentos, chips, cards de persona/comunidad, filas de ajustes, avatar stack, medidor de compatibilidad, botones, inputs y textareas.
- Bottom sheet en móvil y diálogo/popover equivalente en desktop para ediciones pequeñas y confirmaciones.
- Toast discreto para éxito reversible; diálogo explícito para acciones sensibles.
- Estados focus visibles, labels persistentes, contraste AA, navegación por teclado y targets táctiles cómodos.
- No comunicar un estado únicamente mediante color; acompañarlo de texto o icono.

### Densidad y layout

- Móvil: una columna, padding lateral aproximado de 16 px, CTA importante accesible sin ocultar contenido.
- Tablet: ampliar espacios y permitir dos columnas solo cuando mejore lectura.
- Desktop: contenedor centrado con ancho máximo; usar columnas para navegación/contexto y contenido cuando proceda, sin estirar formularios.
- Las tarjetas fotográficas pueden formar grids; ajustes y formularios mantienen una anchura legible.
- Respetar safe areas y evitar saltos de layout al cargar fotos, tabs o skeletons.

## 4. Motion y respuesta

La velocidad percibida tiene prioridad sobre la animación.

- Tap, hover y press: **100–140 ms**.
- Cambio de tab o navegación principal: **100–160 ms**.
- Bottom sheet, modal o diálogo: **180–250 ms**.
- Transiciones especiales: alrededor de **250–300 ms**; solo el perfil público puede llegar a 320 ms.
- Personas ↔ Comunidades: `fade` con desplazamiento vertical u horizontal de unos 8 px, 110–140 ms.
- Usar easing suave; evitar rebotes, parallax, flips completos y animaciones protagonistas repetitivas.
- La campana puede tener una microinteracción breve cuando entra una notificación o se marca como leída.
- Respetar `prefers-reduced-motion`: sustituir transformaciones por fades instantáneos o muy breves.
- No retrasar una acción, navegación o render de datos para completar una animación.

## 5. Navegación y arquitectura funcional

Las rutas exactas deben adaptarse al router existente. Como mapa semántico:

- Explorar: `/explorar` con vistas Todo, Personas y Comunidades.
- Crear comunidad: `/comunidades/crear` con pasos 1–4.
- Invitaciones: `/invitaciones`.
- Guardados: `/guardados`.
- Perfil propio: `/perfil`; vista pública: `/perfil/publico` o ruta pública existente.
- Editar perfil y subsecciones: `/perfil/editar/...`.
- Cuenta, privacidad, notificaciones y ayuda bajo sus rutas existentes.
- Login y registro bajo las rutas auth existentes.

No crear una ruta independiente de Conexiones. Una conexión aceptada vive principalmente en Mensajes.

## 6. Pantallas y flujos

### 6.1 Onboarding

**Referencia:** `docs/design/references/onboarding.png`.

**Conservar:** una pregunta por pantalla, barra de progreso superior, respuestas en tarjetas grandes, CTA verde `Continuar`, composición calmada y sensación de avance ligero.

**Cambios/reglas obligatorias:** las preguntas esenciales no admiten omisión. `Más tarde` o `Omitir` aparece exclusivamente en preguntas opcionales. Conservar valores ya introducidos al retroceder. Validar en contexto y explicar de forma breve qué falta.

**Interacciones:** seleccionar una tarjeta debe producir feedback inmediato; `Continuar` avanza con transición corta. Atrás no borra datos. Al finalizar, dirigir a Explorar o al destino operativo existente.

**No implementar:** formulario largo en una sola pantalla, pasos falsos, campos del Pasaporte, promesas de matching absoluto o UI nativa.

### 6.2 Explorar

**Referencia:** `docs/design/references/explorar.png` (tercera dirección elegida).

**Conservar:** inspiración de home de descubrimiento, buscador grande arriba, tabs `Todo · Personas · Comunidades`, hero personalizado tipo `Tu comunidad te espera en Málaga`, carruseles o filas fotográficas de `Vistos recientemente` y `Nuevas coincidencias`.

**Cambios obligatorios:** eliminar por completo la card o mención al Pasaporte. Rellenar su espacio solo con contenido real del MVP; si no hay contenido útil, simplificar el layout. La ciudad del hero debe proceder de la ciudad destino/preferencias, no de la ciudad actual.

**Interacciones:** tabs instantáneos, cards pulsables, scroll horizontal accesible cuando proceda, guardar con corazón sin abrir el detalle. El buscador entra en el modo de búsqueda definido para Personas/Comunidades.

**No implementar:** dashboard de actividad, estadísticas ornamentales, listados de pisos, Pasaporte o secciones financieras.

### 6.3 Personas

**Referencia:** comparte lenguaje con `explorar.png`; no hay archivo independiente.

**Conservar:** SearchBar protagonista, cards fotográficas con nombre, edad cuando proceda, ciudad destino/contexto, rasgos relevantes y compatibilidad. Al pulsar una persona se abre su perfil público o modal de detalle según la arquitectura existente.

**Comportamiento obligatorio:** no hay botón de filtros independiente. Al tocar el buscador se entra visualmente en una página/modo de búsqueda. Con query vacía aparecen filtros desplegados; al escribir, los filtros desaparecen y llegan resultados en tiempo real; al borrar la query vuelven los filtros. Mantener query y filtros al volver.

**No implementar:** swipe tipo dating, conexiones como destino independiente, datos privados, porcentaje sin base real o acciones que parezcan aceptar automáticamente una convivencia.

### 6.4 Comunidades

**Referencia:** lenguaje de `explorar.png` y cards del sistema.

**Conservar:** el mismo patrón de SearchBar y modo de búsqueda que Personas; cards con portada, nombre, ciudad destino, miembros, plazas y datos principales; acceso al detalle.

**Reglas:** query vacía muestra filtros; escribir muestra resultados. El cambio Personas ↔ Comunidades dura 110–140 ms y no debe dominar. Una persona pertenece como máximo a una comunidad activa, aunque puede explorar y recibir invitaciones a otras.

**No implementar:** inventario de viviendas, fotos de pisos inexistentes, unión automática al pulsar una card ni múltiples comunidades activas.

### 6.5 Crear comunidad — marco común

Flujo progresivo de cuatro pasos, con progreso visible, persistencia de borrador y CTA principal inequívoco. Impedir dobles envíos. En desktop no convertirlo en una página excesivamente ancha.

#### Paso 1 — Identidad

**Referencia:** `crear-comunidad-1.png`.

Conservar jerarquía y composición. Campos finales: **nombre de la comunidad** y **ciudad**, ambos obligatorios. Ciudad significa destino donde se quiere compartir piso. Validar antes de continuar.

No mostrar `Más tarde`, zonas preferidas, vivienda concreta ni campos financieros.

#### Paso 2 — Cómo queréis convivir

**Referencia:** `crear-comunidad-2.png`.

Conservar agrupación, controles y aire; aplicar estos campos finales:

- Presupuesto mensual **por persona**, obligatorio.
- Tamaño objetivo de la comunidad, obligatorio.
- Fecha aproximada de entrada, opcional.
- Estilo de convivencia.
- Requisitos adicionales, opcionales.

Los importes deben llevar unidad y dejar inequívoco que son por persona. `Más tarde` solo puede omitir datos opcionales, nunca los obligatorios.

No implementar `Zonas preferidas`, precio total del grupo, tipo de vivienda ni estancia mínima.

#### Paso 3 — Añadir miembros

**Referencia:** no existe; seguir solo esta especificación.

- Título: `Añade a tu gente`.
- Explicar que se puede crear la comunidad en solitario y añadir personas después.
- Mostrar al creador actual (por ejemplo, Bruno) y contador dinámico tipo `1 de 4 miembros`.
- Acciones: `Invitar desde CoFlow`, `Compartir enlace`, `Más tarde` y CTA `Continuar`.
- `Invitar desde CoFlow` despliega buscador/listado de personas compatibles y permite enviar invitaciones.
- Compartir enlace copia o abre el mecanismo web de compartir con feedback de éxito.
- Una invitación enviada queda **pendiente**; nunca añade automáticamente al usuario ni ocupa una plaza confirmada como miembro.

#### Paso 4 — Confirmación

**Referencia:** `crear-comunidad-4.png`.

Conservar el cierre celebratorio, resumen compacto y CTA `Entrar en mi comunidad`. Mostrar miembros confirmados, invitaciones pendientes diferenciadas y plazas disponibles.

Usar ilustración/portada de convivencia o de la ciudad; no fingir que ya existe un piso. Evitar confeti prolongado. Tras entrar, dirigir al espacio real de la comunidad sin crear duplicados al refrescar.

### 6.6 Invitaciones y solicitudes

**Referencia:** `invitaciones.png`.

**Conservar:** tabs `Recibidas / Enviadas`, cards/filas con avatar, compatibilidad, datos principales y acciones claras.

**Contenido:** invitaciones a comunidades y solicitudes de personas para entrar en la comunidad del usuario. En recibidas: `Ver`, `Aceptar`, `Rechazar`; en enviadas: estado pendiente/aceptada/rechazada y cancelación solo si la lógica existente lo permite.

**Reglas críticas:** máximo una comunidad activa por usuario. Se pueden recibir invitaciones estando ya en una. Al aceptar otra, explicar que debe abandonar la actual y pedir confirmación. Si es creador, debe transferir la gestión o, si está solo y el producto lo permite, cerrar la comunidad. Aceptar/rechazar requiere estado de proceso e idempotencia.

**No implementar:** incorporación automática al recibir invitación, ocultar consecuencias, contadores falsos o Conexiones.

### 6.7 Guardados

**Referencia:** `guardados.png`.

Conservar tabs `Personas / Comunidades`. Cards de personas: foto, ciudad/contexto, rasgos y compatibilidad. Cards de comunidades: portada, miembros/plazas y datos principales. Corazón permite quitar de guardados con feedback inmediato y opción de deshacer cuando sea viable.

No mezclar guardados con conexiones, invitaciones o historial. Estado vacío: explicación breve + `Explorar`.

### 6.8 Perfil principal

**Referencia:** `perfil.png`.

**Conservar:** jerarquía inspirada en perfiles claros de marketplace, tarjeta grande superior con foto, nombre y datos; cards visuales útiles debajo; ajustes en filas simples; card horizontal `¿Tienes una vivienda?` solo visual/informativa por ahora.

**Cambios obligatorios:** toda la tarjeta superior abre `Así me ven los demás`. Sustituir cualquier card de Conexiones por Guardados o Invitaciones según relevancia. Mostrar `Mi comunidad` cuando exista y un CTA coherente cuando no exista.

**No implementar:** Pasaporte de solvencia, pantalla/card independiente de Conexiones, métricas decorativas, funcionalidad inmobiliaria detrás de `¿Tienes una vivienda?` o estética de dashboard.

### 6.9 Perfil público — “Así me ven los demás”

**Referencia:** derivada de `perfil.png`, `editar-perfil.png`, `fotos-perfil.png` y `habitos.png`.

Mostrar únicamente datos permitidos por Privacidad: galería, nombre, edad derivada (nunca fecha de nacimiento), bio, ocupación/estudios, ciudad destino, hábitos, preferencias y comunidad cuando corresponda. Distinguir claramente vista propia de vista de terceros.

**Transición especial:** la tarjeta superior se desprende, se desplaza ligeramente a la derecha y realiza un giro 3D sutil para revelar el perfil; 250–320 ms. Compartir foto mediante una transición de elemento compartido (`layoutId`) solo si es estable. Con movimiento reducido, usar fade. Nunca hacer un flip completo o teatral.

No exponer email, teléfono, fecha de nacimiento, dispositivos, ciudad actual si está oculta ni datos de cuenta.

### 6.10 Editar perfil

**Referencia:** `editar-perfil.png`.

Conservar formato de hub, no formulario infinito. Encabezado con foto, nombre y porcentaje de completitud real. Secciones mediante filas con valor actual: Fotos, Bio, Datos personales, Ocupación/estudios, Hábitos, Mascotas, Horarios, Preferencias/presupuesto y demás categorías efectivamente disponibles.

Los cambios pequeños se editan mediante bottom sheet móvil o diálogo compacto desktop y se guardan individualmente/inmediatamente. Indicar progreso, éxito y error sin perder el valor previo. El porcentaje no debe penalizar campos opcionales de forma engañosa.

No mezclar ajustes de seguridad o privacidad con datos del perfil.

### 6.11 Fotos del perfil

**Referencia:** `fotos-perfil.png`.

Conservar composición: foto principal grande, adicionales y hasta aproximadamente seis fotos; añadir, eliminar y reordenar mediante drag & drop. Identificar claramente la principal. Proporcionar alternativa accesible al drag & drop (controles mover anterior/siguiente).

**Cambio obligatorio:** sustituir todos los controles, seleccionados y acentos azules del mockup por la paleta verde/mint de CoFlow. Mantener implementación web responsive, aunque la imagen recuerde a iOS.

Mostrar progreso de subida y error recuperable; comprimir/recortar según capacidades existentes. Confirmar eliminación. No publicar una subida incompleta.

### 6.12 Hábitos y estilo de vida

**Referencia:** `habitos.png`.

Campos: Orden y limpieza, Horarios, Fumar, Mascotas, Visitas, Ruido/tranquilidad, Trabajo/estudio en casa y Vida social en casa. Usar selectores rápidos verdes, lenguaje no moralizante y valores claros. Permitir previsualizar cómo se verán en el perfil público.

No convertir respuestas en juicios, scores absolutos ni campos médicos. Respetar privacidad y permitir estados no informados cuando el campo sea opcional.

### 6.13 Preferencias de vivienda

**Referencia:** `preferencias-vivienda.png`, solo para jerarquía, espaciado, controles y composición responsive.

**Campos finales:**

- Ciudad donde quieres vivir (ciudad destino), obligatoria y principal para matching.
- Presupuesto mensual por persona, obligatorio.
- Fecha aproximada de entrada, opcional.
- Características importantes, opcionales.
- Preferencias adicionales, opcionales.

**Cambios obligatorios:** eliminar `Tipo de vivienda` y `Estancia mínima`, aunque aparezcan en la imagen. La ciudad actual no se edita aquí. Añadir texto suficientemente claro para diferenciar destino y residencia actual. `Más tarde` solo aplica a fecha/características/preferencias opcionales.

**Regla:** matching usa principalmente la ciudad destino. Los importes siempre indican `por persona/mes`.

### 6.14 Datos personales

**Referencia:** `datos-personales.png`.

Campos: Nombre, Apellidos, Fecha de nacimiento, Género opcional, Ciudad actual, Situación actual, Ocupación/estudios, Empresa/universidad opcional y Bio. Públicamente se muestra edad derivada, no fecha de nacimiento.

Incluir bloque informativo `Buscas compartir piso en [ciudad destino]` con acceso para cambiarlo desde Preferencias de vivienda. La ciudad actual debe estar etiquetada inequívocamente y no sustituir el destino.

Ediciones pequeñas mediante sheet/diálogo. No exponer ni inferir información privada en el perfil público sin permiso.

### 6.15 Cuenta y seguridad

**Referencia:** `cuenta-seguridad.png`.

Conservar página de ajustes web por grupos y filas. Contenido: email, teléfono, contraseña, verificación en dos pasos, dispositivos con sesión iniciada, cierre de sesiones remotas, verificación de identidad, datos compartidos, descarga de datos, desactivar cuenta y eliminar cuenta.

Acciones sensibles requieren reautenticación/confirmación acorde a la lógica existente y explicación de consecuencias. Diferenciar desactivar de eliminar; mostrar progreso en exportación de datos.

**No implementar:** Pasaporte de solvencia, solvencia, pagos o controles que el backend no soporte. No simular que 2FA o verificación están activas si no lo están.

### 6.16 Privacidad

**Referencia:** `privacidad.png`.

Conservar estética sobria de ajustes. Controles para visibilidad del perfil, ciudad actual, ciudad destino, edad, ocupación, bio/datos personales, quién puede contactar, uso de datos/cookies, bloqueados y cuentas silenciadas.

Explicar consecuencias junto al control; los defaults deben ser prudentes. Bloquear y silenciar son acciones distintas. Reflejar cambios en el perfil público sin recargar cuando sea posible.

No añadir publicidad, venta de datos o configuraciones legales inexistentes.

### 6.17 Autenticación — desktop y móvil

**Referencias:** `auth-desktop.png`, `login-mobile.png`, `registro-mobile.png`.

**Desktop:** `auth-desktop.png` contiene login y registro en una sola referencia. Conservar hero visual CoFlow, balance entre marca y formulario y composición web.

**Login:** email, contraseña, Google/Apple cuando estén realmente integrados, recuperación de contraseña, estados de error específicos y acceso a registro.

**Registro:** dividido en pasos razonables, progreso visible, persistencia de datos al retroceder y acceso a login. Pedir solo lo necesario en auth; trasladar enriquecimiento al onboarding.

**Móvil:** adaptar a una columna, priorizar formulario, teclado y CTA; conservar carácter web y marca sin ocupar el viewport con hero decorativo. No copiar chrome, barras o patrones nativos del mockup.

No mostrar proveedores sociales no operativos, afirmar que una cuenta existe por motivos de privacidad, ni introducir Pasaporte o pagos.

### 6.18 Notificaciones

**Referencia:** `notificaciones.png`.

Conservar centro completo en desktop y móvil, tabs `Todas / Invitaciones / Mensajes / Actividad / Avisos`, agrupación `Nuevas` y `Anteriores`, CTA contextual y `Marcar todas como leídas`.

Eventos válidos: invitaciones/solicitudes y sus cambios, mensajes, actividad real de comunidad y avisos de cuenta/producto. Cada notificación abre su destino real. Actualizar leído de forma optimista con recuperación ante error. La campana puede usar microinteracción breve.

**No implementar:** notificaciones de pisos, Pasaporte, pagos, logros inventados ni Web Push en este bloque. Web Push queda como posibilidad futura y requiere permiso explícito del usuario.

### 6.19 Centro de ayuda

**Referencia:** `ayuda.png`.

Conservar buscador, categorías y FAQs. Categorías finales: Empezar en CoFlow; Comunidades e invitaciones; Mensajes; Cuenta y seguridad; Privacidad; Solución de problemas. Incluir `Reportar un problema` como formulario de bugs y, opcionalmente, `Enviar feedback`.

**Eliminar obligatoriamente:** `Contactar con soporte`, `¿Necesitas más ayuda?`, chat humano, promesas de respuesta en 24 h, Pagos y suscripciones, métodos de pago y cualquier FAQ del Pasaporte.

El centro es autoservicio. La búsqueda filtra contenido real; si no hay coincidencias, ofrecer categorías o reportar problema, no una falsa vía de soporte.

### 6.20 Estados vacíos, error y loading

**Referencia:** `estados.png`.

Crear un kit reutilizable, consistente y accesible. Mucho blanco, ilustración CoFlow suave, máximo dos líneas de explicación y un CTA solo si hay una acción útil. Un vacío no debe parecer un error.

| Estado | Copy orientativo | Acción |
|---|---|---|
| Sin resultados | `No hemos encontrado coincidencias` / `Prueba cambiando algunos filtros` | `Restablecer filtros` |
| Sin comunidad | `Tu comunidad empieza aquí` / `Crea una comunidad o encuentra una a la que unirte` | `Crear comunidad` (y acceso a explorar si encaja) |
| Sin guardados | `Todavía no has guardado nada` | `Explorar` |
| Sin mensajes | `Aquí aparecerán tus conversaciones` | `Encuentra personas` |
| Sin invitaciones | `Todo al día` / `No tienes invitaciones pendientes` | Sin CTA |
| Error de conexión/carga | `No hemos podido cargar esto` | `Reintentar` |
| Acceso no permitido | Explicar sin revelar datos | Volver a destino seguro |
| 404 | `Parece que esta habitación no existe` | `Volver a Explorar` |

Loading usa skeletons que imitan exactamente el contenido: cards fotográficas para Personas, cards de comunidad, burbujas para Mensajes y filas para Notificaciones. Reservar dimensiones para evitar saltos. Nunca usar un spinner gigante ni una pantalla cuyo único contenido sea `Cargando...`.

Errores de campo se muestran junto al campo; errores de bloque dentro del bloque; errores globales solo cuando toda la pantalla falla. `Reintentar` conserva query/filtros/datos locales.

### 6.21 Mensajes

Mantener la pantalla y lógica actuales para el MVP. Aplicar tokens globales y microinteracciones solo cuando no alteren el flujo. Las conexiones aceptadas viven aquí como conversaciones; no duplicarlas en una pantalla Conexiones.

## 7. Reglas transversales de producto

### Ciudad y matching

- Ciudad actual = dónde reside hoy el usuario; se edita en Datos personales.
- Ciudad destino = dónde quiere compartir piso; se edita en Preferencias de vivienda.
- Matching y descubrimiento usan principalmente ciudad destino.
- Nunca intercambiar etiquetas, valores o usos de ambas ciudades.

### Presupuesto

- En preferencias y creación de comunidad es mensual **por persona**.
- Mostrar unidad y periodicidad en label, resumen y cards pertinentes.
- No transformar el dato en presupuesto total sin una regla explícita.

### Comunidad e invitaciones

- Máximo una comunidad activa por usuario.
- Puede recibir invitaciones aun perteneciendo a una comunidad.
- Aceptar otra exige abandonar la actual.
- Si el usuario es creador, debe transferir gestión o cerrar la comunidad cuando corresponda.
- Invitación enviada = pendiente; no equivale a miembro confirmado.
- Crear comunidad solo requiere miembros opcionales en el paso 3.

### Opcionalidad

- `Más tarde/Omitir` solo aparece si todo lo que deja atrás es opcional.
- Nunca usarlo para nombre/ciudad de comunidad, ciudad destino, presupuesto por persona u otros datos declarados obligatorios.

### Privacidad

- Fecha de nacimiento nunca es pública; solo edad derivada.
- Email, teléfono, seguridad, dispositivos y datos de cuenta nunca aparecen en perfil público.
- La vista pública debe respetar inmediatamente los controles de privacidad.

## 8. Responsive detallado

### Móvil

- Una tarea principal por viewport y una columna.
- Navegación y CTA accesibles con pulgar, sin tapar contenido ni teclado.
- Sheets para filtros/ediciones breves; pantalla completa solo para tareas complejas.
- Carruseles con indicación de contenido adicional y scroll accesible.
- Formularios con tipos de teclado correctos y avance/retroceso que conserva valores.

### Desktop

- Mantener foco mediante ancho máximo y columnas útiles, no agrandar móvil sin criterio.
- Filtros pueden ocupar panel lateral dentro del modo de búsqueda; los resultados conservan prioridad.
- Diálogos sustituyen sheets cuando mejoran contexto.
- Hover complementa, nunca reemplaza información o acción disponible por teclado/touch.

### Breakpoints

Usar los breakpoints del sistema existente. No crear variantes funcionales distintas por dispositivo: mismo contenido, reglas y estados; cambia composición, densidad y patrón de overlay.

## 9. Accesibilidad y calidad

- HTML semántico, orden de foco lógico, focus visible y cierre con Escape en overlays.
- Labels reales en inputs; iconos con nombre accesible; imágenes con texto alternativo útil.
- Contraste mínimo WCAG AA y estados seleccionados perceptibles sin depender del verde.
- Anunciar errores, guardados, invitaciones y cambios de estado importantes a tecnologías asistivas.
- Drag & drop, tabs, carruseles y reordenación deben funcionar con teclado.
- Probar zoom, texto ampliado, teclado móvil, conexión lenta, listas vacías y errores parciales.

## 10. Exclusiones explícitas del MVP

No diseñar, implementar, enlazar ni dejar placeholders navegables para:

- **Pasaporte de solvencia**, verificaciones financieras asociadas o cualquier referencia al mismo.
- **Conexiones como pantalla independiente**; las relaciones aceptadas se materializan en Mensajes.
- Pagos y suscripciones.
- Portal/listado de pisos o funcionalidad real de `¿Tienes una vivienda?`.
- Soporte humano, chat de soporte o promesas de respuesta.
- Web Push en esta fase.
- Tipo de vivienda y estancia mínima en Preferencias.
- Zonas preferidas en Crear comunidad.
- Múltiples comunidades activas por usuario.
- Funciones nativas de iOS/Android o estética Swift copiada literalmente.

Eliminar también referencias residuales a estas funciones en Explorar, Perfil, Cuenta, Ayuda, Notificaciones, onboarding, búsquedas y estados.

## 11. Criterios de aceptación globales

Una implementación se considera alineada cuando:

1. La decisión textual gana ante cualquier contradicción visual.
2. Todas las pantallas se sienten parte del mismo sistema CoFlow.
3. Móvil y desktop cubren el mismo flujo sin pérdida funcional.
4. Ciudad actual/destino y presupuesto por persona se usan correctamente.
5. Las invitaciones respetan estados pendientes y la regla de una comunidad activa.
6. Pasaporte y Conexiones no aparecen en UI, rutas ni copy del MVP.
7. Los vacíos, errores y skeletons son específicos del contenido.
8. Motion es breve, reducible y nunca ralentiza la tarea.
9. Las acciones sensibles tienen confirmación y consecuencias claras.
10. No se han inventado datos, integraciones ni capacidades del backend.

## 12. Guía de uso para implementación

Antes de tocar código, revisar este documento, las referencias y el frontend actual. Elaborar un inventario de rutas/componentes reutilizables y detectar contradicciones. Implementar por bloques: sistema global; Explorar/Personas/Comunidades; creación/invitaciones/guardados; Perfil y edición; ajustes; auth/onboarding; estados y pulido. Verificar cada bloque en móvil y desktop contra su imagen, aplicando siempre las correcciones textuales de esta especificación.

