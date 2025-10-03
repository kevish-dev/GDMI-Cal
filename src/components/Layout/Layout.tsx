import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { ContactSupportBox } from "../ContactSupportBox";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen gradient-elegant flex flex-col justify-center">
      <Navbar />
      <main className="flex-1 pb-safe">
        {children}
      </main>
      
      {/* Footer - Mobile optimized */}
      <footer className="border-t bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          {/* Contact Support in Footer */}
          <div className="mb-6">
            <ContactSupportBox compact={true} className="max-w-md mx-auto" />
          </div>
          
          <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-1">
            <p>&copy; 2024 JewelCalc. All rights reserved.</p>
            <p className="hidden sm:block">Elegant jewelry price calculations made simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}