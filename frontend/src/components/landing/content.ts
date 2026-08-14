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
      "Habla, conecta con quien encaje y solicita entrar solo cuando tenga sentido.",
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

export const cities = [
  {
    name: "Málaga",
    region: "Andalucía",
    image: "/images/cities/malaga.webp",
    description: "Comunidades en Teatinos, el centro y otras zonas de Málaga.",
    available: true,
  },
  {
    name: "Madrid",
    region: "Comunidad de Madrid",
    image: "/images/cities/madrid.webp",
    description: "Personas y comunidades compatibles en distintos barrios.",
    available: false,
  },
  {
    name: "Barcelona",
    region: "Cataluña",
    image: "/images/cities/barcelona.webp",
    description: "Conecta con personas que buscan compartir hogar.",
    available: false,
  },
  {
    name: "Valencia",
    region: "Comunidad Valenciana",
    image: "/images/cities/valencia.webp",
    description: "Comunidades cerca de universidades y zonas de trabajo.",
    available: false,
  },
  {
    name: "Sevilla",
    region: "Andalucía",
    image: "/images/cities/sevilla.webp",
    description: "Una convivencia compatible en una ciudad llena de vida.",
    available: false,
  },
  {
    name: "Granada",
    region: "Andalucía",
    image: "/images/cities/granada.webp",
    description: "Conecta con estudiantes, trabajadores y nuevas comunidades.",
    available: false,
  },
] as const;

export const trustPoints = [
  {
    title: "Conoce cómo conviven",
    without: "Entras a ciegas, sin saber cómo vive la gente",
    description:
      "Cada comunidad muestra sus preferencias de convivencia antes de que hables con nadie.",
  },
  {
    title: "Habla antes de entrar",
    without: "Hablas por primera vez ya viviendo allí",
    description:
      "Usa el chat para resolver dudas con la comunidad antes de solicitar una plaza.",
  },
  {
    title: "Comprueba si el presupuesto encaja",
    without: "El precio real se aclara cuando ya es tarde",
    description:
      "La aportación mensual y el depósito están visibles desde el primer momento.",
  },
  {
    title: "Controla tu privacidad",
    without: "No decides qué compartes ni cuándo",
    description:
      "Decides qué información de tu perfil es pública antes de compartirla.",
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
