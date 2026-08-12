import Image from "next/image";

export default function AuthArtwork({ variant }: { variant: "login" | "register" }) {
  const isLogin = variant === "login";
  return <div className={`relative overflow-hidden rounded-24 border border-border bg-surface shadow-soft ${isLogin ? "h-48 sm:h-full sm:min-h-112" : "h-44 sm:h-full sm:min-h-112"}`}>
    <Image src={isLogin ? "/images/cities/malaga.webp" : "/images/create-community-living-room.webp"} alt={isLogin ? "Una comunidad compartiendo hogar en Málaga" : "Un salón acogedor de CoFlow"} fill priority sizes="(max-width: 640px) 100vw, 42vw" className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/55 via-transparent to-transparent" />
    <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-brand-dark/85 px-4 py-2 text-sm font-bold text-white backdrop-blur">{isLogin ? "Málaga" : "Tu próximo hogar"}</span>
  </div>;
}
