/* Los personajes de CoFlow: la alternativa a subir una foto propia para
 * quien no quiere enseñar la cara. Viven aquí y no dentro de un
 * componente porque los usan dos sitios —el onboarding y el editor de
 * perfil— y tienen que ofrecer exactamente los mismos. */

export type AvatarPreset = {
  id: string;
  name: string;
  description: string;
  src: string;
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  {
    id: "olivo",
    name: "Olivo",
    description: "Cálido y natural",
    src: "/images/avatar-presets/avatar-olivo.webp",
  },
  {
    id: "terracota",
    name: "Terracota",
    description: "Creativa y alegre",
    src: "/images/avatar-presets/avatar-terracota.webp",
  },
  {
    id: "marino",
    name: "Marino",
    description: "Sereno y moderno",
    src: "/images/avatar-presets/avatar-marino.webp",
  },
  {
    id: "cielo",
    name: "Cielo",
    description: "Suave y luminoso",
    src: "/images/avatar-presets/avatar-cielo.webp",
  },
] as const;

export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
