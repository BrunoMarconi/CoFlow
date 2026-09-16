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

/* El backend solo sabe de archivos subidos: elegir un personaje no es un
 * caso aparte, es subir su .webp como si fuera una foto tuya. Así el
 * avatar acaba en el mismo storage y no hace falta una segunda ruta ni
 * una columna "preset_id" que mantener en sincronía. */
export async function avatarPresetToFile(preset: AvatarPreset): Promise<File> {
  const response = await fetch(preset.src);
  if (!response.ok) throw new Error("No se pudo cargar el avatar");

  const blob = await response.blob();
  return new File([blob], `avatar-coflow-${preset.id}.webp`, {
    type: "image/webp",
  });
}
