import Image from "next/image";
import { cn } from "@/lib/utils";

/* Iconos 3D ilustrados (Fluent Emoji, Microsoft, licencia MIT) en vez
 * de los trazos de línea planos anteriores — ver public/icons/3d/.
 * Inactivo: un poco desaturado/tenue. Activo: a todo color. */
export default function Icon3D({
  src,
  alt = "",
  active = true,
  size = 24,
  className,
}: {
  src: string;
  alt?: string;
  active?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "shrink-0 object-contain transition-all duration-180",
        active ? "opacity-100 saturate-100" : "opacity-60 saturate-[0.35]",
        className
      )}
    />
  );
}
