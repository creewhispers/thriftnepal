import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Categories } from "@/components/site/Categories";
import { Feed } from "@/components/site/Feed";
import { Sellers } from "@/components/site/Sellers";
import { Manifesto } from "@/components/site/Manifesto";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "thriftdepo.np — Nepal's online thrift marketplace" },
      { name: "description", content: "Buy, sell, and rewear vintage, streetwear, sneakers and handmade fashion across Nepal. Built for Gen Z, powered by local sellers." },
      { property: "og:title", content: "thriftdepo.np — Buy. Sell. Rewear." },
      { property: "og:description", content: "Nepal's online thrift marketplace for vintage, streetwear, and sustainable fashion." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <div className="mt-16 md:mt-24">
          <Marquee />
        </div>
        <Categories />
        <Feed />
        <Sellers />
        <Manifesto />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
