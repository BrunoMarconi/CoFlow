import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Compatibility from "@/components/landing/Compatibility";
import People from "@/components/landing/People";
import Trust from "@/components/landing/Trust";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

// Secciones que existen pero no se muestran en la home para mantenerla
// corta (CommunityTypes, CityBanner, CommunityPreview, Cities, Owners,
// SolvencyPassport): siguen disponibles en components/landing/ para
// reutilizarse en páginas dedicadas cuando haga falta explicarlas con
// más detalle, sin sobrecargar la primera impresión de CoFlow.
export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-brand-dark">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Compatibility />
      <People />
      <Trust />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
