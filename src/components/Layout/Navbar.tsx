import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Gem,
  Calculator,
  Settings,
  LogIn,
  UserPlus,
  Menu,
  X,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <Card className="border-0 rounded-none shadow-card sticky top-0 z-50 bg-card/95 backdrop-blur">
      <nav className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo - Mobile optimized */}
          <Link to="/" className="flex items-center">
            <img 
              src="./GDMI.png" 
              alt="GDMI Logo" 
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link
              to="/"
              className={cn(
                "px-3 py-2 rounded-xl transition-all text-sm font-medium flex items-center space-x-2",
                isActive("/")
                  ? "bg-[#8B7355] text-white shadow-card"
                  : "text-muted-foreground hover:bg-[#E5DDD5]"
              )}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/calculator"
              className={cn(
                "px-3 py-2 rounded-xl transition-all text-sm font-medium flex items-center space-x-2",
                isActive("/calculator")
                  ? "bg-[#8B7355] text-white shadow-card"
                  : "text-muted-foreground hover:bg-[#E5DDD5]"
              )}
            >
              <Calculator className="h-4 w-4" />
              <span>Calculator</span>
            </Link>

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-3 py-2 rounded-xl transition-all text-sm font-medium flex items-center space-x-2",
                  isActive("/admin")
                    ? "bg-[#8B7355] text-white shadow-card"
                    : "text-muted-foreground hover:bg-[#E5DDD5]"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Auth Buttons - Desktop only */}
          {/* <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={handleLogout}
                className="bg-[#8B7355] hover:bg-[#7A6349] text-white rounded-xl transition-all"
              >
                Logout
              </Button>
            ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-[#E5DDD5] rounded-xl transition-all"
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
            )}
          </div> */}

          {/* Mobile Menu Button - Enhanced for touch */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-10 w-10 p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu - Enhanced */}
        {isOpen && (
          <div className="md:hidden mt-3 pb-3 border-t pt-3 animate-fade-in">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className={cn(
                  "px-4 py-3 rounded-xl transition-all text-base font-medium flex items-center space-x-3",
                  isActive("/")
                    ? "bg-[#8B7355] text-white"
                    : "text-muted-foreground hover:bg-[#E5DDD5]"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>

              <Link
                to="/calculator"
                className={cn(
                  "px-4 py-3 rounded-xl transition-all text-base font-medium flex items-center space-x-3",
                  isActive("/calculator")
                    ? "bg-[#8B7355] text-white"
                    : "text-muted-foreground hover:bg-[#E5DDD5]"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Calculator className="h-5 w-5" />
                <span>Calculator</span>
              </Link>

              {isAuthenticated && isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "px-4 py-3 rounded-xl transition-all text-base font-medium flex items-center space-x-3",
                    isActive("/admin")
                      ? "bg-[#8B7355] text-white"
                      : "text-muted-foreground hover:bg-[#E5DDD5]"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* <div className="flex flex-col space-y-2 pt-3 border-t mt-2">
                {isAuthenticated ? (
                  <Button
                    size="default"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="justify-start text-base h-12 bg-[#8B7355] hover:bg-[#7A6349] text-white rounded-xl transition-all"
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="default"
                    asChild
                    className="justify-start text-base h-12 hover:bg-[#E5DDD5] rounded-xl transition-all"
                  >
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LogIn className="h-5 w-5 mr-3" />
                      Login
                    </Link>
                  </Button>
                )}
              </div> */}
            </div>
          </div>
        )}
      </nav>
    </Card>
  );
}
