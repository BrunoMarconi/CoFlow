import type { CSSProperties } from "react";

// Escena de "Cómo funciona": el logo de Coflow son dos círculos que se
// solapan, así que aquí los círculos son personas. Tres estados, uno por
// paso, que cambia usePathStory según el paso que estás leyendo:
//   0 · Personas: gente repartida; cuatro encajan contigo (verdes).
//   1 · Comunidad: esos cuatro se juntan y se solapan como en el logo; el
//       resto se aparta.
//   2 · Hogar: se dibuja una casa alrededor del grupo.
// Todo el movimiento es CSS (transiciones sobre data-step): cada círculo
// guarda sus tres posiciones en variables, en unidades del ancho de la
// escena (cqw), así que se escala sola con el contenedor.

type Person = {
  color: string;
  /** Posición [x, y] del centro en cada paso, en % del ancho de la escena
   * medido desde el centro. */
  at: [[number, number], [number, number], [number, number]];
  /** Opacidad en cada paso (los que no encajan se van apagando). */
  opacity?: [number, number, number];
  delay: number;
  float: number;
};

const PEOPLE: Person[] = [
  { color: "#048356", at: [[-32, -22], [-5.5, -5.5], [-5.5, 1]], delay: 0, float: 4.6 },
  { color: "#22473f", at: [[27, -20], [5.5, -5.5], [5.5, 1]], delay: 70, float: 5.3 },
  { color: "#25bd74", at: [[-34, 24], [-5.5, 5.5], [-5.5, 12]], delay: 140, float: 4.2 },
  { color: "#8fd9b3", at: [[38, 6], [5.5, 5.5], [5.5, 12]], delay: 210, float: 5.8 },
  { color: "#d4dad1", at: [[-14, 2], [-40, 6], [-46, 10]], opacity: [1, 0.3, 0], delay: 40, float: 5 },
  { color: "#cdd5cb", at: [[-4, -28], [-18, -35], [-22, -40]], opacity: [1, 0.3, 0], delay: 110, float: 4.4 },
  { color: "#dde2da", at: [[8, 26], [30, 31], [36, 36]], opacity: [1, 0.3, 0], delay: 180, float: 5.5 },
];

function personStyle(person: Person) {
  const style: Record<string, string | number> = {
    "--c": person.color,
    "--d": `${person.delay}ms`,
    "--float": `${person.float}s`,
  };
  person.at.forEach(([x, y], step) => {
    style[`--x${step}`] = x;
    style[`--y${step}`] = y;
  });
  person.opacity?.forEach((value, step) => {
    style[`--o${step}`] = value;
  });
  return style as CSSProperties;
}

export default function PathScene() {
  return (
    <div className="path-scene" data-step="0" data-sr aria-hidden="true">
      <div className="path-stage">
        <svg className="path-house" viewBox="0 0 100 80">
          <rect className="path-house-glow" x="33" y="32" width="34" height="34" rx="2" />
          <path className="path-house-line" d="M28 36 50 17 72 36M33 32v34h34V32" pathLength={1} />
        </svg>
        <span className="path-ring" />
        {PEOPLE.map((person, index) => (
          <span className="path-person" key={index} style={personStyle(person)}>
            <i />
          </span>
        ))}
      </div>
      <ol className="path-scene-steps">
        <li>Personas</li>
        <li>Comunidad</li>
        <li>Hogar</li>
      </ol>
    </div>
  );
}
