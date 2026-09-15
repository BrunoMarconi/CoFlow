// Fuente única de las FAQ: la usa Landing.tsx para pintarlas y page.tsx
// para generar el JSON-LD de FAQPage. Google exige que el texto
// estructurado coincida literalmente con el visible, así que no se
// duplica en ningún sitio.
export const faqs: [string, string][] = [
  ["¿Qué es exactamente Coflow?", "Coflow es una plataforma para conocer personas compatibles con las que compartir piso y crear comunidades de convivencia. Puedes comparar hábitos, presupuesto y preferencias antes de decidir con quién vivir."],
  ["¿Necesito tener ya un piso?", "No. Puedes empezar por conocer personas y formar una comunidad. Si ya tienes una vivienda, puedes consultar el espacio para propietarios y descubrir cómo funciona."],
  ["¿Crear mi perfil es gratis?", "Sí. Puedes crear tu perfil gratis y contar cómo te gusta convivir para empezar a conocer personas y comunidades."],
  ["¿Dónde está disponible?", "El lanzamiento de Coflow está centrado en Málaga. Queremos construir una comunidad local útil, empezando por conectar a personas que buscan compartir casa en la misma ciudad."],
];
