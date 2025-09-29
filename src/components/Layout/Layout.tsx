import { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen gradient-elegant">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 JewelCalc. All rights reserved.</p>
            <p className="mt-1">Elegant jewelry price calculations made simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}