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
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="./GDMI.png" alt="GDMI Logo" width={80} height={80} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={cn(
                "px-3 py-2 rounded-lg transition-smooth text-sm font-medium flex items-center space-x-2",
                isActive("/")
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Calculator className="h-4 w-4" />
              <span>Calculator</span>
            </Link>

            {isAuthenticated && (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={cn(
                      "px-3 py-2 rounded-lg transition-smooth text-sm font-medium flex items-center space-x-2",
                      isActive("/admin")
                        ? "bg-accent text-accent-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
                {/* <Button size="sm" asChild className="gradient-gold hover-glow">
                  <Link to="/register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Link>
                </Button> */}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className={cn(
                  "px-3 py-2 rounded-lg transition-smooth text-sm font-medium flex items-center space-x-2",
                  isActive("/")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Calculator className="h-4 w-4" />
                <span>Calculator</span>
              </Link>

              {isAuthenticated && (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={cn(
                        "px-3 py-2 rounded-lg transition-smooth text-sm font-medium flex items-center space-x-2",
                        isActive("/admin")
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  )}
                </>
              )}

              <div className="flex flex-col space-y-2 pt-4 border-t">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="justify-start"
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="justify-start"
                    >
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Link>
                    </Button>
                    {/* <Button 
                      size="sm" 
                      asChild
                      className="gradient-gold justify-start"
                    >
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register
                      </Link>
                    </Button> */}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </Card>
  );
}
