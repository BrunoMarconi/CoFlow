export const howItWorksSteps = [
  {
    number: "01",
    title: "Descubre",
    description:
      "Encuentra personas y comunidades por ciudad, presupuesto y estilo de convivencia.",
  },
  {
    number: "02",
    title: "Conoce",
    description:
      "Revisa preferencias, presupuesto y condiciones de la plaza antes de hablar con nadie.",
  },
  {
    number: "03",
    title: "Decide",
    description:
      "Escribe en privado con quien encaje y solicita entrar en su comunidad solo cuando tenga sentido.",
  },
] as const;

export const compatibilityAxes = [
  "Limpieza",
  "Energía social",
  "Horario",
  "Financiero",
  "Conflictos",
  "Tolerancia",
] as const;

export const peopleExamples = [
  {
    id: "persona-1",
    role: "Estudiante",
    city: "Málaga",
    budget: "Hasta 350€/mes",
    preferences: ["Ambiente tranquilo", "Sin tabaco"],
  },
  {
    id: "persona-2",
    role: "Profesional",
    city: "Málaga",
    budget: "Hasta 450€/mes",
    preferences: ["Horarios flexibles", "Acepta mascotas"],
  },
  {
    id: "persona-3",
    role: "Autónomo",
    city: "Málaga",
    budget: "Hasta 400€/mes",
    preferences: ["Casa organizada", "Visitas con aviso"],
  },
] as const;

// Ciudades destacadas como ejemplo/punto de entrada en la home — CoFlow
// está disponible en toda España, esta lista no es exhaustiva ni implica
// que otras ciudades estén restringidas (ver componente Cities.tsx).
export const cities = [
  {
    name: "Málaga",
    region: "Andalucía",
    image: "/images/cities/malaga.webp",
    description: "Comunidades en Teatinos, el centro y otras zonas de Málaga.",
  },
  {
    name: "Madrid",
    region: "Comunidad de Madrid",
    image: "/images/cities/madrid.webp",
    description: "Personas y comunidades compatibles en distintos barrios.",
  },
  {
    name: "Barcelona",
    region: "Cataluña",
    image: "/images/cities/barcelona.webp",
    description: "Conecta con personas que buscan compartir hogar.",
  },
  {
    name: "Valencia",
    region: "Comunidad Valenciana",
    image: "/images/cities/valencia.webp",
    description: "Comunidades cerca de universidades y zonas de trabajo.",
  },
  {
    name: "Sevilla",
    region: "Andalucía",
    image: "/images/cities/sevilla.webp",
    description: "Una convivencia compatible en una ciudad llena de vida.",
  },
  {
    name: "Granada",
    region: "Andalucía",
    image: "/images/cities/granada.webp",
    description: "Conecta con estudiantes, trabajadores y nuevas comunidades.",
  },
] as const;

// Funciones reales de seguridad/confianza (verificadas contra el
// backend antes de escribir este copy). No incluir aquí nada que no
// esté implementado — en concreto, CoFlow NO tiene verificación de
// identidad (DNI/selfie) ni de teléfono, así que ese tipo de insignia
// no debe aparecer en esta lista.
export const safetyPoints = [
  {
    icon: "block",
    title: "Bloquea a quien quieras",
    description: "Deja de aparecer para esa persona al instante, sin explicaciones.",
  },
  {
    icon: "flag",
    title: "Denuncia comportamientos",
    description: "Reporta perfiles que no respeten las normas de la comunidad.",
  },
  {
    icon: "lock",
    title: "Controla qué compartes",
    description: "Elige si tu perfil es público o solo visible para tus conexiones.",
  },
  {
    icon: "chat",
    title: "Habla antes de decidir",
    description: "Escribe en privado antes de solicitar una plaza.",
  },
  {
    icon: "mail",
    title: "Email verificado",
    description: "Confirmamos el email de cada cuenta antes de conectar con otras personas.",
  },
] as const;

export const faqItems = [
  {
    question: "¿Qué diferencia hay entre una comunidad y un piso?",
    answer:
      "Un piso es la vivienda física. Una comunidad en CoFlow es el grupo de personas que ya vive o va a vivir en ese piso, con sus propias preferencias de convivencia y plazas disponibles.",
  },
  {
    question: "¿Qué es una plaza abierta?",
    answer:
      "Es un hueco disponible dentro de una comunidad. El número de plazas abiertas se calcula a partir de la capacidad máxima y los miembros actuales de la comunidad.",
  },
  {
    question:
      "¿Qué diferencia hay entre entrar directamente y enviar una solicitud?",
    answer:
      "En una comunidad abierta puedes unirte directamente mientras haya plazas disponibles. En una comunidad con solicitud, el administrador debe revisar y aceptar tu solicitud antes de que entres a formar parte de ella.",
  },
  {
    question: "¿Puedo crear una comunidad si ya vivo con otras personas?",
    answer:
      "Sí. Puedes crear la comunidad indicando su ubicación, capacidad y preferencias, y después ir incorporando o invitando a las personas con las que convives.",
  },
  {
    question: "¿Puedo invitar a mis compañeros actuales?",
    answer:
      "Sí, como administrador de una comunidad puedes invitar directamente a personas concretas, sin que tengan que pasar por el proceso de solicitud.",
  },
  {
    question: "¿Puedo hablar con alguien antes de unirme a su comunidad?",
    answer:
      "Sí. Puedes escribir en privado a cualquier persona que esté buscando compañeros de piso, aunque todavía no pertenezcas a su comunidad, para resolver dudas antes de decidir. El chat grupal de cada comunidad, en cambio, solo se abre a quienes ya forman parte de ella.",
  },
  {
    question: "¿Qué ocurre cuando entro en una comunidad?",
    answer:
      "Pasas a formar parte de sus miembros: puedes ver el resto del perfil de la comunidad y participar en su chat grupal.",
  },
  {
    question: "¿Puedo abandonar una comunidad?",
    answer:
      "Sí, puedes salir de una comunidad de la que formas parte cuando quieras desde tu perfil.",
  },
  {
    question: "¿Se muestran mis ingresos?",
    answer:
      "No. CoFlow no pide ni muestra información sobre tus ingresos personales. Lo que se muestra es la aportación mensual y el depósito asociados a cada comunidad.",
  },
  {
    question: "¿Qué información es pública?",
    answer:
      "Tu perfil público muestra los datos y preferencias que decides compartir para que otras personas puedan valorar la compatibilidad. Tú controlas qué se muestra.",
  },
  {
    question: "¿Cuánto cuesta usar CoFlow?",
    answer:
      "Crear tu perfil, explorar comunidades y hablar con otras personas no tiene coste dentro de la plataforma.",
  },
] as const;
