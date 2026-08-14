import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Compatibility from "@/components/landing/Compatibility";
import CommunityTypes from "@/components/landing/CommunityTypes";
import CityBanner from "@/components/landing/CityBanner";
import CommunityPreview from "@/components/landing/CommunityPreview";
import People from "@/components/landing/People";
import Cities from "@/components/landing/Cities";
import Trust from "@/components/landing/Trust";
import Owners from "@/components/landing/Owners";
import SolvencyPassport from "@/components/landing/SolvencyPassport";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-brand-dark">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Compatibility />
      <CommunityTypes />
      <CityBanner />
      <CommunityPreview />
      <People />
      <Cities />
      <Trust />
      <Owners />
      <SolvencyPassport />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
