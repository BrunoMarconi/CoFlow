import SkeletonCard from "@/components/ui/SkeletonCard";

export default function AppLoading() {
  return <div className="mx-auto w-full max-w-5xl" aria-label="Cargando contenido" aria-busy="true"><div className="h-7 w-48 animate-pulse rounded-full bg-[#e7eaed]" /><div className="mt-3 h-3 w-72 max-w-full animate-pulse rounded-full bg-[#eef0f2]" /><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard withCover /><SkeletonCard withCover /><SkeletonCard withCover /></div></div>;
}
