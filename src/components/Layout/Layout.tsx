import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { LiveGoldRateIndicator } from "../LiveGoldRateIndicator";
import { GoldRateMarquee } from "../GoldRateMarquee";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen gradient-elegant flex flex-col justify-center">
      <Navbar />
      <GoldRateMarquee />
      <main className="flex-1 pb-safe">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}