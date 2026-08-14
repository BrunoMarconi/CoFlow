import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function AuthBrand() {
  return (
    <Link href="/" className="flex items-center justify-center gap-2">
      <Logo size="md" />
      <span className="text-2xl font-bold text-brand-dark">CoFlow</span>
    </Link>
  );
}
