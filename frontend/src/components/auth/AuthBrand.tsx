import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function AuthBrand() {
  return <div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-2"><Logo size="md" /><span className="text-2xl font-bold text-brand-dark">CoFlow</span></Link><span className="rounded-14 border border-border bg-surface px-3 py-2 text-sm font-semibold text-secondary shadow-soft">ES</span></div>;
}
